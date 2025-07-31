#!/usr/bin/env node

/**
 * Main entry point for Social Media Content Creator
 */

import { ContentCreatorGraph } from './graph/index.js';
import { startWebServer } from './web/server.js';

async function main() {
  const args = process.argv.slice(2);
  
  // Check if web interface is requested
  if (args.includes('--web') || args.includes('-w')) {
    console.log('Starting web interface...');
    await startWebServer();
    return;
  }

  // Command line usage
  if (args.length === 0) {
    console.log(`
Social Media Content Creator Agent

Usage:
  node src/main.js "Brand Theme" [duration]
  node src/main.js --web

Examples:
  node src/main.js "Fitness for Busy Professionals" 30
  node src/main.js "Mental Health for Gen Z" 15
  node src/main.js --web

Options:
  --web, -w    Start web interface
  duration     Number of days (1-30, default: 30)
`);
    return;
  }

  const brandTheme = args[0];
  const duration = parseInt(args[1]) || 30;

  console.log('🚀 Social Media Content Creator Agent');
  console.log('=====================================\n');

  try {
    // Initialize the graph
    const graph = new ContentCreatorGraph();
    await graph.initialize();

    // Validate input
    const validation = graph.validateInput(brandTheme, duration);
    if (!validation.isValid) {
      console.error('❌ Validation errors:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
      return;
    }

    console.log(`📝 Generating ${duration}-day content plan for: "${brandTheme}"`);
    console.log(`🤖 LLM Available: ${graph.getStatus().llmAvailable ? 'Yes' : 'No (using templates)'}\n`);

    // Execute the graph
    const result = await graph.execute(brandTheme, duration);

    if (result.success) {
      console.log('✅ Content generation completed successfully!');
      console.log(`📁 Output file: ${result.outputFile}`);
      console.log(`📊 Total content items: ${result.contentCount}`);
      
      // Show preview of first few items
      console.log('\n📋 Content Preview:');
      result.content.slice(0, 3).forEach((item, index) => {
        console.log(`\nDay ${index + 1}: ${item.topic}`);
        console.log(`Caption: ${item.caption}`);
        console.log(`Hashtags: ${item.hashtags}`);
      });
      
      if (result.content.length > 3) {
        console.log(`\n... and ${result.content.length - 3} more days of content!`);
      }
      
      console.log('\n🎉 Your content calendar is ready! Check the CSV file for the complete plan.');
    } else {
      console.error('❌ Content generation failed:');
      console.error(`   ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Application error:', error.message);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 