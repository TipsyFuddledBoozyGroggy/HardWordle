/**
 * Guess module for Hard Wordle
 * Represents a single guess with its feedback
 */

/**
 * LetterFeedback type definition
 * @typedef {Object} LetterFeedback
 * @property {string} letter - The letter character
 * @property {'correct'|'present'|'absent'} status - The feedback status
 */

/**
 * Guess class
 * Represents a player's guess with feedback for each letter
 */
class Guess {
  /**
   * Create a Guess instance
   * @param {string} word - The guessed word (5 letters)
   * @param {LetterFeedback[]} feedback - Array of feedback for each letter
   */
  constructor(word, feedback) {
    if (typeof word !== 'string') {
      throw new Error('Guess word must be a string');
    }
    
    if (!Array.isArray(feedback)) {
      throw new Error('Feedback must be an array');
    }
    
    if (word.length !== feedback.length) {
      throw new Error('Feedback array length must match word length');
    }
    
    this.word = word.toLowerCase();
    this.feedback = feedback;
  }

  /**
   * Get the word
   * @returns {string} The guessed word
   */
  getWord() {
    return this.word;
  }

  /**
   * Get the feedback
   * @returns {LetterFeedback[]} The feedback array
   */
  getFeedback() {
    return this.feedback;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Guess;
}
