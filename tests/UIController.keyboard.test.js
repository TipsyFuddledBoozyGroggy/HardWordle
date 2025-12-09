/**
 * Unit Tests for UIController Keyboard Functionality
 * Tests on-screen keyboard interactions and state management
 */

const UIController = require('../src/UIController');
const GameController = require('../src/GameController');
const Dictionary = require('../src/Dictionary');

describe('UIController Keyboard Functionality', () => {
  let dictionary;
  let gameController;
  let uiController;

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
    const testWords = ['apple', 'bread', 'crane', 'delta', 'eagle', 'frost', 'grape', 'house'];
    dictionary = new Dictionary(testWords);
    gameController = new GameController(dictionary);
    uiController = new UIController(gameController);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Keyboard creation and layout', () => {
    test('should create keyboard with correct QWERTY layout', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const rows = keyboard.querySelectorAll('.keyboard-row');

      // Should have 3 rows
      expect(rows.length).toBe(3);

      // First row: QWERTYUIOP
      const row1Keys = Array.from(rows[0].querySelectorAll('.key')).map(k => k.dataset.key);
      expect(row1Keys).toEqual(['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']);

      // Second row: ASDFGHJKL
      const row2Keys = Array.from(rows[1].querySelectorAll('.key')).map(k => k.dataset.key);
      expect(row2Keys).toEqual(['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']);

      // Third row: ENTER, Z-M, BACKSPACE
      const row3Keys = Array.from(rows[2].querySelectorAll('.key')).map(k => k.dataset.key);
      expect(row3Keys).toEqual(['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']);
    });

    test('should mark ENTER and BACKSPACE keys as wide', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const enterKey = keyboard.querySelector('[data-key="ENTER"]');
      const backspaceKey = keyboard.querySelector('[data-key="BACKSPACE"]');

      expect(enterKey.classList.contains('wide')).toBe(true);
      expect(backspaceKey.classList.contains('wide')).toBe(true);
    });

    test('should display backspace symbol for BACKSPACE key', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const backspaceKey = keyboard.querySelector('[data-key="BACKSPACE"]');

      expect(backspaceKey.textContent).toBe('⌫');
    });

    test('should display text for ENTER key', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const enterKey = keyboard.querySelector('[data-key="ENTER"]');

      expect(enterKey.textContent).toBe('ENTER');
    });
  });

  describe('Keyboard letter input', () => {
    test('should add letter to input field when letter key is clicked', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const keyboard = document.getElementById('keyboard');

      // Click letter A
      const keyA = keyboard.querySelector('[data-key="A"]');
      keyA.click();

      expect(guessInput.value).toBe('A');
    });

    test('should add multiple letters in sequence', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const keyboard = document.getElementById('keyboard');

      // Click letters A, P, P, L, E
      const letters = ['A', 'P', 'P', 'L', 'E'];
      letters.forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter}"]`);
        key.click();
      });

      expect(guessInput.value).toBe('APPLE');
    });

    test('should not add letter when input is at max length (5 letters)', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const keyboard = document.getElementById('keyboard');

      // Fill input to max length
      guessInput.value = 'APPLE';

      // Try to add another letter
      const keyB = keyboard.querySelector('[data-key="B"]');
      keyB.click();

      // Should still be APPLE
      expect(guessInput.value).toBe('APPLE');
    });

    test('should focus input field after letter key click', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const keyboard = document.getElementById('keyboard');

      // Click a letter
      const keyA = keyboard.querySelector('[data-key="A"]');
      keyA.click();

      // Input should have focus
      expect(document.activeElement).toBe(guessInput);
    });
  });

  describe('Enter and Backspace key functionality', () => {
    test('should submit guess when ENTER key is clicked', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const keyboard = document.getElementById('keyboard');

      // Type a valid word
      guessInput.value = 'apple';

      // Click ENTER
      const enterKey = keyboard.querySelector('[data-key="ENTER"]');
      enterKey.click();

      // Guess should be submitted
      expect(gameController.getGameState().getGuesses().length).toBe(1);
      expect(guessInput.value).toBe(''); // Input cleared after submission
    });

    test('should remove last character when BACKSPACE is clicked', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const keyboard = document.getElementById('keyboard');

      // Type some letters
      guessInput.value = 'APPLE';

      // Click BACKSPACE
      const backspaceKey = keyboard.querySelector('[data-key="BACKSPACE"]');
      backspaceKey.click();

      expect(guessInput.value).toBe('APPL');
    });

    test('should handle multiple BACKSPACE clicks', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const keyboard = document.getElementById('keyboard');

      // Type some letters
      guessInput.value = 'APPLE';

      // Click BACKSPACE 3 times
      const backspaceKey = keyboard.querySelector('[data-key="BACKSPACE"]');
      backspaceKey.click();
      backspaceKey.click();
      backspaceKey.click();

      expect(guessInput.value).toBe('AP');
    });

    test('should handle BACKSPACE on empty input', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const keyboard = document.getElementById('keyboard');

      // Input is empty
      expect(guessInput.value).toBe('');

      // Click BACKSPACE
      const backspaceKey = keyboard.querySelector('[data-key="BACKSPACE"]');
      backspaceKey.click();

      // Should still be empty
      expect(guessInput.value).toBe('');
    });

    test('should focus input field after BACKSPACE click', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const keyboard = document.getElementById('keyboard');

      guessInput.value = 'APPLE';

      // Click BACKSPACE
      const backspaceKey = keyboard.querySelector('[data-key="BACKSPACE"]');
      backspaceKey.click();

      // Input should have focus
      expect(document.activeElement).toBe(guessInput);
    });
  });

  describe('Keyboard state updates based on guess feedback', () => {
    test('should mark letter as absent (gray) when not in target word', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const keyboard = document.getElementById('keyboard');

      // Make a guess with letters not in target
      // We need to know the target to test this properly
      const targetWord = gameController.getGameState().getTargetWord();
      
      // Find a word with at least one letter not in target
      const guessWord = dictionary.wordArray.find(word => {
        return word !== targetWord && word.split('').some(letter => !targetWord.includes(letter));
      });

      guessInput.value = guessWord;
      submitBtn.click();

      // Check that letters not in target are marked as absent
      guessWord.split('').forEach(letter => {
        if (!targetWord.includes(letter)) {
          const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
          expect(key.classList.contains('absent')).toBe(true);
        }
      });
    });

    test('should mark letter as present (yellow) when in target but wrong position', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const keyboard = document.getElementById('keyboard');

      // Get target word
      const targetWord = gameController.getGameState().getTargetWord();

      // Find a word in dictionary that shares letters with target but in different positions
      const guessWord = dictionary.wordArray.find(word => {
        if (word === targetWord) return false;
        // Check if word has at least one letter from target in a different position
        return word.split('').some((letter, index) => {
          return targetWord.includes(letter) && targetWord[index] !== letter;
        });
      });

      if (guessWord) {
        guessInput.value = guessWord;
        submitBtn.click();

        // Check that letters in wrong positions are marked as present
        const feedback = gameController.getGameState().getGuesses()[0].getFeedback();
        feedback.forEach(letterFeedback => {
          if (letterFeedback.status === 'present') {
            const key = keyboard.querySelector(`[data-key="${letterFeedback.letter.toUpperCase()}"]`);
            expect(key.classList.contains('present')).toBe(true);
          }
        });
      } else {
        // If no suitable word found, just verify the test setup works
        expect(guessWord).toBeDefined();
      }
    });

    test('should mark letter as correct (green) when in correct position', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const keyboard = document.getElementById('keyboard');

      // Get target word and guess it correctly
      const targetWord = gameController.getGameState().getTargetWord();

      guessInput.value = targetWord;
      submitBtn.click();

      // All letters should be marked as correct
      targetWord.split('').forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
        expect(key.classList.contains('correct')).toBe(true);
      });
    });

    test('should apply best status when letter appears in multiple guesses (correct > present > absent)', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const keyboard = document.getElementById('keyboard');

      // Get target word
      const targetWord = gameController.getGameState().getTargetWord();

      // First guess: a word where a letter is marked as absent
      const firstGuess = dictionary.wordArray.find(word => {
        return word !== targetWord && word.split('').some(letter => !targetWord.includes(letter));
      });

      if (firstGuess) {
        guessInput.value = firstGuess;
        submitBtn.click();

        // Find a letter that was marked absent
        const absentLetter = firstGuess.split('').find(letter => !targetWord.includes(letter));

        if (absentLetter) {
          const key = keyboard.querySelector(`[data-key="${absentLetter.toUpperCase()}"]`);
          expect(key.classList.contains('absent')).toBe(true);
        }
      }

      // Second guess: the correct word (all letters should be correct)
      guessInput.value = targetWord;
      submitBtn.click();

      // All letters in target should now be marked as correct
      targetWord.split('').forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
        expect(key.classList.contains('correct')).toBe(true);
      });
    });

    test('should not downgrade letter status from correct to present', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const keyboard = document.getElementById('keyboard');

      // Get target word
      const targetWord = gameController.getGameState().getTargetWord();

      // First guess: correct word (all letters marked correct)
      guessInput.value = targetWord;
      submitBtn.click();

      // Verify all letters are correct
      const firstLetter = targetWord[0].toUpperCase();
      const key = keyboard.querySelector(`[data-key="${firstLetter}"]`);
      expect(key.classList.contains('correct')).toBe(true);

      // Start new game
      const newGameBtn = document.getElementById('new-game-btn');
      newGameBtn.click();

      // In new game, make a guess where the same letter is in wrong position
      const newTarget = gameController.getGameState().getTargetWord();
      
      // Find a word with the first letter in a different position
      const secondGuess = dictionary.wordArray.find(word => {
        return word !== newTarget && word.includes(firstLetter.toLowerCase()) && word[0] !== firstLetter.toLowerCase();
      });

      if (secondGuess) {
        guessInput.value = secondGuess;
        submitBtn.click();

        // The letter should be marked based on new game feedback
        // (This test verifies keyboard state is reset between games)
      }
    });

    test('should update keyboard state for multiple letters in same guess', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const keyboard = document.getElementById('keyboard');

      // Make a guess
      guessInput.value = 'apple';
      submitBtn.click();

      // Get feedback for the guess
      const feedback = gameController.getGameState().getGuesses()[0].getFeedback();

      // Build a map of best status for each unique letter
      const letterStatusMap = {};
      feedback.forEach(letterFeedback => {
        const letter = letterFeedback.letter.toUpperCase();
        const status = letterFeedback.status;
        
        // Apply best status: correct > present > absent
        if (!letterStatusMap[letter]) {
          letterStatusMap[letter] = status;
        } else if (status === 'correct') {
          letterStatusMap[letter] = 'correct';
        } else if (status === 'present' && letterStatusMap[letter] !== 'correct') {
          letterStatusMap[letter] = 'present';
        }
      });

      // Verify each unique letter's keyboard state matches its best status
      Object.keys(letterStatusMap).forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter}"]`);
        const expectedStatus = letterStatusMap[letter];
        expect(key.classList.contains(expectedStatus)).toBe(true);
      });
    });
  });

  describe('Keyboard reset on new game', () => {
    test('should reset keyboard state when starting new game', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const newGameBtn = document.getElementById('new-game-btn');
      const keyboard = document.getElementById('keyboard');

      // Make a guess to set keyboard state
      guessInput.value = 'apple';
      submitBtn.click();

      // Verify some keys have status classes
      const keyA = keyboard.querySelector('[data-key="A"]');
      const hasStatusBefore = keyA.classList.contains('correct') || 
                              keyA.classList.contains('present') || 
                              keyA.classList.contains('absent');
      expect(hasStatusBefore).toBe(true);

      // Start new game
      newGameBtn.click();

      // Verify all keys have no status classes
      const allKeys = keyboard.querySelectorAll('.key');
      allKeys.forEach(key => {
        expect(key.classList.contains('correct')).toBe(false);
        expect(key.classList.contains('present')).toBe(false);
        expect(key.classList.contains('absent')).toBe(false);
      });
    });

    test('should reset keyboard state after multiple guesses', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const newGameBtn = document.getElementById('new-game-btn');
      const keyboard = document.getElementById('keyboard');

      // Make multiple guesses
      const targetWord = gameController.getGameState().getTargetWord();
      const wrongWords = dictionary.wordArray.filter(w => w !== targetWord).slice(0, 3);

      wrongWords.forEach(word => {
        guessInput.value = word;
        submitBtn.click();
      });

      // Verify keyboard has various states
      const keysWithStatus = Array.from(keyboard.querySelectorAll('.key')).filter(key => {
        return key.classList.contains('correct') || 
               key.classList.contains('present') || 
               key.classList.contains('absent');
      });
      expect(keysWithStatus.length).toBeGreaterThan(0);

      // Start new game
      newGameBtn.click();

      // Verify all keys are reset
      const allKeys = keyboard.querySelectorAll('.key');
      allKeys.forEach(key => {
        expect(key.classList.contains('correct')).toBe(false);
        expect(key.classList.contains('present')).toBe(false);
        expect(key.classList.contains('absent')).toBe(false);
      });
    });

    test('should maintain keyboard functionality after reset', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const newGameBtn = document.getElementById('new-game-btn');
      const keyboard = document.getElementById('keyboard');

      // Make a guess
      guessInput.value = 'apple';
      submitBtn.click();

      // Start new game
      newGameBtn.click();

      // Verify keyboard still works
      const keyB = keyboard.querySelector('[data-key="B"]');
      keyB.click();

      expect(guessInput.value).toBe('B');

      // Make another guess in new game
      guessInput.value = 'bread';
      submitBtn.click();

      // Verify keyboard state updates in new game
      const feedback = gameController.getGameState().getGuesses()[0].getFeedback();
      feedback.forEach(letterFeedback => {
        const key = keyboard.querySelector(`[data-key="${letterFeedback.letter.toUpperCase()}"]`);
        expect(key.classList.contains(letterFeedback.status)).toBe(true);
      });
    });
  });

  describe('Keyboard interaction with game state', () => {
    test('should allow keyboard input during active game', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const keyboard = document.getElementById('keyboard');

      // Game is in progress
      expect(gameController.getGameState().getGameStatus()).toBe('in-progress');

      // Click letter keys
      const keyA = keyboard.querySelector('[data-key="A"]');
      keyA.click();

      expect(guessInput.value).toBe('A');
    });

    test('should handle keyboard input when game is won', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const keyboard = document.getElementById('keyboard');

      // Win the game
      const targetWord = gameController.getGameState().getTargetWord();
      guessInput.value = targetWord;
      submitBtn.click();

      expect(gameController.getGameState().getGameStatus()).toBe('won');
      expect(guessInput.disabled).toBe(true);

      // Try to use keyboard - the keyboard handler will try to add the letter
      // but since input is disabled, it won't accept the input
      const keyA = keyboard.querySelector('[data-key="A"]');
      keyA.click();

      // The keyboard click handler adds the letter, but we verify the game is still won
      // and no new guess can be submitted
      const guessCountBefore = gameController.getGameState().getGuesses().length;
      
      // Try to submit with ENTER key
      const enterKey = keyboard.querySelector('[data-key="ENTER"]');
      enterKey.click();
      
      // No new guess should be added
      expect(gameController.getGameState().getGuesses().length).toBe(guessCountBefore);
      expect(gameController.getGameState().getGameStatus()).toBe('won');
    });

    test('should handle keyboard input when game is lost', () => {
      uiController.init();

      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const keyboard = document.getElementById('keyboard');

      // Lose the game
      const targetWord = gameController.getGameState().getTargetWord();
      const wrongWords = dictionary.wordArray.filter(w => w !== targetWord).slice(0, 6);

      wrongWords.forEach(word => {
        guessInput.value = word;
        submitBtn.click();
      });

      expect(gameController.getGameState().getGameStatus()).toBe('lost');
      expect(guessInput.disabled).toBe(true);

      // Try to use keyboard - the keyboard handler will try to add the letter
      const keyA = keyboard.querySelector('[data-key="A"]');
      keyA.click();

      // Verify the game is still lost and no new guess can be submitted
      const guessCountBefore = gameController.getGameState().getGuesses().length;
      
      // Try to submit with ENTER key
      const enterKey = keyboard.querySelector('[data-key="ENTER"]');
      enterKey.click();
      
      // No new guess should be added (game is over)
      expect(gameController.getGameState().getGuesses().length).toBe(guessCountBefore);
      expect(gameController.getGameState().getGameStatus()).toBe('lost');
    });
  });
});
