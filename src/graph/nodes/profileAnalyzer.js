import { LinkedInService } from '../../services/linkedin.js';

export class ProfileAnalyzerNode {
  constructor() {
    this.linkedinService = new LinkedInService();
  }

  async execute(state) {
    try {
      console.log('Profile Analyzer Node: Starting profile analysis...');
      
      const { userId, accessToken } = this.validateInput(state);
      
      // Get detailed profile from LinkedIn
      const profileData = await this.linkedinService.getDetailedProfile(accessToken);
      
      // Analyze profile and extract insights
      const analysis = await this.analyzeProfile(profileData);
      
      // Save profile data to database
      await this.linkedinService.saveUserProfile(userId, profileData);
      
      console.log('Profile Analyzer Node: Profile analysis completed');
      return state.updateProfileAnalysis(analysis);
      
    } catch (error) {
      console.error('Profile Analyzer Node Error:', error);
      return state.setError(`Profile analysis failed: ${error.message}`);
    }
  }

  validateInput(state) {
    if (!state.userId) {
      throw new Error('User ID is required for profile analysis');
    }
    if (!state.accessToken) {
      throw new Error('LinkedIn access token is required');
    }
    return { userId: state.userId, accessToken: state.accessToken };
  }

  async analyzeProfile(profileData) {
    const analysis = {
      basic: {
        name: `${profileData.basic.firstName} ${profileData.basic.lastName}`,
        profilePicture: profileData.basic.profilePicture
      },
      professional: this.analyzeProfessionalInfo(profileData),
      skills: this.analyzeSkills(profileData.skills),
      experience: this.analyzeExperience(profileData.positions),
      education: this.analyzeEducation(profileData.educations),
      interests: this.analyzeInterests(profileData.interests),
      brandInsights: this.generateBrandInsights(profileData),
      contentStrategy: this.generateContentStrategy(profileData)
    };

    return analysis;
  }

  analyzeProfessionalInfo(profileData) {
    const currentPosition = profileData.positions?.[0];
    
    return {
      currentRole: currentPosition?.title || 'Not specified',
      company: currentPosition?.companyName || 'Not specified',
      industry: this.extractIndustry(currentPosition),
      location: currentPosition?.location || 'Not specified',
      yearsOfExperience: this.calculateYearsOfExperience(profileData.positions),
      seniorityLevel: this.determineSeniorityLevel(currentPosition)
    };
  }

  analyzeSkills(skills) {
    if (!skills || skills.length === 0) {
      return { technical: [], soft: [], trending: [] };
    }

    const skillNames = skills.map(skill => skill.name);
    
    return {
      technical: this.categorizeTechnicalSkills(skillNames),
      soft: this.categorizeSoftSkills(skillNames),
      trending: this.identifyTrendingSkills(skillNames),
      totalCount: skills.length,
      topSkills: skillNames.slice(0, 10)
    };
  }

  analyzeExperience(positions) {
    if (!positions || positions.length === 0) {
      return { summary: 'No experience data available', roles: [] };
    }

    const roles = positions.map(position => ({
      title: position.title,
      company: position.companyName,
      duration: this.calculateDuration(position.startDate, position.endDate),
      description: position.summary || '',
      skills: position.skills || []
    }));

    return {
      summary: this.generateExperienceSummary(roles),
      roles: roles,
      totalExperience: this.calculateTotalExperience(roles),
      careerProgression: this.analyzeCareerProgression(roles)
    };
  }

  analyzeEducation(educations) {
    if (!educations || educations.length === 0) {
      return { summary: 'No education data available', institutions: [] };
    }

    const institutions = educations.map(education => ({
      institution: education.schoolName,
      degree: education.degreeName,
      field: education.fieldOfStudy,
      year: education.endDate?.year || 'Not specified'
    }));

    return {
      summary: this.generateEducationSummary(institutions),
      institutions: institutions,
      highestDegree: this.getHighestDegree(institutions)
    };
  }

