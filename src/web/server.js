/**
 * Web server for LinkedIn Personal Branding AI Agent
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { LinkedInPersonalBrandingGraph } from '../graph/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let graph = null;

export async function startWebServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Initialize the graph
  graph = new LinkedInPersonalBrandingGraph();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // Routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.post('/api/analyze-profile', async (req, res) => {
    try {
      const { userId, accessToken } = req.body;

      if (!userId || !accessToken) {
        return res.status(400).json({
          success: false,
          error: 'User ID and access token are required'
        });
      }

      const initialState = {
        userId,
        accessToken,
        industry: 'Technology', // Default
        duration: 30,
        keywords: []
      };

      const result = await graph.execute(initialState);

      if (result.hasError()) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        profileAnalysis: result.getProfileAnalysis(),
        status: result.status
      });

    } catch (error) {
      console.error('Profile Analysis Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.post('/api/research-industry', async (req, res) => {
    try {
      const { industry, keywords = [] } = req.body;

      if (!industry) {
        return res.status(400).json({
          success: false,
          error: 'Industry is required'
        });
      }

      const initialState = {
        userId: 'demo_user',
        accessToken: 'demo_token',
        industry,
        keywords,
        duration: 30
      };

      const result = await graph.execute(initialState);

      if (result.hasError()) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        industryResearch: result.getIndustryResearch(),
        status: result.status
      });

    } catch (error) {
      console.error('Industry Research Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.post('/api/generate-strategy', async (req, res) => {
    try {
      const { userId, accessToken, industry, duration = 30, keywords = [] } = req.body;

      if (!userId || !accessToken || !industry) {
        return res.status(400).json({
          success: false,
          error: 'User ID, access token, and industry are required'
        });
      }

      const initialState = {
        userId,
        accessToken,
        industry,
        duration,
        keywords
      };

      const result = await graph.execute(initialState);

      if (result.hasError()) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        contentStrategy: result.getContentStrategy(),
        calendar: result.getCalendar(),
        status: result.status
      });

    } catch (error) {
      console.error('Strategy Generation Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.post('/api/schedule-posts', async (req, res) => {
    try {
      const { userId, accessToken, industry, duration = 30, keywords = [] } = req.body;

      if (!userId || !accessToken || !industry) {
        return res.status(400).json({
          success: false,
          error: 'User ID, access token, and industry are required'
        });
      }

      const initialState = {
        userId,
        accessToken,
        industry,
        duration,
        keywords
      };

      const result = await graph.execute(initialState);

      if (result.hasError()) {
        return res.status(500).json({
          success: false,
          error: result.error
        });
      }

      res.json({
        success: true,
        automatedPosting: result.getAutomatedPosting(),
        status: result.status
      });

    } catch (error) {
      console.error('Post Scheduling Error:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  app.get('/api/status', (req, res) => {
    res.json({
      success: true,
      status: graph.getStatus()
    });
  });

  app.get('/api/analytics', (req, res) => {
    res.json({
      success: true,
      message: 'Analytics endpoint - implementation pending'
    });
  });

  app.get('/api/calendar', (req, res) => {
    res.json({
      success: true,
      message: 'Calendar endpoint - implementation pending'
    });
  });

  app.get('/api/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(process.cwd(), filename);
    
    res.download(filepath, (err) => {
      if (err) {
        res.status(404).json({
          success: false,
          error: 'File not found'
        });
      }
    });
  });

  // Start server
  app.listen(PORT, () => {
    console.log(`🌐 Web server running at http://localhost:${PORT}`);
    console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
    console.log(`🤖 LLM Available: ${graph.getStatus().llmAvailable ? 'Yes' : 'No'}`);
    console.log(`🧠 Model: ${graph.getStatus().model}`);
    console.log(`🔗 LinkedIn Personal Branding AI Agent Ready!`);
  });
} 