/**
 * Test file for Social Media Content Creator
 */

import { ContentCreatorGraph } from './graph/index.js';

async function runTests() {
  console.log('🧪 Running Social Media Content Creator Tests\n');

  const testCases = [
    {
      name: 'Fitness for Busy Professionals (30 days)',
      brandTheme: 'Fitness for Busy Professionals',
      duration: 30
    },
    {
      name: 'Mental Health for Gen Z (15 days)',
      brandTheme: 'Mental Health for Gen Z',
      duration: 15
    },
    {
      name: 'Business Growth Strategies (7 days)',
      brandTheme: 'Business Growth Strategies',
      duration: 7
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log('='.repeat(50));

    try {
      const graph = new ContentCreatorGraph();
      await graph.initialize();

      console.log(`🤖 LLM Available: ${graph.getStatus().llmAvailable ? 'Yes' : 'No (using templates)'}`);

      const startTime = Date.now();
      const result = await graph.execute(testCase.brandTheme, testCase.duration);
      const endTime = Date.now();

      if (result.success) {
        console.log(`✅ Success! Generated ${result.contentCount} content items`);
        console.log(`⏱️  Execution time: ${endTime - startTime}ms`);
        console.log(`📁 Output file: ${result.outputFile}`);

        // Show first 3 items as preview
        console.log('\n📋 Content Preview:');
        result.content.slice(0, 3).forEach((item, index) => {
          console.log(`\nDay ${index + 1}: ${item.topic}`);
          console.log(`Caption: ${item.caption}`);
          console.log(`Hashtags: ${item.hashtags}`);
        });

        if (result.content.length > 3) {
          console.log(`\n... and ${result.content.length - 3} more days of content!`);
        }
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Test failed: ${error.message}`);
    }
  }

  console.log('\n🎉 All tests completed!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
} 