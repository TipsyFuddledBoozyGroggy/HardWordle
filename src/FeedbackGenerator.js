/**
 * FeedbackGenerator module for Hard Wordle
 * Generates feedback for guesses compared to the target word
 */

/**
 * FeedbackGenerator class
 * Provides static methods to generate feedback for word guesses
 */
class FeedbackGenerator {
  /**
   * Generate feedback for a guess compared to the target word
   * Uses a two-pass algorithm to handle letter frequency correctly
   * 
   * @param {string} guess - The guessed word
   * @param {string} targetWord - The target word to compare against
   * @returns {LetterFeedback[]} Array of feedback for each letter
   */
  static generateFeedback(guess, targetWord) {
    if (typeof guess !== 'string' || typeof targetWord !== 'string') {
      throw new Error('Both guess and targetWord must be strings');
    }
    
    if (guess.length !== targetWord.length) {
      throw new Error('Guess and target word must have the same length');
    }
    
    // Normalize to lowercase for comparison
    const normalizedGuess = guess.toLowerCase();
    const normalizedTarget = targetWord.toLowerCase();
    
    const length = normalizedGuess.length;
    const feedback = [];
    
    // Initialize all feedback as 'absent'
    for (let i = 0; i < length; i++) {
      feedback.push({
        letter: normalizedGuess[i],
        status: 'absent'
      });
    }
    
    // Count letter frequencies in target word
    const targetLetterCount = {};
    for (let i = 0; i < length; i++) {
      const letter = normalizedTarget[i];
      targetLetterCount[letter] = (targetLetterCount[letter] || 0) + 1;
    }
    
    // First pass: Mark exact position matches as 'correct'
    for (let i = 0; i < length; i++) {
      if (normalizedGuess[i] === normalizedTarget[i]) {
        feedback[i].status = 'correct';
        // Decrement the count for this letter
        targetLetterCount[normalizedGuess[i]]--;
      }
    }
    
    // Second pass: Mark wrong position matches as 'present'
    for (let i = 0; i < length; i++) {
      // Skip if already marked as correct
      if (feedback[i].status === 'correct') {
        continue;
      }
      
      const letter = normalizedGuess[i];
      
      // Check if letter exists in target and we haven't used up all instances
      if (targetLetterCount[letter] && targetLetterCount[letter] > 0) {
        feedback[i].status = 'present';
        targetLetterCount[letter]--;
      }
      // Otherwise, it remains 'absent' (already initialized)
    }
    
    return feedback;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeedbackGenerator;
}
