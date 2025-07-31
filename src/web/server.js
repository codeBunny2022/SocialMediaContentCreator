/**
 * Web server for Social Media Content Creator
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { ContentCreatorGraph } from '../graph/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let graph = null;

export async function startWebServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Initialize the graph
  graph = new ContentCreatorGraph();
  await graph.initialize();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  // Routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.post('/api/generate', async (req, res) => {
    try {
      const { brandTheme, duration = 30 } = req.body;

      if (!brandTheme) {
        return res.status(400).json({
          success: false,
          error: 'Brand theme is required'
        });
      }

      // Validate input
      const validation = graph.validateInput(brandTheme, duration);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.errors.join(', ')
        });
      }

      // Execute the graph
      const result = await graph.execute(brandTheme, duration);

      if (result.success) {
        res.json({
          success: true,
          outputFile: result.outputFile,
          contentCount: result.contentCount,
          content: result.content,
          csvData: result.csvData
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      console.error('API Error:', error);
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
    console.log(`🤖 LLM Available: ${graph.getStatus().llmAvailable ? 'Yes' : 'No (using templates)'}`);
  });
} 