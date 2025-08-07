import axios from 'axios';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data/linkedin_agent.db');

export class LinkedInService {
  constructor() {
    this.baseURL = 'https://api.linkedin.com/v2';
    this.db = new sqlite3.Database(dbPath);
  }

  // LinkedIn OAuth methods
  async getAuthUrl(clientId, redirectUri, scope = 'r_liteprofile w_member_social') {
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${Math.random().toString(36).substring(7)}`;
    
    return authUrl;
  }

  async exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      console.error('LinkedIn token exchange failed:', error);
      throw new Error('Failed to exchange code for token');
    }
  }

  async refreshAccessToken(refreshToken, clientId, clientSecret) {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in
      };
    } catch (error) {
      console.error('LinkedIn token refresh failed:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  // Profile analysis methods
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return {
        id: response.data.id,
        firstName: response.data.localizedFirstName,
        lastName: response.data.localizedLastName,
        profilePicture: response.data.profilePicture?.displayImage,
        publicProfileUrl: response.data.publicIdentifier
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  async getDetailedProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/me?projection=(id,firstName,lastName,profilePicture,positions,educations,skills,interests)`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return {
        basic: {
          id: response.data.id,
          firstName: response.data.localizedFirstName,
          lastName: response.data.localizedLastName,
          profilePicture: response.data.profilePicture?.displayImage
        },
        positions: response.data.positions?.elements || [],
        educations: response.data.educations?.elements || [],
        skills: response.data.skills?.elements || [],
        interests: response.data.interests?.elements || []
      };
    } catch (error) {
      console.error('Failed to get detailed profile:', error);
      throw new Error('Failed to fetch detailed profile');
    }
  }

  // Content posting methods
  async createTextPost(accessToken, content, visibility = 'PUBLIC') {
    try {
      const postData = {
        author: `urn:li:person:${await this.getUserId(accessToken)}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': visibility
        }
      };

      const response = await axios.post(`${this.baseURL}/ugcPosts`, postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        }
      });

      return {
        postId: response.data.id,
        status: 'published'
      };
    } catch (error) {
      console.error('Failed to create LinkedIn post:', error);
      throw new Error('Failed to create post');
    }
  }

  async createArticlePost(accessToken, title, content, visibility = 'PUBLIC') {
    try {
      // First create the article
      const articleData = {
        title,
        content: {
          content: content,
          contentType: 'ARTICLE'
        }
      };

      const articleResponse = await axios.post(`${this.baseURL}/articles`, articleData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        }
      });

      // Then share the article
      const shareData = {
        author: `urn:li:person:${await this.getUserId(accessToken)}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: `Check out my latest article: ${title}`
            },
            shareMediaCategory: 'ARTICLE',
            media: [{
              status: 'READY',
              description: {
                text: title
              },
              media: articleResponse.data.id,
              title: {
                text: title
              }
            }]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': visibility
        }
      };

      const shareResponse = await axios.post(`${this.baseURL}/ugcPosts`, shareData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        }
      });

      return {
        articleId: articleResponse.data.id,
        postId: shareResponse.data.id,
        status: 'published'
      };
    } catch (error) {
      console.error('Failed to create LinkedIn article:', error);
      throw new Error('Failed to create article');
    }
  }

  // Engagement tracking methods
  async getPostAnalytics(accessToken, postId) {
    try {
      const response = await axios.get(`${this.baseURL}/socialMetrics/${postId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return {
        likes: response.data.totalShareStatistics?.likeCount || 0,
        comments: response.data.totalShareStatistics?.commentCount || 0,
        shares: response.data.totalShareStatistics?.shareCount || 0,
        impressions: response.data.totalShareStatistics?.impressionCount || 0,
        clicks: response.data.totalShareStatistics?.clickCount || 0
      };
    } catch (error) {
      console.error('Failed to get post analytics:', error);
      return {
        likes: 0,
        comments: 0,
        shares: 0,
        impressions: 0,
        clicks: 0
      };
    }
  }

  // Helper methods
  async getUserId(accessToken) {
    const profile = await this.getUserProfile(accessToken);
    return profile.id;
  }

  // Database methods for storing LinkedIn data
  async saveUserTokens(userId, accessToken, refreshToken, profileId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE users 
        SET linkedin_access_token = ?, linkedin_refresh_token = ?, linkedin_profile_id = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      this.db.run(query, [accessToken, refreshToken, profileId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async saveUserProfile(userId, profileData) {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT OR REPLACE INTO user_profiles 
        (user_id, full_name, headline, industry, location, summary, skills, experience, education, interests, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      const skills = profileData.skills?.map(skill => skill.name).join(', ') || '';
      const experience = JSON.stringify(profileData.positions || []);
      const education = JSON.stringify(profileData.educations || []);
      const interests = JSON.stringify(profileData.interests || []);

      this.db.run(query, [
        userId,
        `${profileData.basic.firstName} ${profileData.basic.lastName}`,
        profileData.positions?.[0]?.title || '',
        profileData.positions?.[0]?.companyName || '',
        profileData.positions?.[0]?.location || '',
        '', // summary
        skills,
        experience,
        education,
        interests
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
  }

  async savePostAnalytics(userId, postId, analytics) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE content_posts 
        SET likes_count = ?, comments_count = ?, shares_count = ?, reach_count = ?, engagement_score = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `;
      
      const engagementScore = (analytics.likes + analytics.comments * 2 + analytics.shares * 3) / 
                             Math.max(analytics.impressions, 1);

      this.db.run(query, [
        analytics.likes,
        analytics.comments,
        analytics.shares,
        analytics.impressions,
        engagementScore,
        postId,
        userId
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  close() {
    this.db.close();
  }
} 