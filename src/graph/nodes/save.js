/**
 * Save Node
 * Exports content plan to CSV file with proper file management
 */

import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
import path from 'path';

export class SaveNode {
  constructor() {}

  async execute(state) {
    try {
      console.log('Save Node: Starting CSV export...');
      
      const formattedContent = this.validateInput(state);
      const outputFile = await this.saveToCSV(formattedContent);
      
      console.log(`Save Node: Content saved to ${outputFile}`);
      return state.updateOutputFile(outputFile);
      
    } catch (error) {
      console.error('Save Node Error:', error);
      return state.setError(`Save failed: ${error.message}`);
    }
  }

  validateInput(state) {
    const formattedContent = state.getFormattedContent();
    
    if (!formattedContent?.length) {
      throw new Error('No formatted content available for saving');
    }
    
    // Validate content structure
    const errors = this.validateContent(formattedContent);
    if (errors.length > 0) {
      console.warn('Save Node: Content validation warnings:', errors);
    }
    
    return formattedContent;
  }

  async saveToCSV(formattedContent) {
    const timestamp = this.generateTimestamp();
    const filename = `content_calendar_${timestamp}.csv`;
    const filepath = path.join(process.cwd(), filename);

    // Create CSV writer with proper configuration
    const csvWriter = createObjectCsvWriter({
      path: filepath,
      header: [
        { id: 'Day', title: 'Day' },
        { id: 'Topic', title: 'Topic' },
        { id: 'Caption', title: 'Caption' },
        { id: 'Hashtags', title: 'Hashtags' }
      ]
    });

    // Prepare data for CSV
    const csvData = this.prepareCSVData(formattedContent);

    // Write to timestamped file
    await csvWriter.writeRecords(csvData);

    // Also create/update the default content_calendar.csv file
    await this.createDefaultFile(csvData);

    return filename;
  }

  prepareCSVData(formattedContent) {
    return formattedContent.map((item, index) => ({
      Day: index + 1,
      Topic: item.topic,
      Caption: item.caption,
      Hashtags: item.hashtags
    }));
  }

  async createDefaultFile(csvData) {
    const defaultFilepath = path.join(process.cwd(), 'content_calendar.csv');
    const defaultCsvWriter = createObjectCsvWriter({
      path: defaultFilepath,
      header: [
        { id: 'Day', title: 'Day' },
        { id: 'Topic', title: 'Topic' },
        { id: 'Caption', title: 'Caption' },
        { id: 'Hashtags', title: 'Hashtags' }
      ]
    });

    await defaultCsvWriter.writeRecords(csvData);
  }

  generateTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  }

  validateContent(content) {
    const errors = [];
    
    content.forEach((item, index) => {
      if (!item.topic || item.topic.trim().length === 0) {
        errors.push(`Item ${index + 1}: Missing topic`);
      }
      
      if (!item.caption || item.caption.trim().length === 0) {
        errors.push(`Item ${index + 1}: Missing caption`);
      }
      
      if (!item.hashtags || item.hashtags.trim().length === 0) {
        errors.push(`Item ${index + 1}: Missing hashtags`);
      }
    });
    
    return errors;
  }

  async saveToJSON(formattedContent) {
    const timestamp = this.generateTimestamp();
    const filename = `content_calendar_${timestamp}.json`;
    const filepath = path.join(process.cwd(), filename);

    const jsonData = {
      generatedAt: new Date().toISOString(),
      totalDays: formattedContent.length,
      content: formattedContent.map((item, index) => ({
        day: index + 1,
        topic: item.topic,
        caption: item.caption,
        hashtags: item.hashtags
      }))
    };

    fs.writeFileSync(filepath, JSON.stringify(jsonData, null, 2));
    return filename;
  }

  validateFile(filepath) {
    try {
      if (!fs.existsSync(filepath)) {
        return false;
      }
      
      const stats = fs.statSync(filepath);
      return stats.size > 0;
    } catch (error) {
      return false;
    }
  }
} 