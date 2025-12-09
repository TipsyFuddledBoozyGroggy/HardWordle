/**
 * Unit tests for GameState class
 */

const GameState = require('../src/GameState');
const Guess = require('../src/Guess');
const FeedbackGenerator = require('../src/FeedbackGenerator');
const fc = require('fast-check');

describe('GameState', () => {
  describe('constructor', () => {
    test('should create a game state with valid parameters', () => {
      const gameState = new GameState('apple', 6);
      
      expect(gameState.getTargetWord()).toBe('apple');
      expect(gameState.maxAttempts).toBe(6);
      expect(gameState.getGameStatus()).toBe('in-progress');
      expect(gameState.getGuesses()).toEqual([]);
      expect(gameState.getRemainingAttempts()).toBe(6);
    });

    test('should use default maxAttempts of 6', () => {
      const gameState = new GameState('apple');
      
      expect(gameState.maxAttempts).toBe(6);
    });

    test('should normalize target word to lowercase', () => {
      const gameState = new GameState('APPLE');
      
      expect(gameState.getTargetWord()).toBe('apple');
    });

    test('should throw error if target word is not a string', () => {
      expect(() => new GameState(12345)).toThrow('Target word must be a string');
    });

    test('should throw error if target word is not 5 letters', () => {
      expect(() => new GameState('cat')).toThrow('Target word must be exactly 5 letters');
      expect(() => new GameState('elephant')).toThrow('Target word must be exactly 5 letters');
    });

    test('should throw error if maxAttempts is not a positive number', () => {
      expect(() => new GameState('apple', 0)).toThrow('Max attempts must be a positive number');
      expect(() => new GameState('apple', -1)).toThrow('Max attempts must be a positive number');
      expect(() => new GameState('apple', 'six')).toThrow('Max attempts must be a positive number');
    });
  });

  describe('addGuess', () => {
    test('should add a guess to the game state', () => {
      const gameState = new GameState('apple');
      const feedback = FeedbackGenerator.generateFeedback('bread', 'apple');
      const guess = new Guess('bread', feedback);
      
      gameState.addGuess(guess);
      
      expect(gameState.getGuesses()).toHaveLength(1);
      expect(gameState.getGuesses()[0]).toBe(guess);
      expect(gameState.getRemainingAttempts()).toBe(5);
    });

    test('should update status to won when guess matches target', () => {
      const gameState = new GameState('apple');
      const feedback = FeedbackGenerator.generateFeedback('apple', 'apple');
      const guess = new Guess('apple', feedback);
      
      gameState.addGuess(guess);
      
      expect(gameState.getGameStatus()).toBe('won');
      expect(gameState.isGameOver()).toBe(true);
    });

    test('should update status to lost when max attempts reached', () => {
      const gameState = new GameState('apple', 2);
      
      const feedback1 = FeedbackGenerator.generateFeedback('bread', 'apple');
      const guess1 = new Guess('bread', feedback1);
      gameState.addGuess(guess1);
      
      const feedback2 = FeedbackGenerator.generateFeedback('crane', 'apple');
      const guess2 = new Guess('crane', feedback2);
      gameState.addGuess(guess2);
      
      expect(gameState.getGameStatus()).toBe('lost');
      expect(gameState.isGameOver()).toBe(true);
    });

    test('should throw error when adding guess to finished game', () => {
      const gameState = new GameState('apple');
      const feedback = FeedbackGenerator.generateFeedback('apple', 'apple');
      const guess = new Guess('apple', feedback);
      
      gameState.addGuess(guess);
      
      const feedback2 = FeedbackGenerator.generateFeedback('bread', 'apple');
      const guess2 = new Guess('bread', feedback2);
      
      expect(() => gameState.addGuess(guess2)).toThrow('Cannot add guess: game is already over');
    });

    test('should throw error when guess is null or undefined', () => {
      const gameState = new GameState('apple');
      
      expect(() => gameState.addGuess(null)).toThrow('Guess cannot be null or undefined');
      expect(() => gameState.addGuess(undefined)).toThrow('Guess cannot be null or undefined');
    });
  });

  describe('getRemainingAttempts', () => {
    test('should return correct remaining attempts', () => {
      const gameState = new GameState('apple', 6);
      
      expect(gameState.getRemainingAttempts()).toBe(6);
      
      const feedback1 = FeedbackGenerator.generateFeedback('bread', 'apple');
      gameState.addGuess(new Guess('bread', feedback1));
      expect(gameState.getRemainingAttempts()).toBe(5);
      
      const feedback2 = FeedbackGenerator.generateFeedback('crane', 'apple');
      gameState.addGuess(new Guess('crane', feedback2));
      expect(gameState.getRemainingAttempts()).toBe(4);
    });
  });

  describe('isGameOver', () => {
    test('should return false for in-progress game', () => {
      const gameState = new GameState('apple');
      
      expect(gameState.isGameOver()).toBe(false);
    });

    test('should return true for won game', () => {
      const gameState = new GameState('apple');
      const feedback = FeedbackGenerator.generateFeedback('apple', 'apple');
      gameState.addGuess(new Guess('apple', feedback));
      
      expect(gameState.isGameOver()).toBe(true);
    });

    test('should return true for lost game', () => {
      const gameState = new GameState('apple', 1);
      const feedback = FeedbackGenerator.generateFeedback('bread', 'apple');
      gameState.addGuess(new Guess('bread', feedback));
      
      expect(gameState.isGameOver()).toBe(true);
    });
  });

  describe('getGuesses', () => {
    test('should return empty array initially', () => {
      const gameState = new GameState('apple');
      
      expect(gameState.getGuesses()).toEqual([]);
    });

    test('should return all guesses in chronological order', () => {
      const gameState = new GameState('apple');
      
      const feedback1 = FeedbackGenerator.generateFeedback('bread', 'apple');
      const guess1 = new Guess('bread', feedback1);
      gameState.addGuess(guess1);
      
      const feedback2 = FeedbackGenerator.generateFeedback('crane', 'apple');
      const guess2 = new Guess('crane', feedback2);
      gameState.addGuess(guess2);
      
      const guesses = gameState.getGuesses();
      expect(guesses).toHaveLength(2);
      expect(guesses[0]).toBe(guess1);
      expect(guesses[1]).toBe(guess2);
    });

    test('should return a copy to prevent external modification', () => {
      const gameState = new GameState('apple');
      
      const feedback = FeedbackGenerator.generateFeedback('bread', 'apple');
      const guess = new Guess('bread', feedback);
      gameState.addGuess(guess);
      
      const guesses = gameState.getGuesses();
      guesses.push(new Guess('crane', FeedbackGenerator.generateFeedback('crane', 'apple')));
      
      // Original should still have only 1 guess
      expect(gameState.getGuesses()).toHaveLength(1);
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: hard-wordle, Property 2: Initial state consistency
     * Validates: Requirements 1.2
     * 
     * For any new game, the initial game state must have zero guesses, 
     * six remaining attempts, and 'in-progress' status.
     */
    test('Property 2: Initial state consistency - new games start with correct initial state', () => {
      fc.assert(
        fc.property(
          // Generate random 5-letter target words
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
          // Generate random max attempts (1-10)
          fc.integer({ min: 1, max: 10 }),
          (targetWord, maxAttempts) => {
            const gameState = new GameState(targetWord, maxAttempts);
            
            // Initial state must have zero guesses
            expect(gameState.getGuesses()).toHaveLength(0);
            
            // Remaining attempts must equal maxAttempts
            expect(gameState.getRemainingAttempts()).toBe(maxAttempts);
            
            // Game status must be 'in-progress'
            expect(gameState.getGameStatus()).toBe('in-progress');
            
            // Game should not be over
            expect(gameState.isGameOver()).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 7: Attempt decrement
     * Validates: Requirements 2.4
     * 
     * For any valid guess submitted during an in-progress game, 
     * the number of remaining attempts must decrease by exactly 1.
     */
    test('Property 7: Attempt decrement - each valid guess decrements attempts by 1', () => {
      fc.assert(
        fc.property(
          // Generate random 5-letter target word
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
          // Generate random max attempts (2-10 to allow multiple guesses)
          fc.integer({ min: 2, max: 10 }),
          // Generate number of guesses to make (1 to maxAttempts-1)
          fc.integer({ min: 1, max: 5 }),
          (targetWord, maxAttempts, numGuesses) => {
            // Ensure we don't exceed max attempts or win the game
            fc.pre(numGuesses < maxAttempts);
            
            const gameState = new GameState(targetWord, maxAttempts);
            const initialRemaining = gameState.getRemainingAttempts();
            
            // Make numGuesses guesses (using different words to avoid winning)
            for (let i = 0; i < numGuesses; i++) {
              // Generate a guess word that's different from target to avoid winning
              const guessWord = 'aaaaa'.slice(0, i) + 'bbbbb'.slice(0, 5 - i);
              
              // Skip if we accidentally match the target
              if (guessWord === targetWord) {
                continue;
              }
              
              const remainingBefore = gameState.getRemainingAttempts();
              
              // Only add guess if game is still in progress
              if (gameState.getGameStatus() === 'in-progress') {
                const feedback = FeedbackGenerator.generateFeedback(guessWord, targetWord);
                const guess = new Guess(guessWord, feedback);
                gameState.addGuess(guess);
                
                // If game is still in progress, remaining should have decremented by 1
                if (gameState.getGameStatus() === 'in-progress') {
                  expect(gameState.getRemainingAttempts()).toBe(remainingBefore - 1);
                }
              }
            }
            
            // Total decrement should equal number of guesses made
            const guessesMade = gameState.getGuesses().length;
            expect(gameState.getRemainingAttempts()).toBe(initialRemaining - guessesMade);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 10: Guess history ordering
     * Validates: Requirements 4.2
     * 
     * For any sequence of valid guesses, the game state must maintain 
     * them in chronological order (first to last).
     */
    test('Property 10: Guess history ordering - guesses are stored in chronological order', () => {
      fc.assert(
        fc.property(
          // Generate random 5-letter target word
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
          // Generate array of guess words (2-5 guesses)
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 2, maxLength: 5 }
          ),
          (targetWord, guessWords) => {
            // Filter out any guesses that match the target (to avoid early win)
            const validGuessWords = guessWords.filter(w => w !== targetWord).slice(0, 5);
            
            // Need at least 2 guesses to test ordering
            fc.pre(validGuessWords.length >= 2);
            
            const gameState = new GameState(targetWord, 10); // Use high max to avoid loss
            const guessObjects = [];
            
            // Add guesses in order
            for (const guessWord of validGuessWords) {
              if (gameState.getGameStatus() === 'in-progress') {
                const feedback = FeedbackGenerator.generateFeedback(guessWord, targetWord);
                const guess = new Guess(guessWord, feedback);
                guessObjects.push(guess);
                gameState.addGuess(guess);
              }
            }
            
            // Retrieve guesses from game state
            const retrievedGuesses = gameState.getGuesses();
            
            // Verify order matches insertion order
            expect(retrievedGuesses.length).toBe(guessObjects.length);
            for (let i = 0; i < guessObjects.length; i++) {
              expect(retrievedGuesses[i].getWord()).toBe(guessObjects[i].getWord());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 11: Guess persistence
     * Validates: Requirements 4.1, 4.3
     * 
     * For any guess submitted during gameplay, it must remain accessible 
     * in the game state along with its feedback until the game ends.
     */
    test('Property 11: Guess persistence - all guesses remain accessible with feedback', () => {
      fc.assert(
        fc.property(
          // Generate random 5-letter target word
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
          // Generate array of guess words (1-5 guesses)
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 1, maxLength: 5 }
          ),
          (targetWord, guessWords) => {
            // Filter out any guesses that match the target (to avoid early win)
            const validGuessWords = guessWords.filter(w => w !== targetWord).slice(0, 5);
            
            fc.pre(validGuessWords.length >= 1);
            
            const gameState = new GameState(targetWord, 10); // Use high max to avoid loss
            const expectedGuesses = [];
            
            // Add guesses and track them
            for (const guessWord of validGuessWords) {
              if (gameState.getGameStatus() === 'in-progress') {
                const feedback = FeedbackGenerator.generateFeedback(guessWord, targetWord);
                const guess = new Guess(guessWord, feedback);
                expectedGuesses.push({ word: guessWord, feedback });
                gameState.addGuess(guess);
                
                // After each guess, verify all previous guesses are still accessible
                const currentGuesses = gameState.getGuesses();
                expect(currentGuesses.length).toBe(expectedGuesses.length);
                
                // Verify each guess and its feedback
                for (let i = 0; i < expectedGuesses.length; i++) {
                  expect(currentGuesses[i].getWord()).toBe(expectedGuesses[i].word);
                  expect(currentGuesses[i].getFeedback()).toEqual(expectedGuesses[i].feedback);
                }
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 15: Remaining attempts accuracy
     * Validates: Requirements 6.2
     * 
     * For any game state, the displayed remaining attempts must equal 
     * (max attempts - number of guesses made).
     */
    test('Property 15: Remaining attempts accuracy - remaining attempts calculation is always correct', () => {
      fc.assert(
        fc.property(
          // Generate random 5-letter target word
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
          // Generate random max attempts (2-10)
          fc.integer({ min: 2, max: 10 }),
          // Generate number of guesses to make
          fc.integer({ min: 0, max: 8 }),
          (targetWord, maxAttempts, numGuesses) => {
            // Ensure we don't exceed max attempts
            fc.pre(numGuesses <= maxAttempts);
            
            const gameState = new GameState(targetWord, maxAttempts);
            
            // Make guesses (using different words to avoid winning)
            let actualGuessesMade = 0;
            for (let i = 0; i < numGuesses; i++) {
              if (gameState.getGameStatus() === 'in-progress') {
                // Generate a guess word that's different from target
                const guessWord = String.fromCharCode(97 + (i % 26)).repeat(5);
                
                // Skip if we accidentally match the target
                if (guessWord === targetWord) {
                  continue;
                }
                
                const feedback = FeedbackGenerator.generateFeedback(guessWord, targetWord);
                const guess = new Guess(guessWord, feedback);
                gameState.addGuess(guess);
                actualGuessesMade++;
                
                // Verify the formula holds after each guess
                const expectedRemaining = maxAttempts - actualGuessesMade;
                expect(gameState.getRemainingAttempts()).toBe(expectedRemaining);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
