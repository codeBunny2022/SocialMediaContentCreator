import { LinkedInService } from '../../services/linkedin.js';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import moment from 'moment';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../../data/linkedin_agent.db');

export class AutomatedPosterNode {
  constructor() {
    this.linkedinService = new LinkedInService();
    this.db = new sqlite3.Database(dbPath);
    this.scheduledJobs = new Map();
  }

  async execute(state) {
    try {
      console.log('Automated Poster Node: Starting automated posting setup...');
      
      const { userId, accessToken, contentStrategy, calendar } = this.validateInput(state);
      
      // Set up automated posting schedule
      const postingJobs = await this.setupAutomatedPosting(userId, accessToken, contentStrategy, calendar);
      
      // Schedule engagement tracking
      await this.setupEngagementTracking(userId, accessToken);
      
      // Save posting configuration
      await this.savePostingConfiguration(userId, postingJobs);
      
      console.log('Automated Poster Node: Automated posting configured');
      return state.updateAutomatedPosting({ postingJobs, status: 'configured' });
      
    } catch (error) {
      console.error('Automated Poster Node Error:', error);
      return state.setError(`Automated posting failed: ${error.message}`);
    }
  }

  validateInput(state) {
    if (!state.userId) {
      throw new Error('User ID is required for automated posting');
    }
    if (!state.accessToken) {
      throw new Error('LinkedIn access token is required');
    }
    if (!state.contentStrategy) {
      throw new Error('Content strategy is required');
    }
    if (!state.calendar) {
      throw new Error('Content calendar is required');
    }
    
    return {
      userId: state.userId,
      accessToken: state.accessToken,
      contentStrategy: state.contentStrategy,
      calendar: state.calendar
    };
  }

  async setupAutomatedPosting(userId, accessToken, contentStrategy, calendar) {
    const postingJobs = [];
    
    for (const entry of calendar) {
      if (entry.status === 'planned') {
        const job = await this.schedulePost(userId, accessToken, entry, contentStrategy);
        postingJobs.push(job);
      }
    }
    
    return postingJobs;
  }

  async schedulePost(userId, accessToken, calendarEntry, contentStrategy) {
    const { date, optimalTime, contentType, theme, hashtags } = calendarEntry;
    
    // Parse the optimal time
    const [hours, minutes] = optimalTime.split(':');
    const postTime = moment(date).hours(parseInt(hours)).minutes(parseInt(minutes));
    
    // Create cron schedule
    const cronSchedule = `${minutes} ${hours} ${postTime.date()} ${postTime.month() + 1} *`;
    
    const job = {
      id: `post_${userId}_${calendarEntry.day}`,
      calendarEntry,
      cronSchedule,
      status: 'scheduled',
      scheduledTime: postTime.format(),
      contentType,
      theme
    };
    
    // Schedule the job
    this.scheduledJobs.set(job.id, cron.schedule(cronSchedule, async () => {
      await this.executePost(userId, accessToken, job, contentStrategy);
    }));
    
    return job;
  }

  async executePost(userId, accessToken, job, contentStrategy) {
    try {
      console.log(`📝 Executing scheduled post: ${job.id}`);
      
      // Generate content based on strategy
      const content = await this.generateContent(job, contentStrategy);
      
      // Post to LinkedIn
      const postResult = await this.linkedinService.createTextPost(
        accessToken, 
        content, 
        'PUBLIC'
      );
      
      // Update database with post information
      await this.savePostToDatabase(userId, job, content, postResult);
      
      // Update job status
      job.status = 'posted';
      job.postedTime = new Date().toISOString();
      job.linkedinPostId = postResult.postId;
      
      console.log(`✅ Post published successfully: ${postResult.postId}`);
      
    } catch (error) {
      console.error(`❌ Failed to execute post ${job.id}:`, error);
      job.status = 'failed';
      job.error = error.message;
    }
  }

  async generateContent(job, contentStrategy) {
    const { contentType, theme, hashtags } = job;
    const brandVoice = contentStrategy.brandVoice;
    
    // Generate content based on type and theme
    let content = '';
    
    switch (contentType) {
      case 'educational':
        content = this.generateEducationalContent(theme, brandVoice);
        break;
      case 'industryInsights':
        content = this.generateIndustryInsightsContent(theme, brandVoice);
        break;
      case 'personalStories':
        content = this.generatePersonalStoryContent(theme, brandVoice);
        break;
      case 'engagement':
        content = this.generateEngagementContent(theme, brandVoice);
        break;
      default:
        content = this.generateGeneralContent(theme, brandVoice);
    }
    
    // Add hashtags
    if (hashtags && hashtags.length > 0) {
      content += `\n\n${hashtags.join(' ')}`;
    }
    
    return content;
  }

