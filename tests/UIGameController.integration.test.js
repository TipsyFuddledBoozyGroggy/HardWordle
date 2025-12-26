/**
 * Integration tests for UI and GameController interaction
 * Tests that UI correctly reflects game state changes and processes user input
 */

const {
  mountAppWithTestController,
  waitForUpdates,
  typeWord,
  submitGuess,
  getBoardState,
  getKeyboardState,
  getDisplayedMessage
} = require('./testUtils');

describe('UI and GameController Integration Tests', () => {
  let wrapper;
  let gameController;

  beforeEach(async () => {
    const result = mountAppWithTestController();
    wrapper = result.wrapper;
    gameController = result.gameController;
    await waitForUpdates();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('UI Reflects Game State Changes', () => {
    test('should update attempts counter when game state changes', async () => {
      // Initial state
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 0/6');
      
      // Make first guess
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      await waitForUpdates();
      
      // Verify UI reflects the state change
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 1/6');
      expect(gameController.getGameState().getGuesses().length).toBe(1);
      
      // Make second guess
      await typeWord(wrapper, 'BREAD');
      await submitGuess(wrapper);
      await waitForUpdates();
      
      // Verify UI continues to reflect state changes
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 2/6');
      expect(gameController.getGameState().getGuesses().length).toBe(2);
    });

    test('should display game board that matches game state guesses', async () => {
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Make a few guesses
      const testGuesses = ['APPLE', 'BREAD'];
      
      for (let i = 0; i < testGuesses.length; i++) {
        await typeWord(wrapper, testGuesses[i]);
        await submitGuess(wrapper);
        await waitForUpdates();
        
        // Get game state
        const gameState = gameController.getGameState();
        const guesses = gameState.getGuesses();
        
        // Get UI board state
        const boardState = getBoardState(wrapper);
        
        // Verify UI board matches game state
        expect(guesses.length).toBe(i + 1);
        
        // Check that each completed guess row matches the game state
        for (let guessIndex = 0; guessIndex < guesses.length; guessIndex++) {
          const guess = guesses[guessIndex];
          const feedback = guess.getFeedback();
          const boardRow = boardState[guessIndex];
          
          // Verify each letter and its feedback status
          for (let letterIndex = 0; letterIndex < 5; letterIndex++) {
            expect(boardRow[letterIndex].letter).toBe(feedback[letterIndex].letter.toUpperCase());
            expect(boardRow[letterIndex].classes).toContain(feedback[letterIndex].status);
          }
        }
      }
    });

    test('should show win message when game controller indicates win', async () => {
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Make the winning guess
      await typeWord(wrapper, targetWord);
      await submitGuess(wrapper);
      
      // Verify game controller shows win state
      expect(gameController.getGameState().gameStatus).toBe('won');
      
      // Verify UI shows win message
      const message = getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toContain('Congratulations! You won!');
      expect(message.text).toContain(targetWord.toUpperCase());
      expect(message.classes).toContain('success');
    });

    test('should show loss message when game controller indicates loss', async () => {
      const targetWord = gameController.getGameState().getTargetWord();
      const testWords = ['APPLE', 'BREAD', 'CRANE', 'DANCE', 'EAGLE', 'FLAME'];
      
      // Make 6 wrong guesses
      for (let i = 0; i < 6; i++) {
        let guessWord = testWords[i];
        // Make sure we don't accidentally guess the target word
        if (guessWord === targetWord.toUpperCase()) {
          guessWord = 'GRAPE';
        }
        
        await typeWord(wrapper, guessWord);
        await submitGuess(wrapper);
        await waitForUpdates();
      }
      
      // Verify game controller shows loss state
      expect(gameController.getGameState().gameStatus).toBe('lost');
      
      // Verify UI shows loss message
      const message = getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toContain('Game Over!');
      expect(message.text).toContain(targetWord.toUpperCase());
      expect(message.classes).toContain('error');
    });

    test('should update remaining attempts display to match game state', async () => {
      const maxAttempts = gameController.getGameState().maxAttempts;
      expect(maxAttempts).toBe(6);
      
      // Test each attempt with words that won't accidentally win
      const targetWord = gameController.getGameState().getTargetWord().toUpperCase();
      const testWords = ['BREAD', 'CRANE', 'DANCE', 'EAGLE', 'FLAME', 'GRAPE'];
      
      // Filter out any test words that match the target word
      const safeTestWords = testWords.filter(word => word !== targetWord);
      
      for (let i = 0; i < Math.min(maxAttempts, safeTestWords.length); i++) {
        // Verify attempts before guess
        expect(wrapper.find('#attempts-remaining').text()).toBe(`Attempts: ${i}/${maxAttempts}`);
        expect(gameController.getGameState().getGuesses().length).toBe(i);
        
        // Make guess
        await typeWord(wrapper, safeTestWords[i]);
        await submitGuess(wrapper);
        await waitForUpdates();
        
        // Verify attempts after guess
        expect(wrapper.find('#attempts-remaining').text()).toBe(`Attempts: ${i + 1}/${maxAttempts}`);
        expect(gameController.getGameState().getGuesses().length).toBe(i + 1);
        
        // If game ended (won), break out of loop
        if (gameController.getGameState().gameStatus !== 'in-progress') {
          break;
        }
      }
    });
  });

  describe('User Input Processing', () => {
    test('should validate input through game controller and show appropriate errors', async () => {
      // Test empty input
      await submitGuess(wrapper);
      let message = getDisplayedMessage(wrapper);
      expect(message.text).toBe('Please enter a word');
      expect(message.classes).toContain('error');
      expect(gameController.getGameState().getGuesses().length).toBe(0);
      
      // Clear any current guess state
      wrapper.vm.currentGuess = '';
      await waitForUpdates();
      
      // Test short input
      await typeWord(wrapper, 'ABC');
      await submitGuess(wrapper);
      message = getDisplayedMessage(wrapper);
      expect(message.text).toBe('Word must be 5 letters long');
      expect(message.classes).toContain('error');
      expect(gameController.getGameState().getGuesses().length).toBe(0);
      
      // Clear any current guess state
      wrapper.vm.currentGuess = '';
      await waitForUpdates();
      
      // Test invalid word
      await typeWord(wrapper, 'ZZZZZ');
      await submitGuess(wrapper);
      message = getDisplayedMessage(wrapper);
      expect(message.text).toBe('Not a valid word');
      expect(message.classes).toContain('error');
      expect(gameController.getGameState().getGuesses().length).toBe(0);
      
      // Clear any current guess state
      wrapper.vm.currentGuess = '';
      await waitForUpdates();
      
      // Test valid word
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      expect(gameController.getGameState().getGuesses().length).toBe(1);
    });

    test('should process valid guesses through game controller', async () => {
      const initialGuessCount = gameController.getGameState().getGuesses().length;
      expect(initialGuessCount).toBe(0);
      
      // Submit valid guess
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Verify game controller processed the guess
      const gameState = gameController.getGameState();
      expect(gameState.getGuesses().length).toBe(1);
      
      const guess = gameState.getGuesses()[0];
      expect(guess.word).toBe('apple'); // Game controller normalizes to lowercase
      expect(guess.getFeedback()).toHaveLength(5);
      
      // Verify each feedback item has correct structure
      guess.getFeedback().forEach(feedback => {
        expect(feedback).toHaveProperty('letter');
        expect(feedback).toHaveProperty('status');
        expect(['correct', 'present', 'absent']).toContain(feedback.status);
      });
    });

    test('should handle case normalization through game controller', async () => {
      // Test different cases
      const testCases = ['apple', 'APPLE', 'Apple', 'aPpLe'];
      
      for (const testCase of testCases) {
        // Start new game for each test
        const newGameBtn = wrapper.find('#new-game-btn');
        await newGameBtn.trigger('click');
        await waitForUpdates();
        
        // Type the word in the specific case
        for (const char of testCase) {
          const keyButton = wrapper.find(`[data-key="${char.toUpperCase()}"]`);
          if (keyButton.exists()) {
            await keyButton.trigger('click');
            await waitForUpdates();
          }
        }
        
        await submitGuess(wrapper);
        
        // Verify game controller normalized the case
        const gameState = gameController.getGameState();
        if (gameState.getGuesses().length > 0) {
          const guess = gameState.getGuesses()[0];
          expect(guess.word).toBe('apple'); // Always normalized to lowercase
        }
      }
    });

    test('should reject invalid input without affecting game state', async () => {
      const initialGameState = {
        guesses: gameController.getGameState().getGuesses().length,
        attempts: gameController.getGameState().getRemainingAttempts(),
        status: gameController.getGameState().gameStatus
      };
      
      // Try various invalid inputs
      const invalidInputs = ['', 'AB', 'ABCDEF', 'ZZZZZ'];
      
      for (const invalidInput of invalidInputs) {
        // Clear any previous input
        const currentGuess = wrapper.vm.currentGuess;
        wrapper.vm.currentGuess = '';
        
        // Type invalid input
        if (invalidInput) {
          for (const char of invalidInput) {
            if (char.match(/[A-Z]/)) {
              const keyButton = wrapper.find(`[data-key="${char}"]`);
              if (keyButton.exists()) {
                await keyButton.trigger('click');
                await waitForUpdates();
              }
            }
          }
        }
        
        await submitGuess(wrapper);
        await waitForUpdates();
        
        // Verify game state unchanged
        expect(gameController.getGameState().getGuesses().length).toBe(initialGameState.guesses);
        expect(gameController.getGameState().getRemainingAttempts()).toBe(initialGameState.attempts);
        expect(gameController.getGameState().gameStatus).toBe(initialGameState.status);
        
        // Verify error message is shown
        const message = getDisplayedMessage(wrapper);
        expect(message).not.toBeNull();
        expect(message.classes).toContain('error');
      }
    });
  });

  describe('Feedback Display', () => {
    test('should correctly display feedback colors on game board', async () => {
      const targetWord = gameController.getGameState().getTargetWord().toUpperCase();
      
      // Make a guess that will have mixed feedback
      let testGuess = 'APPLE';
      // If target is APPLE, use a different word to get mixed feedback
      if (targetWord === 'APPLE') {
        testGuess = 'BREAD';
      }
      
      await typeWord(wrapper, testGuess);
      await submitGuess(wrapper);
      
      // Get feedback from game controller
      const gameState = gameController.getGameState();
      const guess = gameState.getGuesses()[0];
      const feedback = guess.getFeedback();
      
      // Get UI board state
      const boardState = getBoardState(wrapper);
      const firstRow = boardState[0];
      
      // Verify UI feedback matches game controller feedback
      for (let i = 0; i < 5; i++) {
        expect(firstRow[i].letter).toBe(feedback[i].letter.toUpperCase());
        expect(firstRow[i].classes).toContain(feedback[i].status);
        
        // Verify correct CSS classes are applied
        if (feedback[i].status === 'correct') {
          expect(firstRow[i].classes).toContain('correct');
        } else if (feedback[i].status === 'present') {
          expect(firstRow[i].classes).toContain('present');
        } else if (feedback[i].status === 'absent') {
          expect(firstRow[i].classes).toContain('absent');
        }
      }
    });

    test('should handle complex feedback scenarios correctly', async () => {
      // Test with a word that has duplicate letters
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Make a guess with duplicate letters
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Get feedback from game controller
      const gameState = gameController.getGameState();
      const guess = gameState.getGuesses()[0];
      const feedback = guess.getFeedback();
      
      // Get UI board state
      const boardState = getBoardState(wrapper);
      const firstRow = boardState[0];
      
      // Verify UI correctly displays complex feedback
      for (let i = 0; i < 5; i++) {
        expect(firstRow[i].letter).toBe(feedback[i].letter.toUpperCase());
        expect(firstRow[i].classes).toContain(feedback[i].status);
      }
      
      // Verify feedback follows correct rules for duplicate letters
      const letterCounts = {};
      feedback.forEach(f => {
        letterCounts[f.letter] = (letterCounts[f.letter] || 0) + 1;
      });
      
      // Each letter should appear the correct number of times
      Object.keys(letterCounts).forEach(letter => {
        const uiLetterCount = firstRow.filter(tile => tile.letter === letter.toUpperCase()).length;
        expect(uiLetterCount).toBe(letterCounts[letter]);
      });
    });
  });

  describe('Keyboard State Updates', () => {
    test('should update keyboard state based on guess feedback', async () => {
      // Make a guess
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Get feedback from game controller
      const gameState = gameController.getGameState();
      const guess = gameState.getGuesses()[0];
      const feedback = guess.getFeedback();
      
      // Get keyboard state from UI
      const keyboardState = getKeyboardState(wrapper);
      
      // Verify keyboard state reflects the feedback
      feedback.forEach(letterFeedback => {
        const letter = letterFeedback.letter.toUpperCase();
        const status = letterFeedback.status;
        
        expect(keyboardState[letter]).toContain(status);
      });
    });

    test('should maintain best status for letters across multiple guesses', async () => {
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Make first guess
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Make second guess with overlapping letters
      await typeWord(wrapper, 'BREAD');
      await submitGuess(wrapper);
      
      // Get all feedback from game controller
      const gameState = gameController.getGameState();
      const guesses = gameState.getGuesses();
      
      // Track the best status for each letter
      const bestStatus = {};
      const statusPriority = { 'correct': 3, 'present': 2, 'absent': 1 };
      
      guesses.forEach(guess => {
        guess.getFeedback().forEach(letterFeedback => {
          const letter = letterFeedback.letter.toUpperCase();
          const status = letterFeedback.status;
          
          if (!bestStatus[letter] || statusPriority[status] > statusPriority[bestStatus[letter]]) {
            bestStatus[letter] = status;
          }
        });
      });
      
      // Get keyboard state from UI
      const keyboardState = getKeyboardState(wrapper);
      
      // Verify keyboard shows best status for each letter
      Object.keys(bestStatus).forEach(letter => {
        expect(keyboardState[letter]).toContain(bestStatus[letter]);
      });
    });

    test('should reset keyboard state on new game', async () => {
      // Make a guess to set keyboard state
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Verify keyboard has some state
      let keyboardState = getKeyboardState(wrapper);
      const hasInitialState = Object.values(keyboardState).some(classes => 
        classes.includes('correct') || classes.includes('present') || classes.includes('absent')
      );
      expect(hasInitialState).toBe(true);
      
      // Start new game
      const newGameBtn = wrapper.find('#new-game-btn');
      await newGameBtn.trigger('click');
      await waitForUpdates();
      
      // Verify keyboard state is reset
      keyboardState = getKeyboardState(wrapper);
      const hasStateAfterReset = Object.values(keyboardState).some(classes => 
        classes.includes('correct') || classes.includes('present') || classes.includes('absent')
      );
      expect(hasStateAfterReset).toBe(false);
    });
  });

  describe('Game State Synchronization', () => {
    test('should maintain UI-GameController synchronization throughout game', async () => {
      const testWords = ['APPLE', 'BREAD', 'CRANE'];
      
      for (let i = 0; i < testWords.length; i++) {
        // Before guess
        const gameStateBefore = gameController.getGameState();
        expect(wrapper.find('#attempts-remaining').text()).toBe(`Attempts: ${i}/6`);
        expect(gameStateBefore.getGuesses().length).toBe(i);
        
        // Make guess
        await typeWord(wrapper, testWords[i]);
        await submitGuess(wrapper);
        await waitForUpdates();
        
        // After guess
        const gameStateAfter = gameController.getGameState();
        expect(wrapper.find('#attempts-remaining').text()).toBe(`Attempts: ${i + 1}/6`);
        expect(gameStateAfter.getGuesses().length).toBe(i + 1);
        
        // Verify guess was recorded correctly
        const lastGuess = gameStateAfter.getGuesses()[i];
        expect(lastGuess.word).toBe(testWords[i].toLowerCase());
        
        // Verify UI board reflects the guess
        const boardState = getBoardState(wrapper);
        const guessRow = boardState[i];
        expect(guessRow.map(tile => tile.letter).join('')).toBe(testWords[i]);
      }
    });

    test('should handle rapid input correctly', async () => {
      // Rapidly type and submit multiple guesses
      const rapidGuesses = ['APPLE', 'BREAD'];
      
      for (const guess of rapidGuesses) {
        // Type quickly without waiting
        for (const char of guess) {
          const keyButton = wrapper.find(`[data-key="${char}"]`);
          if (keyButton.exists()) {
            await keyButton.trigger('click');
          }
        }
        
        // Submit immediately
        const enterButton = wrapper.find('[data-key="ENTER"]');
        await enterButton.trigger('click');
        await waitForUpdates();
      }
      
      // Verify both guesses were processed correctly
      const gameState = gameController.getGameState();
      expect(gameState.getGuesses().length).toBe(2);
      expect(gameState.getGuesses()[0].word).toBe('apple');
      expect(gameState.getGuesses()[1].word).toBe('bread');
      
      // Verify UI reflects both guesses
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 2/6');
      const boardState = getBoardState(wrapper);
      expect(boardState[0].map(tile => tile.letter).join('')).toBe('APPLE');
      expect(boardState[1].map(tile => tile.letter).join('')).toBe('BREAD');
    });
  });
});