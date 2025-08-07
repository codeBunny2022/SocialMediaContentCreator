/**
 * LLM configuration and utilities
 */

import { ChatOpenAI } from '@langchain/openai';
import { generateContentWithLLM, parseLLMResponse } from './llm.js';

export class LLMConfig {
  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.model = null;
  }

  async initialize() {
    try {
      if (!this.openaiKey) {
        throw new Error('OpenAI API key is required. Please set OPENAI_API_KEY in your .env file');
      }

      this.model = new ChatOpenAI({
        modelName: 'gpt-4',
        temperature: 0.7,
        maxTokens: 2000,
        openAIApiKey: this.openaiKey,
      });
      
      console.log('✅ Using OpenAI GPT-4 model');
      
    } catch (error) {
      console.error('❌ LLM initialization failed:', error.message);
      throw new Error('Failed to initialize OpenAI model. Please check your API key.');
    }
  }

  getModel() {
    return this.model;
  }

  isAvailable() {
    return this.model !== null;
  }
}

export async function generateContentWithLLM(prompt, llmConfig) {
  try {
    if (!llmConfig.isAvailable()) {
      throw new Error('LLM not available');
    }

    const model = llmConfig.getModel();
    const response = await model.invoke(prompt);
    
    return response.content;
  } catch (error) {
    console.error('LLM generation failed:', error);
    throw new Error('Failed to generate content with LLM');
  }
}

export function parseLLMResponse(response, type = 'json') {
  try {
    if (type === 'json') {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Try to extract array from the response
      const arrayMatch = response.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
      
      // If response contains quotes or brackets, try to extract items
      if (response.includes('"') || response.includes('[')) {
        const lines = response.split('\n').filter(line => line.trim());
        const items = lines.map(line => 
          line.replace(/^[-*]\s*/, '').replace(/["\[\]]/g, '').trim()
        ).filter(item => item.length > 0);
        
        if (items.length > 0) {
          return items;
        }
      }
      
      throw new Error('No valid JSON found in response');
    }
    
    return response;
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    throw new Error('Invalid LLM response format');
  }
}

export const prompts = {
  dayPlanner: (brandTheme, duration) => `
Generate exactly ${duration} social media topic names for "${brandTheme}".

Format each topic as:
- [Topic Name]

Example for "Fitness for Busy Professionals":
- Morning Workout Tips
- Office Exercise Routine
- Quick Lunch Workout

List exactly ${duration} topics, one per line with "- " prefix.
`,

  contentGenerator: (topic, brandTheme) => `
Create social media content for: "${topic}" about "${brandTheme}".

Format your response as:
Caption: [1-2 sentences engaging caption]
Hashtags: [3-5 relevant hashtags]

Topic: ${topic}
Brand Theme: ${brandTheme}
`,

  contentGeneratorBatch: (topics, brandTheme) => `
Create social media content for the following topics about "${brandTheme}".

For each topic, provide:
- Caption: 1-2 sentences
- Hashtags: 3-5 relevant hashtags

Topics: ${topics.join(', ')}

Format as JSON array with objects containing: topic, caption, hashtags
`,

  profileAnalyzer: (profileData) => `
Analyze this LinkedIn profile data and provide insights:

Profile: ${JSON.stringify(profileData)}

Provide analysis in JSON format with:
- professional: {currentRole, company, industry, seniorityLevel, yearsOfExperience}
- skills: {technical, soft, trending, totalCount, topSkills}
- experience: {summary, roles, totalExperience, careerProgression}
- brandInsights: {personalBrand, targetAudience, uniqueValueProposition, contentThemes, brandVoice}
- contentStrategy: {contentMix, postingSchedule, hashtagStrategy, engagementStrategy, contentGoals}
`,

  industryResearcher: (industry, keywords) => `
Research industry trends and news for "${industry}" with keywords: ${keywords.join(', ')}

Provide analysis in JSON format with:
- trends: [{keyword, volume, growth}]
- news: [{title, description, source, relevance}]
- insights: {
  topTrends: [],
  emergingTopics: [],
  contentOpportunities: [],
  hashtagSuggestions: [],
  engagementPredictions: []
}
`,

  contentStrategist: (profileAnalysis, industryResearch) => `
Develop a content strategy based on:

Profile Analysis: ${JSON.stringify(profileAnalysis)}
Industry Research: ${JSON.stringify(industryResearch)}

Provide strategy in JSON format with:
- brandVoice: string
- targetAudience: {primary, secondary, tertiary}
- contentThemes: []
- contentMix: {educational, industryInsights, personalStories, engagement}
- hashtagStrategy: {primary, secondary, trending, general, custom}
- engagementStrategy: {responseTime, interactionFrequency, communityParticipation, contentSharing}
- postingSchedule: {frequency, optimalDays, optimalTimes, timezone}
- contentGoals: {thoughtLeadership, industryInsights, networking, personalBrand}
`,

  automatedPoster: (contentType, theme, brandVoice) => `
Generate a LinkedIn post for:
Content Type: ${contentType}
Theme: ${theme}
Brand Voice: ${brandVoice}

Create engaging, professional content that aligns with the brand voice.
Keep it under 1300 characters for LinkedIn.
Include relevant hashtags at the end.
`
}; 