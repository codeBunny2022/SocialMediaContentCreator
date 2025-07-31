/**
 * Day Planner Node
 * Generates topic ideas based on brand theme using LLM with template fallback
 */

import { getTemplatesForTheme } from '../../utils/templates.js';
import { generateContentWithLLM, prompts, parseLLMResponse } from '../../utils/llm.js';

export class DayPlannerNode {
  constructor(llmConfig) {
    this.llmConfig = llmConfig;
  }

  async execute(state) {
    try {
      console.log('Day Planner Node: Starting topic generation...');
      
      const { brandTheme, duration } = this.validateInput(state);
      let topics = await this.generateTopics(brandTheme, duration);
      
      console.log(`Day Planner Node: Generated ${topics.length} topics`);
      return state.updateTopics(topics);
      
    } catch (error) {
      console.error('Day Planner Node Error:', error);
      return state.setError(`Day Planner failed: ${error.message}`);
    }
  }

  validateInput(state) {
    const brandTheme = state.getBrandTheme();
    const duration = state.getDuration();
    
    if (!brandTheme?.trim()) {
      throw new Error('Brand theme is required');
    }
    
    if (!duration || duration < 1 || duration > 30) {
      throw new Error('Duration must be between 1 and 30 days');
    }
    
    return { brandTheme: brandTheme.trim(), duration };
  }

  async generateTopics(brandTheme, duration) {
    // Try LLM-based generation first
    if (this.llmConfig.isAvailable()) {
      const llmTopics = await this.generateWithLLM(brandTheme, duration);
      if (llmTopics.length > 0) {
        return llmTopics.slice(0, duration);
      }
    }
    
    // Fallback to template-based generation
    return this.generateFromTemplates(brandTheme, duration);
  }

  async generateWithLLM(brandTheme, duration) {
    try {
      console.log('Day Planner Node: Using LLM for topic generation...');
      
      const prompt = prompts.dayPlanner(brandTheme, duration);
      const response = await generateContentWithLLM(prompt, this.llmConfig);
      const parsedResponse = parseLLMResponse(response);
      
      if (!Array.isArray(parsedResponse)) {
        throw new Error('Invalid response format from LLM');
      }
      
      const topics = this.extractTopicsFromResponse(parsedResponse, duration);
      
      console.log('Day Planner Node: LLM generated topics:', topics);
      return topics;
      
    } catch (error) {
      console.log('Day Planner Node: LLM failed, falling back to templates...');
      return [];
    }
  }

  extractTopicsFromResponse(response, duration) {
    const topics = [];
    
    for (const item of response) {
      if (topics.length >= duration) break;
      
      const cleanedTopic = this.cleanTopic(item);
      if (cleanedTopic && cleanedTopic.length > 3 && !this.isGenericTopic(cleanedTopic)) {
        topics.push(cleanedTopic);
      }
    }
    
    // If we don't have enough topics, try to extract from the response text
    if (topics.length < duration) {
      const additionalTopics = this.extractAdditionalTopics(response, duration - topics.length);
      topics.push(...additionalTopics);
    }
    
    return topics.slice(0, duration);
  }

  extractAdditionalTopics(response, needed) {
    const additionalTopics = [];
    
    for (const item of response) {
      if (additionalTopics.length >= needed) break;
      
      // Look for numbered topics in the text
      const numberedMatches = item.match(/\d+\.\s*([^*\n]+)/g);
      if (numberedMatches) {
        for (const match of numberedMatches) {
          if (additionalTopics.length >= needed) break;
          const topic = this.cleanTopic(match);
          if (topic && topic.length > 3 && !this.isGenericTopic(topic)) {
            additionalTopics.push(topic);
          }
        }
      }
    }
    
    return additionalTopics;
  }

  generateFromTemplates(brandTheme, duration) {
    console.log('Day Planner Node: Using template-based generation...');
    
    const templates = getTemplatesForTheme(brandTheme);
    const shuffledTopics = this.shuffleArray([...templates.topics]);
    
    return shuffledTopics.slice(0, duration);
  }

  isGenericTopic(topic) {
    const trimmed = topic.trim();
    return (
      /^topic\s*\d+$/i.test(trimmed) ||
      trimmed.length < 5 ||
      trimmed.toLowerCase().includes('topic') ||
      trimmed.toLowerCase().includes('example')
    );
  }

  cleanTopic(topic) {
    if (!topic) return '';
    
    return topic
      .trim()
      .replace(/^\d+\.\s*/, '') // Remove numbering like "1. "
      .replace(/^[-*]\s*/, '') // Remove list markers
      .replace(/^["']|["']$/g, '') // Remove quotes
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\*/g, '') // Remove markdown italic
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 100); // Limit length
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
} 