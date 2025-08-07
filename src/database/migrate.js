import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/linkedin_agent.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          linkedin_access_token TEXT,
          linkedin_refresh_token TEXT,
          linkedin_profile_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // User profiles table
      db.run(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          full_name TEXT,
          headline TEXT,
          industry TEXT,
          location TEXT,
          summary TEXT,
          skills TEXT,
          experience TEXT,
          education TEXT,
          interests TEXT,
          brand_voice TEXT,
          target_audience TEXT,
          content_preferences TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Content posts table
      db.run(`
        CREATE TABLE IF NOT EXISTS content_posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT,
          content TEXT NOT NULL,
          hashtags TEXT,
          post_type TEXT DEFAULT 'text',
          status TEXT DEFAULT 'draft',
          scheduled_time DATETIME,
          posted_time DATETIME,
          linkedin_post_id TEXT,
          engagement_score REAL DEFAULT 0,
          likes_count INTEGER DEFAULT 0,
          comments_count INTEGER DEFAULT 0,
          shares_count INTEGER DEFAULT 0,
          reach_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Industry trends table
      db.run(`
        CREATE TABLE IF NOT EXISTS industry_trends (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          industry TEXT NOT NULL,
          trend_title TEXT NOT NULL,
          trend_description TEXT,
          relevance_score REAL DEFAULT 0,
          source_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Content calendar table
      db.run(`
        CREATE TABLE IF NOT EXISTS content_calendar (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          post_id INTEGER,
          scheduled_date DATE NOT NULL,
          scheduled_time TIME,
          status TEXT DEFAULT 'scheduled',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (post_id) REFERENCES content_posts (id)
        )
      `);

      // Analytics table
      db.run(`
        CREATE TABLE IF NOT EXISTS analytics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          post_id INTEGER,
          metric_name TEXT NOT NULL,
          metric_value REAL,
          metric_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (post_id) REFERENCES content_posts (id)
        )
      `);

      // A/B testing table
      db.run(`
        CREATE TABLE IF NOT EXISTS ab_tests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          test_name TEXT NOT NULL,
          variant_a TEXT,
          variant_b TEXT,
          winner TEXT,
          test_start_date DATETIME,
          test_end_date DATETIME,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      db.run("PRAGMA foreign_keys = ON", (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Database tables created successfully');
          resolve();
        }
      });
    });
  });
};

const insertSampleData = () => {
  return new Promise((resolve, reject) => {
    // Insert sample industry trends
    const sampleTrends = [
      {
        industry: 'Technology',
        trend_title: 'AI in Software Development',
        trend_description: 'AI-powered coding assistants and automated testing',
        relevance_score: 0.9,
        source_url: 'https://example.com/ai-dev-trends'
      },
      {
        industry: 'Marketing',
        trend_title: 'Personalization at Scale',
        trend_description: 'AI-driven personalized marketing campaigns',
        relevance_score: 0.8,
        source_url: 'https://example.com/personalization-trends'
      },
      {
        industry: 'Business',
        trend_title: 'Remote Work Optimization',
        trend_description: 'Tools and strategies for remote team management',
        relevance_score: 0.7,
        source_url: 'https://example.com/remote-work-trends'
      }
    ];

    const insertTrend = db.prepare(`
      INSERT INTO industry_trends (industry, trend_title, trend_description, relevance_score, source_url)
      VALUES (?, ?, ?, ?, ?)
    `);

    sampleTrends.forEach(trend => {
      insertTrend.run([
        trend.industry,
        trend.trend_title,
        trend.trend_description,
        trend.relevance_score,
        trend.source_url
      ]);
    });

    insertTrend.finalize((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('✅ Sample data inserted successfully');
        resolve();
      }
    });
  });
};

const runMigration = async () => {
  try {
    await createTables();
    await insertSampleData();
    console.log('🎉 Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration(); 