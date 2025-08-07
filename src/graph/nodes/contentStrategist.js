import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../../data/linkedin_agent.db');

export class ContentStrategistNode {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
  }

  async execute(state) {
    try {
      console.log('Content Strategist Node: Starting content strategy development...');
      
      const { profileAnalysis, industryResearch, duration } = this.validateInput(state);
      
      // Develop content strategy
      const strategy = await this.developContentStrategy(profileAnalysis, industryResearch);
      
      // Create content calendar
      const calendar = await this.createContentCalendar(strategy, duration);
      
      // Save strategy and calendar to database
      await this.saveContentStrategy(state.userId, strategy, calendar);
      
      console.log('Content Strategist Node: Strategy and calendar created');
      return state.updateContentStrategy({ strategy, calendar });
      
    } catch (error) {
      console.error('Content Strategist Node Error:', error);
      return state.setError(`Content strategy failed: ${error.message}`);
    }
  }

  validateInput(state) {
    if (!state.profileAnalysis) {
      throw new Error('Profile analysis is required for content strategy');
    }
    if (!state.industryResearch) {
      throw new Error('Industry research is required for content strategy');
    }
    if (!state.duration) {
      throw new Error('Duration is required for content calendar');
    }
    
    return {
      profileAnalysis: state.profileAnalysis,
      industryResearch: state.industryResearch,
      duration: state.duration
    };
  }

  async developContentStrategy(profileAnalysis, industryResearch) {
    const strategy = {
      brandVoice: profileAnalysis.brandInsights.brandVoice,
      targetAudience: profileAnalysis.brandInsights.targetAudience,
      contentThemes: this.mergeContentThemes(profileAnalysis, industryResearch),
      contentMix: this.optimizeContentMix(profileAnalysis, industryResearch),
      hashtagStrategy: this.developHashtagStrategy(profileAnalysis, industryResearch),
      engagementStrategy: this.developEngagementStrategy(profileAnalysis),
      postingSchedule: this.createPostingSchedule(profileAnalysis),
      contentGoals: this.defineContentGoals(profileAnalysis)
    };

    return strategy;
  }

  async createContentCalendar(strategy, duration) {
    const calendar = [];
    const startDate = moment();
    
    for (let day = 1; day <= duration; day++) {
      const postDate = moment(startDate).add(day - 1, 'days');
      
      // Skip weekends for professional content
      if (postDate.day() === 0 || postDate.day() === 6) {
        continue;
      }
      
      const calendarEntry = {
        day: day,
        date: postDate.format('YYYY-MM-DD'),
        dayOfWeek: postDate.format('dddd'),
        contentType: this.selectContentType(strategy.contentMix, day),
        theme: this.selectTheme(strategy.contentThemes, day),
        hashtags: this.selectHashtags(strategy.hashtagStrategy, day),
        optimalTime: this.selectOptimalTime(strategy.postingSchedule, postDate),
        status: 'planned'
      };
      
      calendar.push(calendarEntry);
    }

    return calendar;
  }

  mergeContentThemes(profileAnalysis, industryResearch) {
    const profileThemes = profileAnalysis.brandInsights.contentThemes || [];
    const industryThemes = industryResearch.insights?.topTrends?.map(trend => trend.keyword) || [];
    
    // Combine and prioritize themes
    const allThemes = [...profileThemes, ...industryThemes];
    const uniqueThemes = [...new Set(allThemes)];
    
    return uniqueThemes.slice(0, 8); // Limit to top 8 themes
  }

  optimizeContentMix(profileAnalysis, industryResearch) {
    const baseMix = profileAnalysis.contentStrategy.contentMix;
    const industryTrends = industryResearch.insights?.topTrends || [];
    
    // Adjust mix based on industry trends
    if (industryTrends.length > 0) {
      baseMix.industryInsights = Math.min(baseMix.industryInsights + 10, 40);
      baseMix.educational = Math.max(baseMix.educational - 5, 30);
    }
    
    return baseMix;
  }

  developHashtagStrategy(profileAnalysis, industryResearch) {
    const profileHashtags = profileAnalysis.contentStrategy.hashtagStrategy;
    const industryHashtags = industryResearch.insights?.hashtagSuggestions || [];
    
    return {
      primary: profileHashtags.industry,
      secondary: profileHashtags.skills,
      trending: industryHashtags.slice(0, 5),
      general: profileHashtags.general,
      custom: this.generateCustomHashtags(profileAnalysis, industryResearch)
    };
  }

  developEngagementStrategy(profileAnalysis) {
    const baseStrategy = profileAnalysis.contentStrategy.engagementStrategy;
    
    return {
      ...baseStrategy,
      responseTime: 'Within 2 hours',
      interactionFrequency: 'Daily',
      communityParticipation: 'Weekly',
      contentSharing: '3-5 times per week'
    };
  }

  createPostingSchedule(profileAnalysis) {
    const baseSchedule = profileAnalysis.contentStrategy.postingSchedule;
    
    return {
      frequency: baseSchedule,
      optimalDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      optimalTimes: ['9:00 AM', '10:00 AM', '2:00 PM'],
      timezone: 'User local timezone'
    };
  }

  defineContentGoals(profileAnalysis) {
    const seniority = profileAnalysis.professional.seniorityLevel;
    
    const goals = {
      'Executive': {
        thoughtLeadership: 40,
        industryInfluence: 30,
        networking: 20,
        personalBrand: 10
      },
      'Senior Management': {
        thoughtLeadership: 30,
        industryInsights: 35,
        networking: 25,
        personalBrand: 10
      },
      'Management': {
        industryInsights: 40,
        professionalDevelopment: 30,
        networking: 20,
        personalBrand: 10
      },
      'Mid-Level': {
        professionalDevelopment: 40,
        industryInsights: 30,
        networking: 20,
        personalBrand: 10
      },
      'Junior': {
        learning: 40,
        professionalDevelopment: 30,
        networking: 20,
        personalBrand: 10
      }
    };
    
    return goals[seniority] || goals['Mid-Level'];
  }

  selectContentType(contentMix, day) {
    const types = [];
    
    // Convert percentages to counts
    Object.entries(contentMix).forEach(([type, percentage]) => {
      const count = Math.round((percentage / 100) * 20); // Assume 20 posts total
      for (let i = 0; i < count; i++) {
        types.push(type);
      }
    });
    
    // Shuffle and select based on day
    const shuffled = this.shuffleArray([...types]);
    return shuffled[day % shuffled.length] || 'industryInsights';
  }

  selectTheme(themes, day) {
    if (!themes || themes.length === 0) {
      return 'Professional Development';
    }
    
    return themes[day % themes.length];
  }

  selectHashtags(hashtagStrategy, day) {
    const hashtags = [];
    
    // Add primary hashtag
    if (hashtagStrategy.primary) {
      hashtags.push(hashtagStrategy.primary);
    }
    
    // Add secondary hashtags (rotate)
    if (hashtagStrategy.secondary && hashtagStrategy.secondary.length > 0) {
      const secondaryIndex = day % hashtagStrategy.secondary.length;
      hashtags.push(hashtagStrategy.secondary[secondaryIndex]);
    }
    
    // Add trending hashtags (rotate)
    if (hashtagStrategy.trending && hashtagStrategy.trending.length > 0) {
      const trendingIndex = day % hashtagStrategy.trending.length;
      hashtags.push(hashtagStrategy.trending[trendingIndex]);
    }
    
    // Add general hashtags
    hashtags.push(...hashtagStrategy.general.slice(0, 2));
    
    return hashtags.slice(0, 5); // Limit to 5 hashtags
  }

  selectOptimalTime(postingSchedule, postDate) {
    const dayOfWeek = postDate.format('dddd');
    const optimalDays = postingSchedule.optimalDays;
    
    if (!optimalDays.includes(dayOfWeek)) {
      return '10:00 AM'; // Default time
    }
    
    const times = postingSchedule.optimalTimes;
    const timeIndex = postDate.date() % times.length;
    return times[timeIndex];
  }

  generateCustomHashtags(profileAnalysis, industryResearch) {
    const customHashtags = [];
    
    // Add industry-specific hashtags
    const industry = profileAnalysis.professional.industry;
    if (industry && industry !== 'Not specified') {
      customHashtags.push(`#${industry.replace(/\s+/g, '')}`);
    }
    
    // Add role-specific hashtags
    const role = profileAnalysis.professional.currentRole;
    if (role && role !== 'Not specified') {
      customHashtags.push(`#${role.replace(/\s+/g, '')}`);
    }
    
    // Add trending topic hashtags
    const trendingTopics = industryResearch.insights?.topTrends || [];
    trendingTopics.slice(0, 3).forEach(trend => {
      customHashtags.push(`#${trend.keyword.replace(/\s+/g, '')}`);
    });
    
    return customHashtags;
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async saveContentStrategy(userId, strategy, calendar) {
    return new Promise((resolve, reject) => {
      // Save calendar entries to database
      const insertCalendar = this.db.prepare(`
        INSERT INTO content_calendar (user_id, scheduled_date, scheduled_time, status)
        VALUES (?, ?, ?, ?)
      `);
      
      calendar.forEach(entry => {
        insertCalendar.run([
          userId,
          entry.date,
          entry.optimalTime,
          entry.status
        ]);
      });
      
      insertCalendar.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  close() {
    this.db.close();
  }
} 