  analyzeInterests(interests) {
    if (!interests || interests.length === 0) {
      return { topics: [], contentIdeas: [] };
    }

    const topics = interests.map(interest => interest.name);
    
    return {
      topics: topics,
      contentIdeas: this.generateContentIdeasFromInterests(topics),
      engagementOpportunities: this.identifyEngagementOpportunities(topics)
    };
  }

  generateBrandInsights(profileData) {
    const insights = {
      personalBrand: this.definePersonalBrand(profileData),
      targetAudience: this.identifyTargetAudience(profileData),
      uniqueValueProposition: this.defineUVP(profileData),
      contentThemes: this.suggestContentThemes(profileData),
      brandVoice: this.suggestBrandVoice(profileData)
    };

    return insights;
  }

  generateContentStrategy(profileData) {
    const strategy = {
      contentMix: this.suggestContentMix(profileData),
      postingFrequency: this.suggestPostingFrequency(profileData),
      optimalTimes: this.suggestOptimalTimes(profileData),
      hashtagStrategy: this.suggestHashtagStrategy(profileData),
      engagementStrategy: this.suggestEngagementStrategy(profileData)
    };

    return strategy;
  }

  // Helper methods for analysis
  extractIndustry(position) {
    if (!position) return 'Not specified';
    
    const industryKeywords = {
      'software': 'Technology',
      'tech': 'Technology',
      'ai': 'Technology',
      'marketing': 'Marketing',
      'sales': 'Sales',
      'finance': 'Finance',
      'healthcare': 'Healthcare',
      'education': 'Education'
    };

    const title = position.title.toLowerCase();
    const company = position.companyName.toLowerCase();
    
    for (const [keyword, industry] of Object.entries(industryKeywords)) {
      if (title.includes(keyword) || company.includes(keyword)) {
        return industry;
      }
    }
    
    return 'General Business';
  }

  calculateYearsOfExperience(positions) {
    if (!positions || positions.length === 0) return 0;
    
    const currentYear = new Date().getFullYear();
    let totalYears = 0;
    
    positions.forEach(position => {
      const startYear = position.startDate?.year || currentYear;
      const endYear = position.endDate?.year || currentYear;
      totalYears += (endYear - startYear);
    });
    
    return Math.max(totalYears, 1);
  }

  determineSeniorityLevel(position) {
    if (!position) return 'Entry Level';
    
    const title = position.title.toLowerCase();
    
    if (title.includes('ceo') || title.includes('founder') || title.includes('president')) {
      return 'Executive';
    } else if (title.includes('director') || title.includes('head') || title.includes('lead')) {
      return 'Senior Management';
    } else if (title.includes('manager') || title.includes('senior')) {
      return 'Management';
    } else if (title.includes('junior') || title.includes('associate')) {
      return 'Junior';
    } else {
      return 'Mid-Level';
    }
  }

  categorizeTechnicalSkills(skills) {
    const technicalKeywords = [
      'programming', 'coding', 'development', 'software', 'data', 'ai', 'machine learning',
      'python', 'javascript', 'java', 'react', 'angular', 'node', 'sql', 'aws', 'cloud',
      'devops', 'cybersecurity', 'blockchain', 'api', 'database', 'algorithm'
    ];
    
    return skills.filter(skill => 
      technicalKeywords.some(keyword => skill.toLowerCase().includes(keyword))
    );
  }

  categorizeSoftSkills(skills) {
    const softKeywords = [
      'leadership', 'communication', 'teamwork', 'problem solving', 'creativity',
      'adaptability', 'time management', 'collaboration', 'mentoring', 'coaching',
      'presentation', 'negotiation', 'strategic thinking', 'emotional intelligence'
    ];
    
    return skills.filter(skill => 
      softKeywords.some(keyword => skill.toLowerCase().includes(keyword))
    );
  }

