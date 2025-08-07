/**
 * State management for the Social Media Content Creator Agent
 */

export class LinkedInPersonalBrandingState {
  constructor() {
    this.userId = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.linkedinProfileId = null;
    
    // Profile and Analysis
    this.profileAnalysis = null;
    this.industryResearch = null;
    
    // Content Strategy
    this.contentStrategy = null;
    this.calendar = null;
    
    // Automated Posting
    this.automatedPosting = null;
    
    // Analytics and Performance
    this.analytics = null;
    this.performanceMetrics = null;
    
    // Error handling
    this.error = null;
    this.status = 'initialized';
  }

  // User and Authentication
  updateUser(userId, accessToken, refreshToken, linkedinProfileId) {
    this.userId = userId;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.linkedinProfileId = linkedinProfileId;
    this.status = 'authenticated';
    return this;
  }

  // Profile Analysis
  updateProfileAnalysis(analysis) {
    this.profileAnalysis = analysis;
    this.status = 'profile_analyzed';
    return this;
  }

  // Industry Research
  updateIndustryResearch(research) {
    this.industryResearch = research;
    this.status = 'research_completed';
    return this;
  }

  // Content Strategy
  updateContentStrategy(strategyData) {
    this.contentStrategy = strategyData.strategy;
    this.calendar = strategyData.calendar;
    this.status = 'strategy_developed';
    return this;
  }

  // Automated Posting
  updateAutomatedPosting(postingData) {
    this.automatedPosting = postingData;
    this.status = 'automation_configured';
    return this;
  }

  // Analytics
  updateAnalytics(analytics) {
    this.analytics = analytics;
    this.status = 'analytics_updated';
    return this;
  }

  updatePerformanceMetrics(metrics) {
    this.performanceMetrics = metrics;
    this.status = 'performance_tracked';
    return this;
  }

  // Error handling
  setError(error) {
    this.error = error;
    this.status = 'error';
    return this;
  }

  clearError() {
    this.error = null;
    return this;
  }

  // Validation methods
  validateAuthentication() {
    if (!this.userId || !this.accessToken) {
      throw new Error('User authentication required');
    }
    return true;
  }

  validateProfileAnalysis() {
    if (!this.profileAnalysis) {
      throw new Error('Profile analysis required');
    }
    return true;
  }

  validateIndustryResearch() {
    if (!this.industryResearch) {
      throw new Error('Industry research required');
    }
    return true;
  }

  validateContentStrategy() {
    if (!this.contentStrategy || !this.calendar) {
      throw new Error('Content strategy required');
    }
    return true;
  }

  // Getter methods for easy access
  getUserInfo() {
    return {
      userId: this.userId,
      linkedinProfileId: this.linkedinProfileId,
      status: this.status
    };
  }

  getProfileInfo() {
    return this.profileAnalysis?.basic || null;
  }

  getProfessionalInfo() {
    return this.profileAnalysis?.professional || null;
  }

  getSkills() {
    return this.profileAnalysis?.skills || null;
  }

  getExperience() {
    return this.profileAnalysis?.experience || null;
  }

  getBrandInsights() {
    return this.profileAnalysis?.brandInsights || null;
  }

  getContentStrategy() {
    return this.contentStrategy || null;
  }

  getCalendar() {
    return this.calendar || null;
  }

  getAutomatedPosting() {
    return this.automatedPosting || null;
  }

  getAnalytics() {
    return this.analytics || null;
  }

  getPerformanceMetrics() {
    return this.performanceMetrics || null;
  }

  // Status checking methods
  isAuthenticated() {
    return this.status === 'authenticated' || this.status.startsWith('profile_');
  }

  isProfileAnalyzed() {
    return this.status === 'profile_analyzed' || this.status.startsWith('research_');
  }

  isResearchCompleted() {
    return this.status === 'research_completed' || this.status.startsWith('strategy_');
  }

  isStrategyDeveloped() {
    return this.status === 'strategy_developed' || this.status.startsWith('automation_');
  }

  isAutomationConfigured() {
    return this.status === 'automation_configured' || this.status.startsWith('analytics_');
  }

  hasError() {
    return this.error !== null;
  }

  // Export methods for reporting
  exportSummary() {
    return {
      user: this.getUserInfo(),
      profile: this.getProfileInfo(),
      professional: this.getProfessionalInfo(),
      skills: this.getSkills(),
      experience: this.getExperience(),
      brandInsights: this.getBrandInsights(),
      contentStrategy: this.getContentStrategy(),
      calendar: this.getCalendar(),
      automatedPosting: this.getAutomatedPosting(),
      analytics: this.getAnalytics(),
      performanceMetrics: this.getPerformanceMetrics(),
      status: this.status,
      error: this.error
    };
  }

  // Reset method for new sessions
  reset() {
    this.userId = null;
    this.accessToken = null;
    this.refreshToken = null;
    this.linkedinProfileId = null;
    this.profileAnalysis = null;
    this.industryResearch = null;
    this.contentStrategy = null;
    this.calendar = null;
    this.automatedPosting = null;
    this.analytics = null;
    this.performanceMetrics = null;
    this.error = null;
    this.status = 'initialized';
    return this;
  }
} 