  generateEducationalContent(theme, brandVoice) {
    const templates = [
      `💡 ${theme} Tip: [Educational insight about ${theme.toLowerCase()}]`,
      `🎓 Learning Moment: Here's what I've discovered about ${theme.toLowerCase()}...`,
      `📚 Knowledge Share: Let me break down ${theme.toLowerCase()} for you...`,
      `🔍 Deep Dive: Understanding ${theme.toLowerCase()} is crucial because...`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  generateIndustryInsightsContent(theme, brandVoice) {
    const templates = [
      `📊 Industry Update: The ${theme.toLowerCase()} landscape is evolving...`,
      `🚀 Trend Alert: Here's what's happening in ${theme.toLowerCase()}...`,
      `💼 Professional Insight: Based on my experience in ${theme.toLowerCase()}...`,
      `🔮 Future Focus: The future of ${theme.toLowerCase()} looks promising...`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  generatePersonalStoryContent(theme, brandVoice) {
    const templates = [
      `🌟 Personal Journey: My experience with ${theme.toLowerCase()} taught me...`,
      `💭 Reflection: Looking back on my ${theme.toLowerCase()} journey...`,
      `🎯 Key Learning: One of the biggest lessons in ${theme.toLowerCase()}...`,
      `📈 Growth Story: How ${theme.toLowerCase()} transformed my approach...`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  generateEngagementContent(theme, brandVoice) {
    const templates = [
      `🤔 Question: What's your take on ${theme.toLowerCase()}?`,
      `💬 Discussion: Let's talk about ${theme.toLowerCase()}...`,
      `👥 Community: Who else is passionate about ${theme.toLowerCase()}?`,
      `🎯 Poll: What aspect of ${theme.toLowerCase()} interests you most?`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  generateGeneralContent(theme, brandVoice) {
    const templates = [
      `📝 Thoughts on ${theme.toLowerCase()}...`,
      `💼 Professional perspective on ${theme.toLowerCase()}...`,
      `🎯 Key insights about ${theme.toLowerCase()}...`,
      `💡 Sharing my thoughts on ${theme.toLowerCase()}...`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  async setupEngagementTracking(userId, accessToken) {
    // Schedule daily engagement tracking
    const engagementJob = cron.schedule('0 9 * * *', async () => {
      await this.trackEngagement(userId, accessToken);
    });
    
    this.scheduledJobs.set(`engagement_${userId}`, engagementJob);
  }

  async trackEngagement(userId, accessToken) {
    try {
      console.log(`📊 Tracking engagement for user: ${userId}`);
      
      // Get recent posts from database
      const recentPosts = await this.getRecentPosts(userId);
      
      for (const post of recentPosts) {
        if (post.linkedin_post_id) {
          // Get analytics from LinkedIn
          const analytics = await this.linkedinService.getPostAnalytics(
            accessToken, 
            post.linkedin_post_id
          );
          
          // Update database with analytics
          await this.linkedinService.savePostAnalytics(userId, post.id, analytics);
          
          console.log(`📈 Updated analytics for post: ${post.id}`);
        }
      }
      
    } catch (error) {
      console.error('Failed to track engagement:', error);
    }
  }

  async getRecentPosts(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, linkedin_post_id, posted_time 
        FROM content_posts 
        WHERE user_id = ? AND posted_time >= datetime('now', '-7 days')
        ORDER BY posted_time DESC
      `;
      
      this.db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async savePostToDatabase(userId, job, content, postResult) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO content_posts 
        (user_id, title, content, hashtags, post_type, status, posted_time, linkedin_post_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const hashtags = job.calendarEntry.hashtags?.join(', ') || '';
      
      this.db.run(query, [
        userId,
        job.theme,
        content,
        hashtags,
        job.contentType,
        'posted',
        new Date().toISOString(),
        postResult.postId
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async savePostingConfiguration(userId, postingJobs) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE user_profiles 
        SET content_preferences = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `;
      
      const config = {
        automatedPosting: true,
        totalJobs: postingJobs.length,
        activeJobs: postingJobs.filter(job => job.status === 'scheduled').length,
        lastUpdated: new Date().toISOString()
      };
      
      this.db.run(query, [JSON.stringify(config), userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  // Method to stop all scheduled jobs
  stopAllJobs() {
    this.scheduledJobs.forEach((job, id) => {
      job.stop();
      console.log(`🛑 Stopped job: ${id}`);
    });
    this.scheduledJobs.clear();
  }

  // Method to get job status
  getJobStatus(jobId) {
    const job = this.scheduledJobs.get(jobId);
    return job ? 'active' : 'inactive';
  }

  // Method to pause/resume jobs
  pauseJob(jobId) {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      job.stop();
      console.log(`⏸️ Paused job: ${jobId}`);
    }
  }

  resumeJob(jobId) {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      job.start();
      console.log(`▶️ Resumed job: ${jobId}`);
    }
  }

  close() {
    this.stopAllJobs();
    this.db.close();
  }
} 