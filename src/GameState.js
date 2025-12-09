/**
 * GameState module for Hard Wordle
 * Manages the state of a single game session
 */

/**
 * GameState class
 * Tracks the target word, guesses, attempts, and game status
 */
class GameState {
  /**
   * Create a GameState instance
   * @param {string} targetWord - The target word to guess (5 letters)
   * @param {number} maxAttempts - Maximum number of attempts allowed (default: 6)
   */
  constructor(targetWord, maxAttempts = 6) {
    if (typeof targetWord !== 'string') {
      throw new Error('Target word must be a string');
    }
    
    if (targetWord.length !== 5) {
      throw new Error('Target word must be exactly 5 letters');
    }
    
    if (typeof maxAttempts !== 'number' || maxAttempts <= 0) {
      throw new Error('Max attempts must be a positive number');
    }
    
    this.targetWord = targetWord.toLowerCase();
    this.guesses = [];
    this.maxAttempts = maxAttempts;
    this.gameStatus = 'in-progress';
  }

  /**
   * Add a new guess to the game
   * Updates game status if the guess matches the target or max attempts reached
   * @param {Guess} guess - The Guess object to add
   */
  addGuess(guess) {
    if (!guess) {
      throw new Error('Guess cannot be null or undefined');
    }
    
    // Don't allow adding guesses if game is over
    if (this.gameStatus !== 'in-progress') {
      throw new Error('Cannot add guess: game is already over');
    }
    
    this.guesses.push(guess);
    
    // Check if the guess matches the target word
    if (guess.getWord().toLowerCase() === this.targetWord) {
      this.gameStatus = 'won';
    } 
    // Check if max attempts reached
    else if (this.guesses.length >= this.maxAttempts) {
      this.gameStatus = 'lost';
    }
  }

  /**
   * Get the number of remaining attempts
   * @returns {number} Number of attempts remaining
   */
  getRemainingAttempts() {
    return this.maxAttempts - this.guesses.length;
  }

  /**
   * Check if the game is over
   * @returns {boolean} True if game is won or lost
   */
  isGameOver() {
    return this.gameStatus === 'won' || this.gameStatus === 'lost';
  }

  /**
   * Get all guesses made so far
   * @returns {Guess[]} Array of all guesses in chronological order
   */
  getGuesses() {
    return [...this.guesses]; // Return a copy to prevent external modification
  }

  /**
   * Get the current game status
   * @returns {'in-progress'|'won'|'lost'} The current game status
   */
  getGameStatus() {
    return this.gameStatus;
  }

  /**
   * Get the target word (for revealing after game ends)
   * @returns {string} The target word
   */
  getTargetWord() {
    return this.targetWord;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameState;
}
