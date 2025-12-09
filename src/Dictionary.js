/**
 * Dictionary module for Hard Wordle
 * Manages the word dictionary and provides validation and selection methods
 */

class Dictionary {
  /**
   * Create a Dictionary instance
   * @param {string[]} words - Array of valid 5-letter words
   */
  constructor(words) {
    if (!Array.isArray(words)) {
      throw new Error('Dictionary constructor requires an array of words');
    }
    
    if (words.length === 0) {
      throw new Error('Dictionary cannot be empty');
    }
    
    // Store words in a Set for O(1) lookup performance
    this.wordSet = new Set(words.map(word => word.toLowerCase()));
    this.wordArray = Array.from(this.wordSet);
  }

  /**
   * Check if a word exists in the dictionary
   * @param {string} word - The word to validate
   * @returns {boolean} True if the word exists in the dictionary
   */
  isValidWord(word) {
    if (typeof word !== 'string') {
      return false;
    }
    return this.wordSet.has(word.toLowerCase());
  }

  /**
   * Get a random word from the dictionary
   * @returns {string} A random 5-letter word
   */
  getRandomWord() {
    const randomIndex = Math.floor(Math.random() * this.wordArray.length);
    return this.wordArray[randomIndex];
  }

  /**
   * Get the total number of words in the dictionary
   * @returns {number} The number of words
   */
  size() {
    return this.wordArray.length;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dictionary;
}
