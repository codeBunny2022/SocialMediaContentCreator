/**
 * Formatter Node
 * Structures content into the required format with validation and cleaning
 */

export class FormatterNode {
  constructor() {}

  async execute(state) {
    try {
      console.log('Formatter Node: Starting content formatting...');
      
      const content = this.validateInput(state);
      const formattedContent = this.formatContent(content);
      
      console.log(`Formatter Node: Formatted ${formattedContent.length} content items`);
      return state.updateFormattedContent(formattedContent);
      
    } catch (error) {
      console.error('Formatter Node Error:', error);
      return state.setError(`Formatter failed: ${error.message}`);
    }
  }

  validateInput(state) {
    const content = state.getContent();
    
    if (!content?.length) {
      throw new Error('No content available for formatting');
    }
    
    // Validate each content item
    const errors = this.validateContent(content);
    if (errors.length > 0) {
      console.warn('Formatter Node: Content validation warnings:', errors);
    }
    
    return content;
  }

  formatContent(content) {
    return content.map((item, index) => {
      const formattedItem = {
        topic: this.cleanText(item.topic || `Topic ${index + 1}`),
        caption: this.cleanText(item.caption || `Engaging content for ${item.topic || 'this topic'}`),
        hashtags: this.cleanHashtags(item.hashtags || `#Content #Tips`)
      };
      
      // Ensure minimum quality standards
      if (formattedItem.topic.length < 3) {
        formattedItem.topic = `Topic ${index + 1}`;
      }
      
      if (formattedItem.caption.length < 10) {
        formattedItem.caption = `Engaging content about ${formattedItem.topic}`;
      }
      
      return formattedItem;
    });
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\-.,!?]/g, '') // Remove special characters except basic punctuation
      .substring(0, 500); // Limit length
  }

  cleanHashtags(hashtags) {
    if (!hashtags) return '#Content';
    
    // Extract hashtags and clean them
    const hashtagMatches = hashtags.match(/#[\w]+/g) || [];
    const cleanedHashtags = hashtagMatches
      .map(tag => tag.toLowerCase())
      .filter(tag => tag.length > 1) // Remove single character hashtags
      .slice(0, 5); // Limit to 5 hashtags
    
    return cleanedHashtags.length > 0 ? cleanedHashtags.join(' ') : '#Content';
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
      
      // Check for quality issues
      if (item.topic && item.topic.trim().length < 3) {
        errors.push(`Item ${index + 1}: Topic too short`);
      }
      
      if (item.caption && item.caption.trim().length < 10) {
        errors.push(`Item ${index + 1}: Caption too short`);
      }
    });
    
    return errors;
  }
} 