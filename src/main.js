#!/usr/bin/env node

/**
 * Main entry point for Social Media Content Creator
 */

import { LinkedInPersonalBrandingGraph } from './graph/index.js';
import { LinkedInService } from './services/linkedin.js';
import dotenv from 'dotenv';

dotenv.config();

const linkedinService = new LinkedInService();

async function main() {
  const args = process.argv.slice(2);
  
  // Check for web mode
  if (args.includes('--web') || args.includes('-w')) {
    console.log('Starting web interface...');
    await startWebServer();
    return;
  }

  // Check for help
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  // Check for demo mode
  if (args.includes('--demo')) {
    await runDemo();
    return;
  }

  // Parse arguments
  const parsedArgs = parseArguments(args);
  
  if (!parsedArgs.isValid) {
    console.error('❌ Invalid arguments:', parsedArgs.errors.join(', '));
    showHelp();
    process.exit(1);
  }

  try {
    await runLinkedInPersonalBrandingAgent(parsedArgs);
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    process.exit(1);
  }
}

function parseArguments(args) {
  const result = {
    isValid: true,
    errors: [],
    userId: null,
    accessToken: null,
    industry: null,
    duration: 30,
    keywords: [],
    generateCSV: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--user-id':
      case '-u':
        result.userId = args[++i];
        break;
      case '--access-token':
      case '-t':
        result.accessToken = args[++i];
        break;
      case '--industry':
      case '-i':
        result.industry = args[++i];
        break;
      case '--duration':
      case '-d':
        result.duration = parseInt(args[++i]);
        break;
      case '--keywords':
      case '-k':
        result.keywords = args[++i].split(',').map(k => k.trim());
        break;
      case '--csv':
        result.generateCSV = true;
        break;
      default:
        // If no flag, assume it's the industry
        if (!result.industry) {
          result.industry = arg;
        }
    }
  }

  // Validation
  if (!result.userId) {
    result.errors.push('User ID is required (--user-id or -u)');
  }
  if (!result.accessToken) {
    result.errors.push('LinkedIn access token is required (--access-token or -t)');
  }
  if (!result.industry) {
    result.errors.push('Industry is required (--industry or -i)');
  }
  if (result.duration < 1 || result.duration > 30) {
    result.errors.push('Duration must be between 1 and 30 days');
  }

  result.isValid = result.errors.length === 0;
  return result;
}

async function runLinkedInPersonalBrandingAgent(args) {
  console.log('🚀 LinkedIn Personal Branding AI Agent');
  console.log('=====================================');
  
  const graph = new LinkedInPersonalBrandingGraph();
  
  // Prepare initial state
  const initialState = {
    userId: args.userId,
    accessToken: args.accessToken,
    industry: args.industry,
    duration: args.duration,
    keywords: args.keywords,
    generateCSV: args.generateCSV
  };

  console.log(`📊 Industry: ${args.industry}`);
  console.log(`⏱️ Duration: ${args.duration} days`);
  console.log(`🔑 User ID: ${args.userId}`);
  console.log(`📝 Keywords: ${args.keywords.join(', ') || 'None'}`);
  console.log(`📄 Generate CSV: ${args.generateCSV ? 'Yes' : 'No'}`);
  console.log('');

  // Execute the graph
  const result = await graph.execute(initialState);
  
  if (result.hasError()) {
    throw new Error(result.error);
  }

  // Display results
  console.log('\n🎉 LinkedIn Personal Branding AI Agent completed successfully!');
  console.log('=====================================');
  
  const summary = result.exportSummary();
  
  console.log(`👤 Profile: ${summary.profile?.name || 'Not available'}`);
  console.log(`💼 Role: ${summary.professional?.currentRole || 'Not available'}`);
  console.log(`🏢 Company: ${summary.professional?.company || 'Not available'}`);
  console.log(`🎯 Brand Voice: ${summary.brandInsights?.brandVoice || 'Not available'}`);
  console.log(`📅 Calendar Entries: ${summary.calendar?.length || 0}`);
  console.log(`🤖 Automated Jobs: ${summary.automatedPosting?.postingJobs?.length || 0}`);
  console.log(`📊 Status: ${summary.status}`);
  
  if (args.generateCSV) {
    console.log(`📄 CSV Export: content_calendar.csv`);
  }
  
  graph.close();
}

async function runDemo() {
  console.log('🎭 Running LinkedIn Personal Branding AI Agent Demo');
  console.log('================================================');
  
  const demoArgs = {
    userId: 'demo_user_123',
    accessToken: 'demo_access_token',
    industry: 'Technology',
    duration: 7,
    keywords: ['AI', 'Machine Learning', 'Software Development'],
    generateCSV: true
  };

  try {
    await runLinkedInPersonalBrandingAgent(demoArgs);
  } catch (error) {
    console.error('Demo failed:', error.message);
  }
}

async function startWebServer() {
  const { default: server } = await import('./web/server.js');
  await server.start();
}

function showHelp() {
  console.log(`
LinkedIn Personal Branding AI Agent

Usage:
  node src/main.js [options]

Options:
  --user-id, -u <id>           LinkedIn user ID (required)
  --access-token, -t <token>    LinkedIn access token (required)
  --industry, -i <industry>     Industry/domain (required)
  --duration, -d <days>         Content duration in days (1-30, default: 30)
  --keywords, -k <keywords>     Comma-separated keywords
  --csv                         Generate CSV export
  --demo                        Run demo mode
  --web, -w                     Start web interface
  --help, -h                    Show this help

Examples:
  node src/main.js --user-id 123 --access-token abc123 --industry Technology
  node src/main.js -u 123 -t abc123 -i "Digital Marketing" -d 15 --csv
  node src/main.js --demo
  node src/main.js --web

Environment Variables:
  OPENAI_API_KEY               OpenAI API key (required)
  LINKEDIN_CLIENT_ID           LinkedIn OAuth client ID
  LINKEDIN_CLIENT_SECRET       LinkedIn OAuth client secret
  NEWS_API_KEY                 NewsAPI key for industry research
  GNEWS_API_KEY                GNews API key for industry research
  `);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Run the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
} 