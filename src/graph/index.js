/**
 * Main LangGraph structure for Social Media Content Creator
 */

import { LLMConfig } from '../utils/llm.js';
import { DayPlannerNode } from './nodes/dayPlanner.js';
import { ContentGeneratorNode } from './nodes/contentGenerator.js';
import { FormatterNode } from './nodes/formatter.js';
import { SaveNode } from './nodes/save.js';
import { ProfileAnalyzerNode } from './nodes/profileAnalyzer.js';
import { IndustryResearcherNode } from './nodes/industryResearcher.js';
import { ContentStrategistNode } from './nodes/contentStrategist.js';
import { AutomatedPosterNode } from './nodes/automatedPoster.js';
import { LinkedInPersonalBrandingState } from '../state.js';

export class LinkedInPersonalBrandingGraph {
  constructor() {
    this.llmConfig = new LLMConfig();
    this.nodes = {
      profileAnalyzer: new ProfileAnalyzerNode(),
      industryResearcher: new IndustryResearcherNode(),
      contentStrategist: new ContentStrategistNode(),
      automatedPoster: new AutomatedPosterNode(),
      dayPlanner: new DayPlannerNode(this.llmConfig),
      contentGenerator: new ContentGeneratorNode(this.llmConfig),
      formatter: new FormatterNode(),
      save: new SaveNode()
    };
  }

  async execute(initialState) {
    try {
      console.log('LinkedIn Personal Branding Graph: Starting execution...');
      
      // Initialize LLM
      await this.llmConfig.initialize();
      
      // Create state
      const state = new LinkedInPersonalBrandingState();
      
      // Copy initial state properties
      if (initialState.userId) state.updateUser(
        initialState.userId,
        initialState.accessToken,
        initialState.refreshToken,
        initialState.linkedinProfileId
      );
      
      if (initialState.industry) state.industry = initialState.industry;
      if (initialState.duration) state.duration = initialState.duration;
      if (initialState.keywords) state.keywords = initialState.keywords;
      
      console.log('=== LinkedIn Personal Branding AI Agent ===');
      console.log(`User ID: ${state.userId || 'Not set'}`);
      console.log(`Industry: ${state.industry || 'Not set'}`);
      console.log(`Duration: ${state.duration || 'Not set'} days`);
      
      // Execute nodes in sequence
      await this.executeProfileAnalysis(state);
      await this.executeIndustryResearch(state);
      await this.executeContentStrategy(state);
      await this.executeAutomatedPosting(state);
      
      // Optional: Execute legacy content generation for CSV export
      if (initialState.generateCSV) {
        await this.executeLegacyContentGeneration(state);
      }
      
      console.log('=== Execution Complete ===');
      console.log(`Status: ${state.status}`);
      console.log(`Error: ${state.error || 'None'}`);
      
      return state;
      
    } catch (error) {
      console.error('LinkedIn Personal Branding Graph Error:', error);
      const state = new LinkedInPersonalBrandingState();
      return state.setError(`Graph execution failed: ${error.message}`);
    }
  }

  async executeProfileAnalysis(state) {
    try {
      console.log('=== Profile Analyzer Node ===');
      state = await this.nodes.profileAnalyzer.execute(state);
      
      if (state.hasError()) {
        throw new Error(state.error);
      }
      
      console.log('✅ Profile analysis completed');
      return state;
      
    } catch (error) {
      console.error('Profile Analysis failed:', error);
      return state.setError(`Profile analysis failed: ${error.message}`);
    }
  }

  async executeIndustryResearch(state) {
    try {
      console.log('=== Industry Researcher Node ===');
      state = await this.nodes.industryResearcher.execute(state);
      
      if (state.hasError()) {
        throw new Error(state.error);
      }
      
      console.log('✅ Industry research completed');
      return state;
      
    } catch (error) {
      console.error('Industry Research failed:', error);
      return state.setError(`Industry research failed: ${error.message}`);
    }
  }

  async executeContentStrategy(state) {
    try {
      console.log('=== Content Strategist Node ===');
      state = await this.nodes.contentStrategist.execute(state);
      
      if (state.hasError()) {
        throw new Error(state.error);
      }
      
      console.log('✅ Content strategy developed');
      return state;
      
    } catch (error) {
      console.error('Content Strategy failed:', error);
      return state.setError(`Content strategy failed: ${error.message}`);
    }
  }

  async executeAutomatedPosting(state) {
    try {
      console.log('=== Automated Poster Node ===');
      state = await this.nodes.automatedPoster.execute(state);
      
      if (state.hasError()) {
        throw new Error(state.error);
      }
      
      console.log('✅ Automated posting configured');
      return state;
      
    } catch (error) {
      console.error('Automated Posting failed:', error);
      return state.setError(`Automated posting failed: ${error.message}`);
    }
  }

  async executeLegacyContentGeneration(state) {
    try {
      console.log('=== Legacy Content Generation (CSV Export) ===');
      
      // Create legacy state for CSV generation
      const legacyState = {
        brandTheme: state.industry || 'Professional Development',
        duration: state.duration || 30,
        topics: [],
        content: [],
        formattedContent: [],
        outputFile: null,
        error: null
      };
      
      // Execute legacy nodes
      console.log('=== Day Planner Node ===');
      legacyState = await this.nodes.dayPlanner.execute(legacyState);
      
      if (legacyState.error) {
        throw new Error(legacyState.error);
      }
      
      console.log('=== Content Generator Node ===');
      legacyState = await this.nodes.contentGenerator.execute(legacyState);
      
      if (legacyState.error) {
        throw new Error(legacyState.error);
      }
      
      console.log('=== Formatter Node ===');
      legacyState = await this.nodes.formatter.execute(legacyState);
      
      if (legacyState.error) {
        throw new Error(legacyState.error);
      }
      
      console.log('=== Save Node ===');
      legacyState = await this.nodes.save.execute(legacyState);
      
      if (legacyState.error) {
        throw new Error(legacyState.error);
      }
      
      console.log(`✅ CSV export completed: ${legacyState.outputFile}`);
      return state;
      
    } catch (error) {
      console.error('Legacy Content Generation failed:', error);
      return state.setError(`CSV export failed: ${error.message}`);
    }
  }

  // Method to get graph status
  getStatus() {
    return {
      nodes: Object.keys(this.nodes),
      llmAvailable: this.llmConfig.isAvailable(),
      model: this.llmConfig.getModel()?.constructor.name || 'OpenAI GPT-4'
    };
  }

  // Method to close all resources
  close() {
    Object.values(this.nodes).forEach(node => {
      if (node.close) {
        node.close();
      }
    });
  }
} 