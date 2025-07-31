/**
 * LLM configuration and utilities
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import dotenv from 'dotenv';

dotenv.config();

// LLM configuration
export class LLMConfig {
  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY;
    this.useLocal = !this.openaiKey;
    this.model = null;
  }

  async initialize() {
    try {
      if (this.openaiKey) {
        this.model = new ChatOpenAI({
          modelName: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1000,
        });
        console.log('Using OpenAI model');
      } else {
        // Try to use local Ollama model
        try {
          this.model = new ChatOllama({
            model: process.env.OLLAMA_MODEL || 'smollm',
            temperature: 0.7,
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
          });
          console.log(`Using local Ollama model: ${process.env.OLLAMA_MODEL || 'smollm'}`);
        } catch (error) {
          console.log('No local model available, using rule-based generation');
          this.model = null;
        }
      }
    } catch (error) {
      console.log('LLM initialization failed, using rule-based generation');
      this.model = null;
    }
  }

  getModel() {
    return this.model;
  }

  isAvailable() {
    return this.model !== null;
  }
}

// Content generation with LLM fallback
export async function generateContentWithLLM(prompt, llmConfig) {
  if (!llmConfig.isAvailable()) {
    throw new Error('LLM not available');
  }

  try {
    const model = llmConfig.getModel();
    const response = await model.invoke(prompt);
    return response.content;
  } catch (error) {
    console.error('LLM generation failed:', error);
    throw new Error('LLM generation failed');
  }
}

// Prompt templates
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

Caption: (1-2 sentences)
Hashtags: (3-5 hashtags)

Topic: ${topic}
`,

  contentGeneratorBatch: (topics, brandTheme) => `
You are a social media content creator. Create engaging content for multiple topics related to "${brandTheme}".

For each topic, create:
- A compelling caption (1-2 sentences)
- 3-5 relevant hashtags

Format your response as a JSON array:
[
  {
    "topic": "Topic 1",
    "caption": "Engaging caption for topic 1",
    "hashtags": "#Hashtag1 #Hashtag2 #Hashtag3"
  },
  {
    "topic": "Topic 2", 
    "caption": "Engaging caption for topic 2",
    "hashtags": "#Hashtag1 #Hashtag2 #Hashtag3"
  }
]

Topics: ${JSON.stringify(topics)}
Brand Theme: ${brandTheme}
`
};

// Parse LLM responses
export function parseLLMResponse(response, type = 'json') {
  try {
    if (type === 'json') {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // For smaller models that might not generate proper JSON, try to parse as array
      const arrayMatch = response.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
      }
      
      // If no JSON found, try to extract topics from text
      if (response.includes('"') || response.includes('[')) {
        // Try to clean up the response and extract items
        const lines = response.split('\n').filter(line => line.trim());
        const items = lines.map(line => line.replace(/^[-*]\s*/, '').replace(/["\[\]]/g, '').trim()).filter(item => item.length > 0);
        if (items.length > 0) {
          return items;
        }
      }
      
      // Try to extract topics from longer responses
      const lines = response.split('\n');
      const topics = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        // Look for lines that start with "- " or contain topic-like content
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const topic = trimmed.replace(/^[-*]\s*/, '').trim();
          if (topic.length > 3 && !topic.toLowerCase().includes('topic')) {
            topics.push(topic);
          }
        }
        // Look for numbered items like "1. **Topic Name**"
        else if (/^\d+\.\s*\*\*([^*]+)\*\*/.test(trimmed)) {
          const match = trimmed.match(/^\d+\.\s*\*\*([^*]+)\*\*/);
          if (match && match[1].trim().length > 3) {
            topics.push(match[1].trim());
          }
        }
        // Also look for lines that might be topic titles (short, capitalized)
        else if (trimmed.length > 5 && trimmed.length < 50 && 
                 trimmed[0] === trimmed[0].toUpperCase() && 
                 !trimmed.includes(':')) {
          topics.push(trimmed);
        }
      }
      
      if (topics.length > 0) {
        return topics;
      }
      
      throw new Error('No valid JSON found in response');
    }
    return response;
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    throw new Error('Invalid LLM response format');
  }
} 