import axios from 'axios';
import cheerio from 'cheerio';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data/linkedin_agent.db');

export class IndustryResearchService {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.newsApis = {
      newsapi: process.env.NEWS_API_KEY,
      gnews: process.env.GNEWS_API_KEY
    };
  }

  // Research industry trends and news
  async researchIndustryTrends(industry, keywords = []) {
    try {
      console.log(`🔍 Researching trends for industry: ${industry}`);
      
      const trends = await this.getTrendingTopics(industry);
      const news = await this.getIndustryNews(industry, keywords);
      const insights = await this.analyzeTrends(trends, news);
      
      return {
        industry,
        trends,
        news,
        insights,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Industry research failed:', error);
      return this.getFallbackTrends(industry);
    }
  }

  // Get trending topics from various sources
  async getTrendingTopics(industry) {
    const topics = [];
    
    try {
      // Google Trends API (simulated)
      const googleTrends = await this.getGoogleTrends(industry);
      topics.push(...googleTrends);

      // LinkedIn trending hashtags (simulated)
      const linkedinTrends = await this.getLinkedInTrends(industry);
      topics.push(...linkedinTrends);

      // Industry-specific sources
      const industryTrends = await this.getIndustrySpecificTrends(industry);
      topics.push(...industryTrends);

    } catch (error) {
      console.error('Failed to get trending topics:', error);
    }

    return topics.slice(0, 10); // Return top 10 trends
  }

  // Get industry news from multiple sources
  async getIndustryNews(industry, keywords = []) {
    const news = [];
    
    try {
      // NewsAPI
      if (this.newsApis.newsapi) {
        const newsApiResults = await this.getNewsApiResults(industry, keywords);
        news.push(...newsApiResults);
      }

      // GNews API
      if (this.newsApis.gnews) {
        const gnewsResults = await this.getGNewsResults(industry, keywords);
        news.push(...gnewsResults);
      }

      // Industry-specific news sources
      const industryNews = await this.getIndustrySpecificNews(industry);
      news.push(...industryNews);

    } catch (error) {
      console.error('Failed to get industry news:', error);
    }

    return news.slice(0, 15); // Return top 15 news items
  }

  // Analyze trends and news to generate insights
  async analyzeTrends(trends, news) {
    const insights = {
      topTrends: trends.slice(0, 5),
      emergingTopics: this.identifyEmergingTopics(trends, news),
      contentOpportunities: this.identifyContentOpportunities(trends, news),
      hashtagSuggestions: this.generateHashtagSuggestions(trends, news),
      engagementPredictions: this.predictEngagement(trends, news)
    };

    return insights;
  }

  // Helper methods for trend analysis
  identifyEmergingTopics(trends, news) {
    const emerging = [];
    const trendKeywords = trends.map(t => t.keyword.toLowerCase());
    
    news.forEach(article => {
      const articleKeywords = article.title.toLowerCase().split(' ');
      const matchingKeywords = articleKeywords.filter(keyword => 
        trendKeywords.some(trend => trend.includes(keyword) || keyword.includes(trend))
      );
      
      if (matchingKeywords.length > 0) {
        emerging.push({
          topic: article.title,
          keywords: matchingKeywords,
          source: article.source,
          relevance: matchingKeywords.length / articleKeywords.length
        });
      }
    });

    return emerging.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  }

  identifyContentOpportunities(trends, news) {
    const opportunities = [];
    
    trends.forEach(trend => {
      const relatedNews = news.filter(article => 
        article.title.toLowerCase().includes(trend.keyword.toLowerCase())
      );
      
      if (relatedNews.length > 0) {
        opportunities.push({
          trend: trend.keyword,
          newsCount: relatedNews.length,
          contentIdeas: this.generateContentIdeas(trend, relatedNews),
          urgency: this.calculateUrgency(relatedNews)
        });
      }
    });

    return opportunities.sort((a, b) => b.urgency - a.urgency).slice(0, 5);
  }

  generateHashtagSuggestions(trends, news) {
    const hashtags = new Set();
    
    trends.forEach(trend => {
      hashtags.add(`#${trend.keyword.replace(/\s+/g, '')}`);
      hashtags.add(`#${trend.keyword.replace(/\s+/g, '').toLowerCase()}`);
    });

    news.forEach(article => {
      const words = article.title.split(' ').filter(word => word.length > 3);
      words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
        if (cleanWord.length > 3) {
          hashtags.add(`#${cleanWord}`);
        }
      });
    });

    return Array.from(hashtags).slice(0, 20);
  }

  predictEngagement(trends, news) {
    const predictions = trends.map(trend => {
      const relatedNews = news.filter(article => 
        article.title.toLowerCase().includes(trend.keyword.toLowerCase())
      );
      
      const engagementScore = this.calculateEngagementScore(trend, relatedNews);
      
      return {
        trend: trend.keyword,
        predictedEngagement: engagementScore,
        confidence: this.calculateConfidence(trend, relatedNews),
        recommendedPostingTime: this.recommendPostingTime(trend)
      };
    });

    return predictions.sort((a, b) => b.predictedEngagement - a.predictedEngagement);
  }

  // API methods for different news sources
  async getNewsApiResults(industry, keywords) {
    try {
      const query = `${industry} ${keywords.join(' ')}`;
      const response = await axios.get(`https://newsapi.org/v2/everything`, {
        params: {
          q: query,
          apiKey: this.newsApis.newsapi,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 10
        }
      });

      return response.data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        relevance: this.calculateRelevance(article.title, industry, keywords)
      }));
    } catch (error) {
      console.error('NewsAPI request failed:', error);
      return [];
    }
  }

  async getGNewsResults(industry, keywords) {
    try {
      const query = `${industry} ${keywords.join(' ')}`;
      const response = await axios.get(`https://gnews.io/api/v4/search`, {
        params: {
          q: query,
          token: this.newsApis.gnews,
          lang: 'en',
          sortby: 'publishedAt',
          max: 10
        }
      });

      return response.data.articles.map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: article.publishedAt,
        relevance: this.calculateRelevance(article.title, industry, keywords)
      }));
    } catch (error) {
      console.error('GNews API request failed:', error);
      return [];
    }
  }

  // Simulated API methods (for demo purposes)
  async getGoogleTrends(industry) {
    // Simulate Google Trends data
    const trends = [
      { keyword: `${industry} AI`, volume: 85, growth: 15 },
      { keyword: `${industry} automation`, volume: 72, growth: 8 },
      { keyword: `${industry} digital transformation`, volume: 68, growth: 12 },
      { keyword: `${industry} remote work`, volume: 65, growth: 5 },
      { keyword: `${industry} sustainability`, volume: 58, growth: 20 }
    ];
    
    return trends;
  }

  async getLinkedInTrends(industry) {
    // Simulate LinkedIn trending hashtags
    const trends = [
      { keyword: `#${industry.toLowerCase()}`, volume: 90, growth: 10 },
      { keyword: `#${industry.toLowerCase()}tips`, volume: 75, growth: 12 },
      { keyword: `#${industry.toLowerCase()}trends`, volume: 68, growth: 8 },
      { keyword: `#${industry.toLowerCase()}innovation`, volume: 62, growth: 15 },
      { keyword: `#${industry.toLowerCase()}leadership`, volume: 55, growth: 6 }
    ];
    
    return trends;
  }

  async getIndustrySpecificTrends(industry) {
    // Industry-specific trend data
    const industryTrends = {
      'Technology': [
        { keyword: 'AI and Machine Learning', volume: 95, growth: 20 },
        { keyword: 'Cloud Computing', volume: 88, growth: 12 },
        { keyword: 'Cybersecurity', volume: 82, growth: 15 },
        { keyword: 'DevOps', volume: 75, growth: 10 },
        { keyword: 'Blockchain', volume: 68, growth: 8 }
      ],
      'Marketing': [
        { keyword: 'Digital Marketing', volume: 92, growth: 15 },
        { keyword: 'Content Marketing', volume: 85, growth: 12 },
        { keyword: 'Social Media Marketing', volume: 78, growth: 10 },
        { keyword: 'Email Marketing', volume: 72, growth: 8 },
        { keyword: 'Influencer Marketing', volume: 65, growth: 18 }
      ],
      'Business': [
        { keyword: 'Business Strategy', volume: 88, growth: 12 },
        { keyword: 'Leadership', volume: 82, growth: 10 },
        { keyword: 'Entrepreneurship', volume: 75, growth: 15 },
        { keyword: 'Innovation', volume: 68, growth: 8 },
        { keyword: 'Remote Work', volume: 62, growth: 5 }
      ]
    };

    return industryTrends[industry] || industryTrends['Business'];
  }

  async getIndustrySpecificNews(industry) {
    // Industry-specific news sources
    const newsSources = {
      'Technology': [
        { title: 'Latest AI Developments in Tech Industry', source: 'TechCrunch', relevance: 0.9 },
        { title: 'Cloud Computing Trends for 2024', source: 'TechRadar', relevance: 0.8 },
        { title: 'Cybersecurity Best Practices', source: 'SecurityWeek', relevance: 0.85 }
      ],
      'Marketing': [
        { title: 'Digital Marketing Strategies for 2024', source: 'MarketingProfs', relevance: 0.9 },
        { title: 'Content Marketing Trends', source: 'Content Marketing Institute', relevance: 0.85 },
        { title: 'Social Media Marketing Tips', source: 'Social Media Examiner', relevance: 0.8 }
      ],
      'Business': [
        { title: 'Business Strategy for Growth', source: 'Harvard Business Review', relevance: 0.9 },
        { title: 'Leadership Development Trends', source: 'Forbes', relevance: 0.85 },
        { title: 'Innovation in Business', source: 'MIT Sloan', relevance: 0.8 }
      ]
    };

    return newsSources[industry] || newsSources['Business'];
  }

  // Utility methods
  calculateRelevance(title, industry, keywords) {
    const titleLower = title.toLowerCase();
    const industryLower = industry.toLowerCase();
    const keywordMatches = keywords.filter(keyword => 
      titleLower.includes(keyword.toLowerCase())
    ).length;
    
    const industryMatch = titleLower.includes(industryLower) ? 1 : 0;
    const keywordScore = keywordMatches / Math.max(keywords.length, 1);
    
    return (industryMatch + keywordScore) / 2;
  }

  calculateEngagementScore(trend, news) {
    const newsCount = news.length;
    const avgRelevance = news.reduce((sum, article) => sum + article.relevance, 0) / Math.max(news.length, 1);
    const trendVolume = trend.volume || 50;
    
    return (newsCount * 0.3 + avgRelevance * 0.4 + trendVolume * 0.3) / 100;
  }

  calculateConfidence(trend, news) {
    const newsCount = news.length;
    const avgRelevance = news.reduce((sum, article) => sum + article.relevance, 0) / Math.max(news.length, 1);
    
    return Math.min((newsCount * 0.2 + avgRelevance * 0.8), 1);
  }

  calculateUrgency(news) {
    const recentNews = news.filter(article => {
      const publishedDate = new Date(article.publishedAt);
      const daysAgo = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    });
    
    return recentNews.length / Math.max(news.length, 1);
  }

  generateContentIdeas(trend, news) {
    const ideas = [
      `Share insights about ${trend.keyword}`,
      `Discuss the latest trends in ${trend.keyword}`,
      `Provide tips for ${trend.keyword}`,
      `Analyze the future of ${trend.keyword}`,
      `Share your experience with ${trend.keyword}`
    ];
    
    return ideas.slice(0, 3);
  }

  recommendPostingTime(trend) {
    const times = [
      'Tuesday 9:00 AM',
      'Wednesday 10:00 AM', 
      'Thursday 8:00 AM',
      'Friday 9:00 AM',
      'Monday 10:00 AM'
    ];
    
    return times[Math.floor(Math.random() * times.length)];
  }

  getFallbackTrends(industry) {
    return {
      industry,
      trends: [
        { keyword: `${industry} trends`, volume: 70, growth: 10 },
        { keyword: `${industry} tips`, volume: 65, growth: 8 },
        { keyword: `${industry} best practices`, volume: 60, growth: 12 }
      ],
      news: [
        { title: `Latest ${industry} developments`, source: 'Industry News', relevance: 0.8 }
      ],
      insights: {
        topTrends: [{ keyword: `${industry} trends`, volume: 70, growth: 10 }],
        emergingTopics: [],
        contentOpportunities: [],
        hashtagSuggestions: [`#${industry.toLowerCase()}`, `#${industry.toLowerCase()}tips`],
        engagementPredictions: []
      },
      timestamp: new Date().toISOString()
    };
  }

  // Database methods
  async saveIndustryResearch(userId, research) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO industry_trends (industry, trend_title, trend_description, relevance_score, source_url)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      research.trends.forEach(trend => {
        this.db.run(query, [
          research.industry,
          trend.keyword,
          `Trending topic in ${research.industry}`,
          (trend.volume || 50) / 100,
          `https://example.com/trends/${trend.keyword}`
        ]);
      });

      resolve();
    });
  }

  close() {
    this.db.close();
  }
} 