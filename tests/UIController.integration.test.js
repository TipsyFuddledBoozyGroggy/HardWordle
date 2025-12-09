/**
 * Integration Tests for UIController and GameController
 * Tests complete game flows and UI interactions
 */

const UIController = require('../src/UIController');
const GameController = require('../src/GameController');
const Dictionary = require('../src/Dictionary');

describe('UIController Integration Tests', () => {
  let dictionary;
  let gameController;
  let uiController;
  let container;

  beforeEach(() => {
    // Set up DOM structure
    document.body.innerHTML = `
      <div id="game-container">
        <header>
          <h1>Hard Wordle</h1>
          <div id="attempts-remaining">Attempts: 6/6</div>
        </header>
        
        <div id="game-board"></div>
        
        <div id="input-section">
          <input id="guess-input" type="text" maxlength="5" />
          <button id="submit-btn">Submit</button>
        </div>
        
        <div id="keyboard"></div>
        
        <div id="message-area"></div>
        
        <div id="definition-area"></div>
        
        <button id="new-game-btn">New Game</button>
      </div>
    `;

    // Create test dictionary with known words
    const testWords = ['apple', 'bread', 'crane', 'delta', 'eagle', 'frost', 'grape'];
    dictionary = new Dictionary(testWords);
    gameController = new GameController(dictionary);
    uiController = new UIController(gameController);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Complete game flow from start to win', () => {
    test('should complete a winning game flow', () => {
      // Initialize UI
      uiController.init();

      // Get the target word from the game state
      const targetWord = gameController.getGameState().getTargetWord();

      // Get DOM elements
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const gameBoard = document.getElementById('game-board');
      const messageArea = document.getElementById('message-area');
      const attemptsDisplay = document.getElementById('attempts-remaining');

      // Verify initial state
      expect(gameController.getGameState().getGuesses()).toHaveLength(0);
      expect(gameController.getGameState().getRemainingAttempts()).toBe(6);
      expect(gameController.getGameState().getGameStatus()).toBe('in-progress');
      expect(attemptsDisplay.textContent).toBe('Attempts: 0/6');
      expect(guessInput.disabled).toBe(false);
      expect(submitBtn.disabled).toBe(false);

      // Make a wrong guess first
      const wrongWord = dictionary.wordArray.find(w => w !== targetWord);
      guessInput.value = wrongWord;
      submitBtn.click();

      // Verify state after wrong guess
      expect(gameController.getGameState().getGuesses()).toHaveLength(1);
      expect(gameController.getGameState().getRemainingAttempts()).toBe(5);
      expect(gameController.getGameState().getGameStatus()).toBe('in-progress');
      expect(attemptsDisplay.textContent).toBe('Attempts: 1/6');
      expect(guessInput.value).toBe(''); // Input should be cleared
      expect(gameBoard.children.length).toBe(6); // All 6 rows displayed (1 filled, 5 empty)

      // Verify guess row has correct structure
      const guessRow = gameBoard.children[0];
      expect(guessRow.className).toBe('guess-row');
      expect(guessRow.children.length).toBe(5); // 5 letter tiles

      // Make the winning guess
      guessInput.value = targetWord;
      submitBtn.click();

      // Verify winning state
      expect(gameController.getGameState().getGuesses()).toHaveLength(2);
      expect(gameController.getGameState().getGameStatus()).toBe('won');
      expect(gameController.getGameState().isGameOver()).toBe(true);
      expect(attemptsDisplay.textContent).toBe('Attempts: 2/6');
      expect(gameBoard.children.length).toBe(6); // All 6 rows displayed (2 filled, 4 empty)

      // Verify win message
      expect(messageArea.textContent).toContain('Congratulations! You won!');
      expect(messageArea.textContent).toContain(targetWord.toUpperCase());
      expect(messageArea.classList.contains('success')).toBe(true);

      // Verify input is disabled
      expect(guessInput.disabled).toBe(true);
      expect(submitBtn.disabled).toBe(true);

      // Verify all letters in winning guess are marked correct
      const winningRow = gameBoard.children[1];
      for (let i = 0; i < 5; i++) {
        expect(winningRow.children[i].classList.contains('correct')).toBe(true);
      }

      // Try to submit another guess (should be prevented)
      guessInput.value = 'apple';
      submitBtn.click();

      // Verify no additional guess was added
      expect(gameController.getGameState().getGuesses()).toHaveLength(2);
    });

    test('should handle winning on first guess', () => {
      uiController.init();

      const targetWord = gameController.getGameState().getTargetWord();
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const messageArea = document.getElementById('message-area');

      // Win on first guess
      guessInput.value = targetWord;
      submitBtn.click();

      // Verify immediate win
      expect(gameController.getGameState().getGuesses()).toHaveLength(1);
      expect(gameController.getGameState().getGameStatus()).toBe('won');
      expect(messageArea.textContent).toContain('Congratulations! You won!');
      expect(guessInput.disabled).toBe(true);
    });

    test('should handle Enter key for submission', () => {
      uiController.init();

      const targetWord = gameController.getGameState().getTargetWord();
      const guessInput = document.getElementById('guess-input');
      const gameBoard = document.getElementById('game-board');

      // Submit using Enter key
      guessInput.value = targetWord;
      const enterEvent = new KeyboardEvent('keyup', { key: 'Enter' });
      guessInput.dispatchEvent(enterEvent);

      // Verify guess was submitted
      expect(gameController.getGameState().getGuesses()).toHaveLength(1);
      expect(gameController.getGameState().getGameStatus()).toBe('won');
      expect(gameBoard.children.length).toBe(6); // All 6 rows displayed
    });
  });

  describe('Complete game flow from start to loss', () => {
    test('should complete a losing game flow', () => {
      uiController.init();

      const targetWord = gameController.getGameState().getTargetWord();
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const gameBoard = document.getElementById('game-board');
      const messageArea = document.getElementById('message-area');
      const attemptsDisplay = document.getElementById('attempts-remaining');

      // Get 6 wrong words
      const wrongWords = dictionary.wordArray.filter(w => w !== targetWord).slice(0, 6);

      // Make 6 wrong guesses
      for (let i = 0; i < 6; i++) {
        guessInput.value = wrongWords[i];
        submitBtn.click();

        // Verify state after each guess
        expect(gameController.getGameState().getGuesses()).toHaveLength(i + 1);
        expect(gameController.getGameState().getRemainingAttempts()).toBe(5 - i);
        expect(attemptsDisplay.textContent).toBe(`Attempts: ${i + 1}/6`);
        expect(gameBoard.children.length).toBe(6); // Always 6 rows displayed

        if (i < 5) {
          // Game should still be in progress
          expect(gameController.getGameState().getGameStatus()).toBe('in-progress');
          expect(guessInput.disabled).toBe(false);
        } else {
          // After 6th guess, game should be lost
          expect(gameController.getGameState().getGameStatus()).toBe('lost');
          expect(guessInput.disabled).toBe(true);
          expect(submitBtn.disabled).toBe(true);
        }
      }

      // Verify loss message
      expect(messageArea.textContent).toContain('Game Over!');
      expect(messageArea.textContent).toContain(targetWord.toUpperCase());
      expect(messageArea.classList.contains('error')).toBe(true);

      // Verify game is over
      expect(gameController.getGameState().isGameOver()).toBe(true);

      // Try to submit another guess (should be prevented)
      guessInput.value = 'apple';
      submitBtn.click();

      // Verify no additional guess was added
      expect(gameController.getGameState().getGuesses()).toHaveLength(6);
    });

    test('should display all 6 guesses on the board when losing', () => {
      uiController.init();

      const targetWord = gameController.getGameState().getTargetWord();
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const gameBoard = document.getElementById('game-board');

      // Get 6 wrong words
      const wrongWords = dictionary.wordArray.filter(w => w !== targetWord).slice(0, 6);

      // Make 6 wrong guesses
      for (let i = 0; i < 6; i++) {
        guessInput.value = wrongWords[i];
        submitBtn.click();
      }

      // Verify all 6 guesses are displayed
      expect(gameBoard.children.length).toBe(6);

      // Verify each guess row has 5 tiles
      for (let i = 0; i < 6; i++) {
        const row = gameBoard.children[i];
        expect(row.className).toBe('guess-row');
        expect(row.children.length).toBe(5);

        // Verify each tile has a letter and status
        for (let j = 0; j < 5; j++) {
          const tile = row.children[j];
          expect(tile.className).toMatch(/letter-tile (correct|present|absent)/);
          expect(tile.textContent).toHaveLength(1);
        }
      }
    });
  });

  describe('Multiple sequential games', () => {
    test('should handle multiple sequential games correctly', () => {
      uiController.init();

      const newGameBtn = document.getElementById('new-game-btn');
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const gameBoard = document.getElementById('game-board');
      const messageArea = document.getElementById('message-area');

      // Play first game to completion (win)
      const firstTargetWord = gameController.getGameState().getTargetWord();
      guessInput.value = firstTargetWord;
      submitBtn.click();

      expect(gameController.getGameState().getGameStatus()).toBe('won');
      expect(gameBoard.children.length).toBe(6); // All 6 rows displayed

      // Start new game
      newGameBtn.click();

      // Verify game was reset
      expect(gameController.getGameState().getGuesses()).toHaveLength(0);
      expect(gameController.getGameState().getRemainingAttempts()).toBe(6);
      expect(gameController.getGameState().getGameStatus()).toBe('in-progress');
      expect(gameBoard.children.length).toBe(6); // All 6 rows displayed (all empty)
      expect(guessInput.value).toBe(''); // Input should be cleared
      expect(guessInput.disabled).toBe(false);
      expect(submitBtn.disabled).toBe(false);
      expect(messageArea.textContent).toBe(''); // Message should be cleared

      // Play second game to completion (loss)
      const secondTargetWord = gameController.getGameState().getTargetWord();
      const wrongWords = dictionary.wordArray.filter(w => w !== secondTargetWord).slice(0, 6);

      for (let i = 0; i < 6; i++) {
        guessInput.value = wrongWords[i];
        submitBtn.click();
      }

      expect(gameController.getGameState().getGameStatus()).toBe('lost');
      expect(gameBoard.children.length).toBe(6);

      // Start third game
      newGameBtn.click();

      // Verify game was reset again
      expect(gameController.getGameState().getGuesses()).toHaveLength(0);
      expect(gameController.getGameState().getRemainingAttempts()).toBe(6);
      expect(gameController.getGameState().getGameStatus()).toBe('in-progress');
      expect(gameBoard.children.length).toBe(6); // All 6 rows displayed (all empty)
      expect(guessInput.disabled).toBe(false);
      expect(submitBtn.disabled).toBe(false);

      // Make a guess in third game
      const thirdTargetWord = gameController.getGameState().getTargetWord();
      const thirdGuess = dictionary.wordArray.find(w => w !== thirdTargetWord);
      guessInput.value = thirdGuess;
      submitBtn.click();

      expect(gameController.getGameState().getGuesses()).toHaveLength(1);
      expect(gameBoard.children.length).toBe(6); // All 6 rows displayed (1 filled, 5 empty)
    });

    test('should start new game mid-game', () => {
      uiController.init();

      const newGameBtn = document.getElementById('new-game-btn');
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const gameBoard = document.getElementById('game-board');

      // Make a few guesses
      const targetWord = gameController.getGameState().getTargetWord();
      const wrongWords = dictionary.wordArray.filter(w => w !== targetWord).slice(0, 3);

      for (let i = 0; i < 3; i++) {
        guessInput.value = wrongWords[i];
        submitBtn.click();
      }

      expect(gameController.getGameState().getGuesses()).toHaveLength(3);
      expect(gameBoard.children.length).toBe(6); // All 6 rows displayed

      // Start new game mid-game
      newGameBtn.click();

      // Verify complete reset
      expect(gameController.getGameState().getGuesses()).toHaveLength(0);
      expect(gameController.getGameState().getRemainingAttempts()).toBe(6);
      expect(gameController.getGameState().getGameStatus()).toBe('in-progress');
      expect(gameBoard.children.length).toBe(6); // All 6 rows displayed (all empty)
      expect(guessInput.value).toBe('');
    });
  });

  describe('Error handling and display', () => {
    test('should display error for empty input', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const messageArea = document.getElementById('message-area');

      // Submit empty input
      guessInput.value = '';
      submitBtn.click();

      // Verify error message
      expect(messageArea.textContent).toBe('Please enter a word');
      expect(messageArea.classList.contains('error')).toBe(true);

      // Verify no guess was added
      expect(gameController.getGameState().getGuesses()).toHaveLength(0);
    });

    test('should display error for word too short', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const messageArea = document.getElementById('message-area');

      // Submit short word
      guessInput.value = 'cat';
      submitBtn.click();

      // Verify error message
      expect(messageArea.textContent).toBe('Word must be exactly 5 letters');
      expect(messageArea.classList.contains('error')).toBe(true);

      // Verify no guess was added
      expect(gameController.getGameState().getGuesses()).toHaveLength(0);
    });

    test('should display error for word too long', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const messageArea = document.getElementById('message-area');

      // Submit long word
      guessInput.value = 'elephant';
      submitBtn.click();

      // Verify error message
      expect(messageArea.textContent).toBe('Word must be exactly 5 letters');
      expect(messageArea.classList.contains('error')).toBe(true);

      // Verify no guess was added
      expect(gameController.getGameState().getGuesses()).toHaveLength(0);
    });

    test('should display error for invalid word', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const messageArea = document.getElementById('message-area');

      // Submit invalid word
      guessInput.value = 'zzzzz';
      submitBtn.click();

      // Verify error message
      expect(messageArea.textContent).toBe('Not a valid word');
      expect(messageArea.classList.contains('error')).toBe(true);

      // Verify no guess was added
      expect(gameController.getGameState().getGuesses()).toHaveLength(0);
    });

    test('should clear error message on successful guess', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const messageArea = document.getElementById('message-area');

      // Submit invalid word first
      guessInput.value = 'zzzzz';
      submitBtn.click();

      expect(messageArea.textContent).toBe('Not a valid word');

      // Submit valid word that is NOT the target word
      const targetWord = gameController.getGameState().getTargetWord();
      const validWord = dictionary.wordArray.find(w => w !== targetWord);
      guessInput.value = validWord;
      submitBtn.click();

      // Verify error message was cleared (should be empty since game is still in progress)
      expect(messageArea.textContent).toBe('');
      expect(messageArea.classList.contains('error')).toBe(false);

      // Verify guess was added
      expect(gameController.getGameState().getGuesses()).toHaveLength(1);
    });

    test('should restrict input to alphabetic characters only', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');

      // Try to input numbers and special characters
      guessInput.value = 'abc123!@#';
      const inputEvent = new Event('input', { bubbles: true });
      guessInput.dispatchEvent(inputEvent);

      // Verify only alphabetic characters remain
      expect(guessInput.value).toBe('abc');
    });

    test('should handle whitespace in input', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const messageArea = document.getElementById('message-area');

      // Submit input with whitespace
      guessInput.value = '  apple  ';
      submitBtn.click();

      // Verify whitespace was trimmed and guess was processed
      expect(gameController.getGameState().getGuesses()).toHaveLength(1);
      expect(gameController.getGameState().getGuesses()[0].getWord()).toBe('apple');
    });

    test('should display multiple errors in sequence', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const messageArea = document.getElementById('message-area');

      // Error 1: Empty input
      guessInput.value = '';
      submitBtn.click();
      expect(messageArea.textContent).toBe('Please enter a word');

      // Error 2: Wrong length
      guessInput.value = 'cat';
      submitBtn.click();
      expect(messageArea.textContent).toBe('Word must be exactly 5 letters');

      // Error 3: Invalid word
      guessInput.value = 'zzzzz';
      submitBtn.click();
      expect(messageArea.textContent).toBe('Not a valid word');

      // Verify no guesses were added
      expect(gameController.getGameState().getGuesses()).toHaveLength(0);
    });
  });

  describe('UI state management', () => {
    test('should update attempts display correctly', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const attemptsDisplay = document.getElementById('attempts-remaining');

      // Initial state
      expect(attemptsDisplay.textContent).toBe('Attempts: 0/6');

      // Make guesses and verify display updates
      const targetWord = gameController.getGameState().getTargetWord();
      const wrongWords = dictionary.wordArray.filter(w => w !== targetWord);

      for (let i = 0; i < 4; i++) {
        guessInput.value = wrongWords[i];
        submitBtn.click();
        expect(attemptsDisplay.textContent).toBe(`Attempts: ${i + 1}/6`);
      }
    });

    test('should clear input field after successful guess', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');

      // Submit valid guess
      guessInput.value = 'apple';
      submitBtn.click();

      // Verify input was cleared
      expect(guessInput.value).toBe('');
    });

    test('should not clear input field after invalid guess', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');

      // Submit invalid guess
      guessInput.value = 'zzzzz';
      submitBtn.click();

      // Verify input was NOT cleared (so user can correct it)
      expect(guessInput.value).toBe('zzzzz');
    });

    test('should focus input field after successful guess', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');

      // Submit valid guess
      guessInput.value = 'apple';
      submitBtn.click();

      // Verify input has focus
      expect(document.activeElement).toBe(guessInput);
    });

    test('should render feedback tiles with correct classes', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const gameBoard = document.getElementById('game-board');

      // Submit a guess
      guessInput.value = 'apple';
      submitBtn.click();

      // Verify tiles have correct structure
      const guessRow = gameBoard.children[0];
      expect(guessRow.children.length).toBe(5);

      for (let i = 0; i < 5; i++) {
        const tile = guessRow.children[i];
        expect(tile.className).toMatch(/letter-tile (correct|present|absent)/);
        expect(tile.textContent).toBe('apple'[i].toUpperCase());
      }
    });
  });
});
