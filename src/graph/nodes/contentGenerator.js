/**
 * Content Generator Node
 * Creates captions and hashtags for each topic using LLM with template fallback
 */

import { getTemplatesForTheme } from '../../utils/templates.js';
import { generateContentWithLLM, prompts, parseLLMResponse } from '../../utils/llm.js';

export class ContentGeneratorNode {
  constructor(llmConfig) {
    this.llmConfig = llmConfig;
  }

  async execute(state) {
    try {
      console.log('Content Generator Node: Starting content generation...');
      
      const { topics, brandTheme } = this.validateInput(state);
      console.log('Content Generator Node: Processing topics:', topics);
      
      const content = await this.generateContent(topics, brandTheme);
      
      console.log(`Content Generator Node: Generated content for ${content.length} topics`);
      return state.updateContent(content);
      
    } catch (error) {
      console.error('Content Generator Node Error:', error);
      return state.setError(`Content Generator failed: ${error.message}`);
    }
  }

  validateInput(state) {
    const topics = state.getTopics();
    const brandTheme = state.getBrandTheme();
    
    if (!topics?.length) {
      throw new Error('No topics available for content generation');
    }
    
    if (!brandTheme?.trim()) {
      throw new Error('Brand theme is required');
    }
    
    return { topics, brandTheme: brandTheme.trim() };
  }

  async generateContent(topics, brandTheme) {
    // Always process individually for better quality and control
    return await this.generateIndividualContent(topics, brandTheme);
  }

  async generateIndividualContent(topics, brandTheme) {
    const content = [];
    
    for (const topic of topics) {
      try {
        const contentItem = await this.generateSingleContent(topic, brandTheme);
        content.push(contentItem);
      } catch (error) {
        console.log(`Content Generator Node: Individual processing failed for topic: ${topic}`);
        const fallbackContent = this.generateFromTemplate(topic, brandTheme);
        content.push(fallbackContent);
      }
    }
    
    return content;
  }

  async generateSingleContent(topic, brandTheme) {
    try {
      const prompt = prompts.contentGenerator(topic, brandTheme);
      const response = await generateContentWithLLM(prompt, this.llmConfig);
      
      // Extract content from text response (more reliable than JSON parsing)
      return this.extractFromText(response, topic, brandTheme);
      
    } catch (error) {
      console.log(`Content Generator Node: LLM generation failed for topic: ${topic}`);
      return this.generateFromTemplate(topic, brandTheme);
    }
  }

  extractFromText(response, topic, brandTheme) {
    const lines = response.split('\n').filter(line => line.trim());
    let caption = this.generateFallbackCaption(topic, brandTheme);
    let hashtags = this.generateFallbackHashtags(brandTheme);
    
    let foundCaption = false;
    let foundHashtags = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for caption
      if (!foundCaption && (
        trimmedLine.toLowerCase().includes('caption:') || 
        trimmedLine.toLowerCase().includes('caption') ||
        (trimmedLine.length > 20 && !trimmedLine.includes('#'))
      )) {
        caption = trimmedLine.replace(/caption:?\s*/i, '').trim();
        if (caption.length > 10) {
          foundCaption = true;
        }
      }
      
      // Look for hashtags
      if (!foundHashtags && (
        trimmedLine.toLowerCase().includes('hashtag') || 
        trimmedLine.includes('#') ||
        trimmedLine.toLowerCase().includes('tags')
      )) {
        hashtags = trimmedLine.replace(/hashtag:?\s*/i, '').replace(/tags:?\s*/i, '').trim();
        if (hashtags.includes('#')) {
          foundHashtags = true;
        }
      }
    }
    
    // Clean up the extracted content
    caption = this.cleanCaption(caption, topic, brandTheme);
    hashtags = this.cleanHashtags(hashtags, brandTheme);
    
    return { topic, caption, hashtags };
  }

  cleanCaption(caption, topic, brandTheme) {
    if (!caption || caption.length < 10) {
      return this.generateFallbackCaption(topic, brandTheme);
    }
    
    return caption
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 200); // Limit length
  }

  cleanHashtags(hashtags, brandTheme) {
    if (!hashtags || !hashtags.includes('#')) {
      return this.generateFallbackHashtags(brandTheme);
    }
    
    // Extract hashtags
    const hashtagMatches = hashtags.match(/#[\w]+/g) || [];
    const cleanedHashtags = hashtagMatches
      .map(tag => tag.toLowerCase())
      .filter(tag => tag.length > 1)
      .slice(0, 5);
    
    return cleanedHashtags.length > 0 ? cleanedHashtags.join(' ') : this.generateFallbackHashtags(brandTheme);
  }

  generateFromTemplate(topic, brandTheme) {
    const templates = getTemplatesForTheme(brandTheme);
    
    // Try to find matching template content
    const topicIndex = templates.topics.findIndex(t => 
      t.toLowerCase().includes(topic.toLowerCase()) || 
      topic.toLowerCase().includes(t.toLowerCase())
    );
    
    let caption, hashtags;
    
    if (topicIndex !== -1 && topicIndex < templates.captions.length) {
      caption = templates.captions[topicIndex];
      hashtags = templates.hashtags[topicIndex];
    } else {
      // Generate fallback content
      caption = this.generateFallbackCaption(topic, brandTheme);
      hashtags = this.generateFallbackHashtags(brandTheme);
    }
    
    return { topic, caption, hashtags };
  }

  generateFallbackCaption(topic, brandTheme) {
    const captions = [
      `Discover the power of ${topic.toLowerCase()} and transform your ${brandTheme.toLowerCase()} journey.`,
      `Ready to level up your ${brandTheme.toLowerCase()}? Start with ${topic.toLowerCase()} today!`,
      `${topic} is the key to unlocking your ${brandTheme.toLowerCase()} potential.`,
      `Master ${topic.toLowerCase()} and watch your ${brandTheme.toLowerCase()} goals become reality.`,
      `Your ${brandTheme.toLowerCase()} journey starts with ${topic.toLowerCase()}. Are you ready?`
    ];
    
    return captions[Math.floor(Math.random() * captions.length)];
  }

  generateFallbackHashtags(brandTheme) {
    const baseHashtags = [
      `#${brandTheme.replace(/\s+/g, '')}`,
      `#${brandTheme.split(' ')[0]}`,
      `#Content`,
      `#Tips`,
      `#Motivation`
    ];
    
    return baseHashtags.slice(0, 3).join(' ');
  }
} 