  identifyTrendingSkills(skills) {
    const trendingSkills = [
      'AI', 'Machine Learning', 'Data Science', 'Cloud Computing', 'Cybersecurity',
      'DevOps', 'Blockchain', 'Digital Marketing', 'Content Creation', 'Remote Work'
    ];
    
    return skills.filter(skill => 
      trendingSkills.some(trending => 
        skill.toLowerCase().includes(trending.toLowerCase())
      )
    );
  }

  calculateDuration(startDate, endDate) {
    if (!startDate) return 'Current';
    
    const start = startDate.year || new Date().getFullYear();
    const end = endDate?.year || 'Present';
    
    return `${start} - ${end}`;
  }

  generateExperienceSummary(roles) {
    if (roles.length === 0) return 'No experience data available';
    
    const totalYears = this.calculateTotalExperience(roles);
    const currentRole = roles[0];
    
    return `${totalYears} years of experience in ${currentRole.title} at ${currentRole.company}`;
  }

  calculateTotalExperience(roles) {
    let totalYears = 0;
    
    roles.forEach(role => {
      const duration = role.duration;
      if (duration !== 'Current') {
        const years = duration.split(' - ');
        if (years.length === 2 && years[1] !== 'Present') {
          totalYears += (parseInt(years[1]) - parseInt(years[0]));
        }
      }
    });
    
    return Math.max(totalYears, 1);
  }

  analyzeCareerProgression(roles) {
    if (roles.length < 2) return 'Insufficient data for career progression analysis';
    
    const progression = {
      hasProgression: roles.length > 1,
      roleChanges: roles.length - 1,
      averageTenure: this.calculateAverageTenure(roles),
      progressionPattern: this.identifyProgressionPattern(roles)
    };
    
    return progression;
  }

  generateEducationSummary(institutions) {
    if (institutions.length === 0) return 'No education data available';
    
    const highestDegree = this.getHighestDegree(institutions);
    return `Education: ${highestDegree} from ${institutions[0].institution}`;
  }

  getHighestDegree(institutions) {
    const degreeLevels = {
      'phd': 5,
      'doctorate': 5,
      'masters': 4,
      'bachelor': 3,
      'associate': 2,
      'diploma': 1
    };
    
    let highestLevel = 0;
    let highestDegree = 'Not specified';
    
    institutions.forEach(inst => {
      const degree = inst.degree?.toLowerCase() || '';
      for (const [key, level] of Object.entries(degreeLevels)) {
        if (degree.includes(key) && level > highestLevel) {
          highestLevel = level;
          highestDegree = inst.degree;
        }
      }
    });
    
    return highestDegree;
  }

  generateContentIdeasFromInterests(interests) {
    return interests.map(interest => [
      `Share insights about ${interest}`,
      `Discuss trends in ${interest}`,
      `Share your experience with ${interest}`,
      `Provide tips for ${interest}`
    ]).flat();
  }

  identifyEngagementOpportunities(interests) {
    return interests.map(interest => ({
      topic: interest,
      engagementType: 'Discussion',
      suggestedApproach: `Start conversations about ${interest}`
    }));
  }

  definePersonalBrand(profileData) {
    const currentRole = profileData.positions?.[0];
    const skills = profileData.skills || [];
    
    let brand = 'Professional';
    
    if (skills.some(skill => skill.name.toLowerCase().includes('leadership'))) {
      brand = 'Thought Leader';
    } else if (skills.some(skill => skill.name.toLowerCase().includes('creative'))) {
      brand = 'Creative Professional';
    } else if (currentRole?.title.toLowerCase().includes('manager')) {
      brand = 'Management Professional';
    }
    
    return brand;
  }

  identifyTargetAudience(profileData) {
    const industry = this.extractIndustry(profileData.positions?.[0]);
    const seniority = this.determineSeniorityLevel(profileData.positions?.[0]);
    
    return {
      primary: `${industry} professionals`,
      secondary: `${seniority} level professionals`,
      tertiary: 'Industry peers and connections'
    };
  }

