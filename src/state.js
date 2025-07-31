/**
 * State management for the Social Media Content Creator Agent
 */

export class ContentCreatorState {
  constructor(brandTheme, duration = 30) {
    this.brandTheme = brandTheme;
    this.duration = duration;
    this.topics = [];
    this.content = [];
    this.formattedContent = [];
    this.outputFile = null;
    this.error = null;
  }

  // Update methods for each node
  updateTopics(topics) {
    this.topics = topics;
    return this;
  }

  updateContent(content) {
    this.content = content;
    return this;
  }

  updateFormattedContent(formattedContent) {
    this.formattedContent = formattedContent;
    return this;
  }

  updateOutputFile(outputFile) {
    this.outputFile = outputFile;
    return this;
  }

  setError(error) {
    this.error = error;
    return this;
  }

  // Validation methods
  isValid() {
    return this.brandTheme && 
           this.duration > 0 && 
           this.duration <= 30 &&
           !this.error;
  }

  hasTopics() {
    return this.topics.length > 0;
  }

  hasContent() {
    return this.content.length > 0;
  }

  isComplete() {
    return this.formattedContent.length > 0 && this.outputFile;
  }

  // Getter methods
  getBrandTheme() {
    return this.brandTheme;
  }

  getDuration() {
    return this.duration;
  }

  getTopics() {
    return this.topics;
  }

  getContent() {
    return this.content;
  }

  getFormattedContent() {
    return this.formattedContent;
  }

  getOutputFile() {
    return this.outputFile;
  }

  getError() {
    return this.error;
  }

  // Export for CSV
  toCSVData() {
    return this.formattedContent.map((item, index) => ({
      Day: index + 1,
      Topic: item.topic,
      Caption: item.caption,
      Hashtags: item.hashtags
    }));
  }
} 