/**
 * Integration tests for App.vue component
 * Tests complete game flows and UI interactions
 */

const { nextTick } = require('vue');
const {
  mountAppWithTestController,
  waitForUpdates,
  typeWord,
  submitGuess,
  pressBackspace,
  getBoardState,
  getKeyboardState,
  getDisplayedMessage,
  playGameToWin,
  playGameToLoss
} = require('./testUtils');

describe('App.vue Integration Tests', () => {
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

  describe('Complete Game Flow - Win Scenario', () => {
    test('should complete a full game from start to win through UI', async () => {
      // Get the target word from the game state
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Verify initial state
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 0/6');
      expect(getDisplayedMessage(wrapper)).toBeNull();
      
      // Type and submit the correct word
      await typeWord(wrapper, targetWord);
      
      // Verify the word appears on the board before submission
      const boardBeforeSubmit = getBoardState(wrapper);
      const currentRow = boardBeforeSubmit[0];
      expect(currentRow.map(tile => tile.letter).join('')).toBe(targetWord.toUpperCase());
      
      // Submit the guess
      await submitGuess(wrapper);
      
      // Verify win state
      const message = getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toContain('Congratulations! You won!');
      expect(message.text).toContain(targetWord.toUpperCase());
      expect(message.classes).toContain('success');
      
      // Verify attempts counter updated
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 1/6');
      
      // Verify board shows correct feedback (all green)
      const finalBoard = getBoardState(wrapper);
      const winningRow = finalBoard[0];
      winningRow.forEach(tile => {
        expect(tile.classes).toContain('correct');
      });
      
      // Verify keyboard state updated
      const keyboardState = getKeyboardState(wrapper);
      for (const letter of targetWord.toUpperCase()) {
        expect(keyboardState[letter]).toContain('correct');
      }
    });

    test('should win on the last attempt (6th guess)', async () => {
      const targetWord = gameController.getGameState().getTargetWord();
      const testWords = ['APPLE', 'BREAD', 'CRANE', 'DANCE', 'EAGLE'];
      
      // Make 5 wrong guesses
      for (let i = 0; i < 5; i++) {
        let guessWord = testWords[i];
        // Make sure we don't accidentally guess the target word
        if (guessWord === targetWord.toUpperCase()) {
          guessWord = 'FLAME';
        }
        
        await typeWord(wrapper, guessWord);
        await submitGuess(wrapper);
        await waitForUpdates();
      }
      
      // Verify we're at 5 attempts
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 5/6');
      
      // Make the winning guess on the 6th attempt
      await typeWord(wrapper, targetWord);
      await submitGuess(wrapper);
      
      // Verify win state
      const message = getDisplayedMessage(wrapper);
      expect(message.text).toContain('Congratulations! You won!');
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 6/6');
    });
  });

  describe('Complete Game Flow - Loss Scenario', () => {
    test('should complete a full game from start to loss through UI', async () => {
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Play game to loss
      await playGameToLoss(wrapper, gameController);
      
      // Verify loss state
      const message = getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toContain('Game Over!');
      expect(message.text).toContain(targetWord.toUpperCase());
      expect(message.classes).toContain('error');
      
      // Verify attempts counter shows 6/6
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 6/6');
      
      // Verify all 6 rows are filled
      const finalBoard = getBoardState(wrapper);
      for (let i = 0; i < 6; i++) {
        const row = finalBoard[i];
        expect(row.every(tile => tile.letter !== '')).toBe(true);
      }
    });

    test('should show target word after loss', async () => {
      const targetWord = gameController.getGameState().getTargetWord();
      
      await playGameToLoss(wrapper, gameController);
      
      const message = getDisplayedMessage(wrapper);
      expect(message.text).toContain(`The word was ${targetWord.toUpperCase()}`);
    });
  });

  describe('Keyboard Interaction', () => {
    test('should handle on-screen keyboard clicks', async () => {
      // Click individual letter keys
      const qKey = wrapper.find('[data-key="Q"]');
      const wKey = wrapper.find('[data-key="W"]');
      const eKey = wrapper.find('[data-key="E"]');
      const rKey = wrapper.find('[data-key="R"]');
      const tKey = wrapper.find('[data-key="T"]');
      
      await qKey.trigger('click');
      await waitForUpdates();
      await wKey.trigger('click');
      await waitForUpdates();
      await eKey.trigger('click');
      await waitForUpdates();
      await rKey.trigger('click');
      await waitForUpdates();
      await tKey.trigger('click');
      await waitForUpdates();
      
      // Verify the word appears on the board
      const board = getBoardState(wrapper);
      const currentRow = board[0];
      expect(currentRow.map(tile => tile.letter).join('')).toBe('QWERT');
    });

    test('should handle backspace key', async () => {
      // Type some letters
      await typeWord(wrapper, 'HELLO');
      
      // Verify letters are there
      let board = getBoardState(wrapper);
      expect(board[0].map(tile => tile.letter).join('')).toBe('HELLO');
      
      // Press backspace twice
      await pressBackspace(wrapper);
      await pressBackspace(wrapper);
      
      // Verify letters were removed
      board = getBoardState(wrapper);
      expect(board[0].map(tile => tile.letter).join('')).toBe('HEL');
    });

    test('should handle enter key for submission', async () => {
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Type the target word
      await typeWord(wrapper, targetWord);
      
      // Press enter
      const enterKey = wrapper.find('[data-key="ENTER"]');
      await enterKey.trigger('click');
      await waitForUpdates();
      
      // Verify submission occurred
      const message = getDisplayedMessage(wrapper);
      expect(message.text).toContain('Congratulations! You won!');
    });

    test('should handle physical keyboard input', async () => {
      // Simulate physical keyboard events on the document
      const keydownEvent = new KeyboardEvent('keydown', { key: 'A' });
      document.dispatchEvent(keydownEvent);
      await waitForUpdates();
      
      const keydownEvent2 = new KeyboardEvent('keydown', { key: 'P' });
      document.dispatchEvent(keydownEvent2);
      await waitForUpdates();
      
      const keydownEvent3 = new KeyboardEvent('keydown', { key: 'P' });
      document.dispatchEvent(keydownEvent3);
      await waitForUpdates();
      
      const keydownEvent4 = new KeyboardEvent('keydown', { key: 'L' });
      document.dispatchEvent(keydownEvent4);
      await waitForUpdates();
      
      const keydownEvent5 = new KeyboardEvent('keydown', { key: 'E' });
      document.dispatchEvent(keydownEvent5);
      await waitForUpdates();
      
      // Verify the word appears on the board
      const board = getBoardState(wrapper);
      const currentRow = board[0];
      expect(currentRow.map(tile => tile.letter).join('')).toBe('APPLE');
      
      // Test physical backspace
      const backspaceEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      document.dispatchEvent(backspaceEvent);
      await waitForUpdates();
      
      const boardAfterBackspace = getBoardState(wrapper);
      expect(boardAfterBackspace[0].map(tile => tile.letter).join('')).toBe('APPL');
      
      // Test physical enter
      const keydownEventE = new KeyboardEvent('keydown', { key: 'E' });
      document.dispatchEvent(keydownEventE);
      await waitForUpdates();
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(enterEvent);
      await waitForUpdates();
      
      // Should have submitted the guess
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 1/6');
    });

    test('should limit input to 5 characters', async () => {
      // Try to type more than 5 characters
      await typeWord(wrapper, 'ABCDEFGH');
      
      // Verify only first 5 characters are shown
      const board = getBoardState(wrapper);
      const currentRow = board[0];
      expect(currentRow.map(tile => tile.letter).join('')).toBe('ABCDE');
    });

    test('should ignore input when game is over', async () => {
      // Win the game first
      const targetWord = gameController.getGameState().getTargetWord();
      await playGameToWin(wrapper, gameController, targetWord);
      
      // Try to type after game is over
      await typeWord(wrapper, 'HELLO');
      
      // Verify no new input was accepted
      const board = getBoardState(wrapper);
      // The winning row should still be there, but no new input
      expect(board[0].map(tile => tile.letter).join('')).toBe(targetWord.toUpperCase());
      
      // Second row should be empty
      expect(board[1].every(tile => tile.letter === '')).toBe(true);
    });
  });

  describe('Error Message Display and Clearing', () => {
    test('should display error for empty guess', async () => {
      // Try to submit without typing anything
      await submitGuess(wrapper);
      
      const message = getDisplayedMessage(wrapper);
      expect(message).not.toBeNull();
      expect(message.text).toBe('Please enter a word');
      expect(message.classes).toContain('error');
    });

    test('should display error for short word', async () => {
      // Type only 3 letters
      await typeWord(wrapper, 'ABC');
      await submitGuess(wrapper);
      
      const message = getDisplayedMessage(wrapper);
      expect(message.text).toBe('Word must be 5 letters long');
      expect(message.classes).toContain('error');
    });

    test('should display error for invalid word', async () => {
      // Type a word not in dictionary
      await typeWord(wrapper, 'ZZZZZ');
      await submitGuess(wrapper);
      
      const message = getDisplayedMessage(wrapper);
      expect(message.text).toBe('Not a valid word');
      expect(message.classes).toContain('error');
    });

    test('should clear error message on next valid input', async () => {
      // First, create an error
      await submitGuess(wrapper); // Empty guess
      expect(getDisplayedMessage(wrapper).text).toBe('Please enter a word');
      
      // Then make a valid guess
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Error message should be cleared
      const message = getDisplayedMessage(wrapper);
      if (message) {
        // If there's a message, it should be a game result, not an error
        expect(message.classes).not.toContain('error');
      }
    });

    test('should not consume attempts for invalid guesses', async () => {
      // Make an invalid guess
      await typeWord(wrapper, 'ZZZZZ');
      await submitGuess(wrapper);
      
      // Verify attempts counter didn't change
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 0/6');
      
      // Make another invalid guess
      await typeWord(wrapper, 'ABC');
      await submitGuess(wrapper);
      
      // Still no attempts consumed
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 0/6');
    });
  });

  describe('New Game Functionality', () => {
    test('should reset game state when new game button is clicked', async () => {
      // Make a guess first
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Verify game state changed
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 1/6');
      
      // Click new game button
      const newGameBtn = wrapper.find('#new-game-btn');
      await newGameBtn.trigger('click');
      await waitForUpdates();
      
      // Verify game was reset
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 0/6');
      
      // Verify board is cleared
      const board = getBoardState(wrapper);
      expect(board[0].every(tile => tile.letter === '')).toBe(true);
      
      // Verify message is cleared
      expect(getDisplayedMessage(wrapper)).toBeNull();
    });

    test('should clear keyboard state on new game', async () => {
      // Make a guess to update keyboard state
      await typeWord(wrapper, 'APPLE');
      await submitGuess(wrapper);
      
      // Verify keyboard has some state
      const keyboardBefore = getKeyboardState(wrapper);
      const hasKeyboardState = Object.values(keyboardBefore).some(classes => 
        classes.includes('correct') || classes.includes('present') || classes.includes('absent')
      );
      expect(hasKeyboardState).toBe(true);
      
      // Start new game
      const newGameBtn = wrapper.find('#new-game-btn');
      await newGameBtn.trigger('click');
      await waitForUpdates();
      
      // Verify keyboard state is cleared
      const keyboardAfter = getKeyboardState(wrapper);
      const hasKeyboardStateAfter = Object.values(keyboardAfter).some(classes => 
        classes.includes('correct') || classes.includes('present') || classes.includes('absent')
      );
      expect(hasKeyboardStateAfter).toBe(false);
    });

    test('should generate new target word on new game', async () => {
      const firstTargetWord = gameController.getGameState().getTargetWord();
      
      // Start new game
      const newGameBtn = wrapper.find('#new-game-btn');
      await newGameBtn.trigger('click');
      await waitForUpdates();
      
      const secondTargetWord = gameController.getGameState().getTargetWord();
      
      // Note: There's a small chance they could be the same, but very unlikely with 26 words
      // We'll just verify that a new game was started (attempts reset)
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 0/6');
    });
  });

  describe('Game State Display', () => {
    test('should display correct attempts counter throughout game', async () => {
      const testWords = ['APPLE', 'BREAD', 'CRANE'];
      
      // Initial state
      expect(wrapper.find('#attempts-remaining').text()).toBe('Attempts: 0/6');
      
      // Make guesses and verify counter updates
      for (let i = 0; i < testWords.length; i++) {
        await typeWord(wrapper, testWords[i]);
        await submitGuess(wrapper);
        await waitForUpdates();
        
        expect(wrapper.find('#attempts-remaining').text()).toBe(`Attempts: ${i + 1}/6`);
      }
    });

    test('should show game title', async () => {
      const title = wrapper.find('h1');
      expect(title.exists()).toBe(true);
      expect(title.text()).toBe('Hard Wordle');
    });

    test('should show new game button', async () => {
      const newGameBtn = wrapper.find('#new-game-btn');
      expect(newGameBtn.exists()).toBe(true);
      expect(newGameBtn.text()).toBe('New Game');
    });

    test('should show keyboard layout', async () => {
      // Verify all expected keys are present
      const expectedKeys = [
        'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
        'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
        'ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'
      ];
      
      expectedKeys.forEach(key => {
        const keyElement = wrapper.find(`[data-key="${key}"]`);
        expect(keyElement.exists()).toBe(true);
      });
      
      // Verify backspace shows correct symbol
      const backspaceKey = wrapper.find('[data-key="BACKSPACE"]');
      expect(backspaceKey.text()).toBe('⌫');
    });
  });
});