  defineUVP(profileData) {
    const experience = this.calculateYearsOfExperience(profileData.positions);
    const skills = profileData.skills || [];
    const currentRole = profileData.positions?.[0];
    
    return `Experienced ${currentRole?.title || 'professional'} with ${experience} years of expertise in ${skills.slice(0, 3).map(s => s.name).join(', ')}`;
  }

  suggestContentThemes(profileData) {
    const themes = ['Professional Development', 'Industry Insights', 'Career Tips'];
    
    if (profileData.skills?.some(skill => skill.name.toLowerCase().includes('leadership'))) {
      themes.push('Leadership', 'Team Management');
    }
    
    if (profileData.skills?.some(skill => skill.name.toLowerCase().includes('technology'))) {
      themes.push('Technology Trends', 'Digital Innovation');
    }
    
    return themes;
  }

  suggestBrandVoice(profileData) {
    const seniority = this.determineSeniorityLevel(profileData.positions?.[0]);
    
    const voices = {
      'Executive': 'Authoritative and Strategic',
      'Senior Management': 'Experienced and Insightful',
      'Management': 'Professional and Collaborative',
      'Mid-Level': 'Knowledgeable and Approachable',
      'Junior': 'Enthusiastic and Learning-Focused'
    };
    
    return voices[seniority] || 'Professional and Authentic';
  }

  suggestContentMix(profileData) {
    return {
      educational: 40,
      industryInsights: 30,
      personalStories: 20,
      engagement: 10
    };
  }

  suggestPostingFrequency(profileData) {
    const seniority = this.determineSeniorityLevel(profileData.positions?.[0]);
    
    const frequencies = {
      'Executive': '2-3 times per week',
      'Senior Management': '3-4 times per week',
      'Management': '4-5 times per week',
      'Mid-Level': '3-4 times per week',
      'Junior': '2-3 times per week'
    };
    
    return frequencies[seniority] || '3-4 times per week';
  }

  suggestOptimalTimes(profileData) {
    return [
      'Tuesday 9:00 AM',
      'Wednesday 10:00 AM',
      'Thursday 8:00 AM',
      'Friday 9:00 AM'
    ];
  }

  suggestHashtagStrategy(profileData) {
    const industry = this.extractIndustry(profileData.positions?.[0]);
    const skills = profileData.skills || [];
    
    return {
      industry: `#${industry.toLowerCase()}`,
      skills: skills.slice(0, 3).map(skill => `#${skill.name.replace(/\s+/g, '')}`),
      general: ['#ProfessionalDevelopment', '#Networking', '#CareerGrowth']
    };
  }

  suggestEngagementStrategy(profileData) {
    return {
      comments: 'Respond to comments within 2 hours',
      networking: 'Connect with industry professionals weekly',
      content: 'Share and comment on relevant industry content',
      community: 'Participate in LinkedIn groups and discussions'
    };
  }

  calculateAverageTenure(roles) {
    if (roles.length === 0) return 0;
    
    const tenures = roles.map(role => {
      const duration = role.duration;
      if (duration === 'Current') return 1;
      
      const years = duration.split(' - ');
      if (years.length === 2 && years[1] !== 'Present') {
        return parseInt(years[1]) - parseInt(years[0]);
      }
      return 1;
    });
    
    return Math.round(tenures.reduce((sum, tenure) => sum + tenure, 0) / tenures.length);
  }

  identifyProgressionPattern(roles) {
    if (roles.length < 2) return 'Insufficient data';
    
    const titles = roles.map(role => role.title.toLowerCase());
    const hasProgression = titles.some(title => 
      title.includes('senior') || title.includes('lead') || title.includes('manager')
    );
    
    return hasProgression ? 'Upward progression' : 'Lateral movement';
  }
} 