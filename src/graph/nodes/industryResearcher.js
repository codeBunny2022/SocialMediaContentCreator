import { IndustryResearchService } from '../../services/industryResearch.js';

export class IndustryResearcherNode {
  constructor() {
    this.researchService = new IndustryResearchService();
  }

  async execute(state) {
    try {
      console.log('Industry Researcher Node: Starting industry research...');
      
      const { industry, keywords } = this.validateInput(state);
      
      // Research industry trends and news
      const research = await this.researchService.researchIndustryTrends(industry, keywords);
      
      // Save research data to database
      await this.researchService.saveIndustryResearch(state.userId, research);
      
      console.log('Industry Researcher Node: Research completed');
      return state.updateIndustryResearch(research);
      
    } catch (error) {
      console.error('Industry Researcher Node Error:', error);
      return state.setError(`Industry research failed: ${error.message}`);
    }
  }

  validateInput(state) {
    if (!state.industry) {
      throw new Error('Industry is required for research');
    }
    
    return {
      industry: state.industry,
      keywords: state.keywords || []
    };
  }
} 