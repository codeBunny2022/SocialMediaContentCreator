/**
 * Main LangGraph structure for Social Media Content Creator
 */

import { ContentCreatorState } from '../state.js';
import { DayPlannerNode } from './nodes/dayPlanner.js';
import { ContentGeneratorNode } from './nodes/contentGenerator.js';
import { FormatterNode } from './nodes/formatter.js';
import { SaveNode } from './nodes/save.js';
import { LLMConfig } from '../utils/llm.js';

export class ContentCreatorGraph {
  constructor() {
    this.llmConfig = new LLMConfig();
    this.nodes = {
      dayPlanner: new DayPlannerNode(this.llmConfig),
      contentGenerator: new ContentGeneratorNode(this.llmConfig),
      formatter: new FormatterNode(),
      save: new SaveNode()
    };
  }

  async initialize() {
    await this.llmConfig.initialize();
  }

  async execute(brandTheme, duration = 30) {
    try {
      console.log('Content Creator Graph: Starting execution...');
      console.log(`Brand Theme: ${brandTheme}`);
      console.log(`Duration: ${duration} days`);

      // Initialize state
      const state = new ContentCreatorState(brandTheme, duration);
      
      if (!state.isValid()) {
        throw new Error('Invalid state: Brand theme is required and duration must be between 1-30 days');
      }

      // Execute nodes in sequence
      console.log('\n=== Day Planner Node ===');
      let currentState = await this.nodes.dayPlanner.execute(state);
      
      if (currentState.getError()) {
        throw new Error(currentState.getError());
      }

      console.log('\n=== Content Generator Node ===');
      currentState = await this.nodes.contentGenerator.execute(currentState);
      
      if (currentState.getError()) {
        throw new Error(currentState.getError());
      }

      console.log('\n=== Formatter Node ===');
      currentState = await this.nodes.formatter.execute(currentState);
      
      if (currentState.getError()) {
        throw new Error(currentState.getError());
      }

      console.log('\n=== Save Node ===');
      currentState = await this.nodes.save.execute(currentState);
      
      if (currentState.getError()) {
        throw new Error(currentState.getError());
      }

      console.log('\n=== Execution Complete ===');
      console.log(`Output file: ${currentState.getOutputFile()}`);
      console.log(`Total content items: ${currentState.getFormattedContent().length}`);

      return {
        success: true,
        outputFile: currentState.getOutputFile(),
        contentCount: currentState.getFormattedContent().length,
        content: currentState.getFormattedContent(),
        csvData: currentState.toCSVData()
      };

    } catch (error) {
      console.error('Content Creator Graph Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Execute individual nodes for testing
  async executeNode(nodeName, state) {
    if (!this.nodes[nodeName]) {
      throw new Error(`Unknown node: ${nodeName}`);
    }

    return await this.nodes[nodeName].execute(state);
  }

  // Get graph status
  getStatus() {
    return {
      llmAvailable: this.llmConfig.isAvailable(),
      nodes: Object.keys(this.nodes),
      initialized: this.llmConfig.model !== null
    };
  }

  // Validate input
  validateInput(brandTheme, duration) {
    const errors = [];

    if (!brandTheme || brandTheme.trim().length === 0) {
      errors.push('Brand theme is required');
    }

    if (!duration || duration < 1 || duration > 30) {
      errors.push('Duration must be between 1 and 30 days');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
} 