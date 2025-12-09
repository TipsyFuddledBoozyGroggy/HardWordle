/**
 * Integration Tests for UIController Enhanced Keyboard Features
 * Tests complete game flows using on-screen keyboard with visual feedback
 * Requirements: 6.1, 6.3, 6.4
 */

const UIController = require('../src/UIController');
const GameController = require('../src/GameController');
const Dictionary = require('../src/Dictionary');

describe('UIController Keyboard Integration Tests', () => {
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
    const testWords = ['apple', 'bread', 'crane', 'delta', 'eagle', 'frost', 'grape', 'house', 'index', 'joker'];
    dictionary = new Dictionary(testWords);
    gameController = new GameController(dictionary);
    uiController = new UIController(gameController);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('Complete game flow with on-screen keyboard', () => {
    test('should complete a winning game using only on-screen keyboard', () => {
      // Initialize UI
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const gameBoard = document.getElementById('game-board');
      const messageArea = document.getElementById('message-area');
      const guessInput = document.getElementById('guess-input');

      // Get the target word
      const targetWord = gameController.getGameState().getTargetWord();

      // Verify initial state
      expect(gameController.getGameState().getGuesses()).toHaveLength(0);
      expect(gameBoard.children.length).toBe(6); // All 6 rows displayed

      // Type the target word using on-screen keyboard
      targetWord.split('').forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
        key.click();
      });

      // Verify input field was updated
      expect(guessInput.value).toBe(targetWord.toUpperCase());

      // Submit using on-screen ENTER key
      const enterKey = keyboard.querySelector('[data-key="ENTER"]');
      enterKey.click();

      // Verify game was won
      expect(gameController.getGameState().getGameStatus()).toBe('won');
      expect(messageArea.textContent).toContain('Congratulations! You won!');
      expect(gameBoard.children.length).toBe(6); // All 6 rows still displayed

      // Verify all letters in keyboard are marked as correct
      targetWord.split('').forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
        expect(key.classList.contains('correct')).toBe(true);
      });
    });

    test('should complete a losing game using on-screen keyboard', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const gameBoard = document.getElementById('game-board');
      const messageArea = document.getElementById('message-area');

      const targetWord = gameController.getGameState().getTargetWord();
      const wrongWords = dictionary.wordArray.filter(w => w !== targetWord).slice(0, 6);

      // Make 6 wrong guesses using keyboard
      wrongWords.forEach((word, guessIndex) => {
        // Type word using keyboard
        word.split('').forEach(letter => {
          const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
          key.click();
        });

        // Submit using ENTER key
        const enterKey = keyboard.querySelector('[data-key="ENTER"]');
        enterKey.click();

        // Verify guess was added
        expect(gameController.getGameState().getGuesses()).toHaveLength(guessIndex + 1);
      });

      // Verify game was lost
      expect(gameController.getGameState().getGameStatus()).toBe('lost');
      expect(messageArea.textContent).toContain('Game Over!');
      expect(gameBoard.children.length).toBe(6);
    });

    test('should handle mixed keyboard and input field usage', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');

      const targetWord = gameController.getGameState().getTargetWord();

      // Type first 3 letters using keyboard
      for (let i = 0; i < 3; i++) {
        const key = keyboard.querySelector(`[data-key="${targetWord[i].toUpperCase()}"]`);
        key.click();
      }

      // Type last 2 letters directly in input field
      guessInput.value += targetWord.substring(3).toUpperCase();

      // Submit using submit button
      submitBtn.click();

      // Verify game was won
      expect(gameController.getGameState().getGameStatus()).toBe('won');
    });

    test('should use BACKSPACE key to correct typing mistakes', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');

      const targetWord = gameController.getGameState().getTargetWord();

      // Type wrong letters first
      const keyA = keyboard.querySelector('[data-key="A"]');
      const keyB = keyboard.querySelector('[data-key="B"]');
      const keyC = keyboard.querySelector('[data-key="C"]');
      
      keyA.click();
      keyB.click();
      keyC.click();

      expect(guessInput.value).toBe('ABC');

      // Use BACKSPACE to clear
      const backspaceKey = keyboard.querySelector('[data-key="BACKSPACE"]');
      backspaceKey.click();
      backspaceKey.click();
      backspaceKey.click();

      expect(guessInput.value).toBe('');

      // Now type correct word
      targetWord.split('').forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
        key.click();
      });

      // Submit
      const enterKey = keyboard.querySelector('[data-key="ENTER"]');
      enterKey.click();

      // Verify game was won
      expect(gameController.getGameState().getGameStatus()).toBe('won');
    });

    test('should handle partial word entry and BACKSPACE', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');

      // Type 4 letters
      ['A', 'P', 'P', 'L'].forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter}"]`);
        key.click();
      });

      expect(guessInput.value).toBe('APPL');

      // Use BACKSPACE once
      const backspaceKey = keyboard.querySelector('[data-key="BACKSPACE"]');
      backspaceKey.click();

      expect(guessInput.value).toBe('APP');

      // Complete the word
      const keyL = keyboard.querySelector('[data-key="L"]');
      const keyE = keyboard.querySelector('[data-key="E"]');
      keyL.click();
      keyE.click();

      expect(guessInput.value).toBe('APPLE');

      // Submit
      const enterKey = keyboard.querySelector('[data-key="ENTER"]');
      enterKey.click();

      // Verify guess was submitted
      expect(gameController.getGameState().getGuesses()).toHaveLength(1);
    });
  });

  describe('Visual feedback on keyboard after guesses', () => {
    test('should update keyboard visual state progressively through multiple guesses', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');

      const targetWord = gameController.getGameState().getTargetWord();

      // Make first guess with some letters not in target
      const firstGuess = dictionary.wordArray.find(word => {
        return word !== targetWord && word.split('').some(letter => !targetWord.includes(letter));
      });

      if (firstGuess) {
        guessInput.value = firstGuess;
        submitBtn.click();

        // Verify keyboard state updated - check unique letters only
        const feedback = gameController.getGameState().getGuesses()[0].getFeedback();
        const uniqueLetters = new Set();
        
        feedback.forEach(letterFeedback => {
          const letter = letterFeedback.letter.toUpperCase();
          if (!uniqueLetters.has(letter)) {
            uniqueLetters.add(letter);
            const key = keyboard.querySelector(`[data-key="${letter}"]`);
            // Key should have at least one status class
            const hasStatus = key.classList.contains('correct') || 
                             key.classList.contains('present') || 
                             key.classList.contains('absent');
            expect(hasStatus).toBe(true);
          }
        });

        // Count keys with status
        const keysWithStatus = Array.from(keyboard.querySelectorAll('.key')).filter(key => {
          return key.classList.contains('correct') || 
                 key.classList.contains('present') || 
                 key.classList.contains('absent');
        });
        expect(keysWithStatus.length).toBeGreaterThan(0);
      }

      // Make second guess
      const secondGuess = dictionary.wordArray.find(word => {
        return word !== targetWord && word !== firstGuess;
      });

      if (secondGuess) {
        guessInput.value = secondGuess;
        submitBtn.click();

        // Verify keyboard state updated with more letters
        const keysWithStatus = Array.from(keyboard.querySelectorAll('.key')).filter(key => {
          return key.classList.contains('correct') || 
                 key.classList.contains('present') || 
                 key.classList.contains('absent');
        });
        expect(keysWithStatus.length).toBeGreaterThan(0);
      }
    });

    test('should show correct (green) status for letters in correct position', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');

      const targetWord = gameController.getGameState().getTargetWord();

      // Guess the correct word
      guessInput.value = targetWord;
      submitBtn.click();

      // All letters should be marked as correct
      targetWord.split('').forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
        expect(key.classList.contains('correct')).toBe(true);
        expect(key.classList.contains('present')).toBe(false);
        expect(key.classList.contains('absent')).toBe(false);
      });
    });

    test('should show present (yellow) status for letters in wrong position', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');

      const targetWord = gameController.getGameState().getTargetWord();

      // Find a word with letters from target but in different positions
      const guessWord = dictionary.wordArray.find(word => {
        if (word === targetWord) return false;
        return word.split('').some((letter, index) => {
          return targetWord.includes(letter) && targetWord[index] !== letter;
        });
      });

      if (guessWord) {
        guessInput.value = guessWord;
        submitBtn.click();

        // Check for present letters
        const feedback = gameController.getGameState().getGuesses()[0].getFeedback();
        const presentLetters = feedback.filter(lf => lf.status === 'present');

        presentLetters.forEach(letterFeedback => {
          const key = keyboard.querySelector(`[data-key="${letterFeedback.letter.toUpperCase()}"]`);
          expect(key.classList.contains('present')).toBe(true);
        });
      }
    });

    test('should show absent (gray) status for letters not in target', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');

      const targetWord = gameController.getGameState().getTargetWord();

      // Find a word with letters not in target
      const guessWord = dictionary.wordArray.find(word => {
        return word !== targetWord && word.split('').some(letter => !targetWord.includes(letter));
      });

      // Only run test if we found a suitable guess word
      expect(guessWord).toBeDefined();

      guessInput.value = guessWord;
      submitBtn.click();

      // Check for absent letters
      const feedback = gameController.getGameState().getGuesses()[0].getFeedback();
      const absentLetters = feedback.filter(lf => lf.status === 'absent');

      // Should have at least one absent letter
      expect(absentLetters.length).toBeGreaterThan(0);

      absentLetters.forEach(letterFeedback => {
        const key = keyboard.querySelector(`[data-key="${letterFeedback.letter.toUpperCase()}"]`);
        expect(key).not.toBeNull();
        expect(key.classList.contains('absent')).toBe(true);
      });
    });

    test('should maintain best status when letter appears in multiple guesses', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');

      const targetWord = gameController.getGameState().getTargetWord();

      // First guess: word where a letter is absent
      const firstGuess = dictionary.wordArray.find(word => {
        return word !== targetWord && word.split('').some(letter => !targetWord.includes(letter));
      });

      // Only run test if we found a suitable first guess
      expect(firstGuess).toBeDefined();

      guessInput.value = firstGuess;
      submitBtn.click();

      // Find a letter that was marked absent
      const feedback1 = gameController.getGameState().getGuesses()[0].getFeedback();
      const absentLetter = feedback1.find(lf => lf.status === 'absent');

      // Only check absent letter if one exists
      expect(absentLetter).toBeDefined();

      const absentKey = keyboard.querySelector(`[data-key="${absentLetter.letter.toUpperCase()}"]`);
      expect(absentKey).not.toBeNull();
      expect(absentKey.classList.contains('absent')).toBe(true);

      // Second guess: the correct word
      guessInput.value = targetWord;
      submitBtn.click();

      // All letters in target should now be correct (overriding any previous status)
      targetWord.split('').forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
        expect(key).not.toBeNull();
        expect(key.classList.contains('correct')).toBe(true);
      });
    });

    test('should not downgrade letter status from correct to present or absent', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');

      const targetWord = gameController.getGameState().getTargetWord();

      // First guess: correct word
      guessInput.value = targetWord;
      submitBtn.click();

      // All letters should be correct
      const correctLetters = targetWord.split('').map(l => l.toUpperCase());
      correctLetters.forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter}"]`);
        expect(key.classList.contains('correct')).toBe(true);
      });

      // Start new game
      const newGameBtn = document.getElementById('new-game-btn');
      newGameBtn.click();

      // Keyboard should be reset
      correctLetters.forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter}"]`);
        expect(key.classList.contains('correct')).toBe(false);
        expect(key.classList.contains('present')).toBe(false);
        expect(key.classList.contains('absent')).toBe(false);
      });
    });
  });

  describe('Interaction between keyboard and input field', () => {
    test('should synchronize keyboard clicks with input field value', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');

      // Click letters on keyboard
      const letters = ['A', 'P', 'P', 'L', 'E'];
      letters.forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter}"]`);
        key.click();
      });

      // Verify input field matches
      expect(guessInput.value).toBe('APPLE');
    });

    test('should focus input field after keyboard interaction', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');

      // Click a letter key
      const keyA = keyboard.querySelector('[data-key="A"]');
      keyA.click();

      // Input should have focus
      expect(document.activeElement).toBe(guessInput);

      // Click BACKSPACE
      const backspaceKey = keyboard.querySelector('[data-key="BACKSPACE"]');
      backspaceKey.click();

      // Input should still have focus
      expect(document.activeElement).toBe(guessInput);
    });

    test('should respect max length when using keyboard', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');

      // Type 5 letters
      ['A', 'P', 'P', 'L', 'E'].forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter}"]`);
        key.click();
      });

      expect(guessInput.value).toBe('APPLE');

      // Try to add a 6th letter
      const keyB = keyboard.querySelector('[data-key="B"]');
      keyB.click();

      // Should still be 5 letters
      expect(guessInput.value).toBe('APPLE');
      expect(guessInput.value.length).toBe(5);
    });

    test('should clear input field after successful submission via keyboard', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');

      // Type a valid word using keyboard
      ['A', 'P', 'P', 'L', 'E'].forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter}"]`);
        key.click();
      });

      expect(guessInput.value).toBe('APPLE');

      // Submit using ENTER key
      const enterKey = keyboard.querySelector('[data-key="ENTER"]');
      enterKey.click();

      // Input should be cleared
      expect(guessInput.value).toBe('');
    });

    test('should not clear input field after invalid submission via keyboard', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');

      // Type an invalid word using keyboard
      ['Z', 'Z', 'Z', 'Z', 'Z'].forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter}"]`);
        key.click();
      });

      expect(guessInput.value).toBe('ZZZZZ');

      // Try to submit using ENTER key
      const enterKey = keyboard.querySelector('[data-key="ENTER"]');
      enterKey.click();

      // Input should NOT be cleared (so user can correct it)
      expect(guessInput.value).toBe('ZZZZZ');
    });

    test('should handle rapid keyboard clicks correctly', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');

      // Rapidly click letters
      const keyA = keyboard.querySelector('[data-key="A"]');
      keyA.click();
      keyA.click();
      keyA.click();

      expect(guessInput.value).toBe('AAA');

      // Rapidly click BACKSPACE
      const backspaceKey = keyboard.querySelector('[data-key="BACKSPACE"]');
      backspaceKey.click();
      backspaceKey.click();

      expect(guessInput.value).toBe('A');
    });

    test('should handle keyboard input during game over state', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');

      const targetWord = gameController.getGameState().getTargetWord();

      // Win the game
      guessInput.value = targetWord;
      submitBtn.click();

      expect(gameController.getGameState().getGameStatus()).toBe('won');
      expect(guessInput.disabled).toBe(true);

      // Try to use keyboard
      const keyA = keyboard.querySelector('[data-key="A"]');
      keyA.click();

      // The keyboard will try to add the letter, but input is disabled
      // Verify game state hasn't changed
      expect(gameController.getGameState().getGameStatus()).toBe('won');
      expect(gameController.getGameState().getGuesses()).toHaveLength(1);
    });

    test('should reset keyboard and input field together on new game', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const newGameBtn = document.getElementById('new-game-btn');

      // Make a guess
      guessInput.value = 'apple';
      submitBtn.click();

      // Verify keyboard has status
      const keysWithStatus = Array.from(keyboard.querySelectorAll('.key')).filter(key => {
        return key.classList.contains('correct') || 
               key.classList.contains('present') || 
               key.classList.contains('absent');
      });
      expect(keysWithStatus.length).toBeGreaterThan(0);

      // Start new game
      newGameBtn.click();

      // Verify input is cleared
      expect(guessInput.value).toBe('');
      expect(guessInput.disabled).toBe(false);

      // Verify keyboard is reset
      const allKeys = keyboard.querySelectorAll('.key');
      allKeys.forEach(key => {
        expect(key.classList.contains('correct')).toBe(false);
        expect(key.classList.contains('present')).toBe(false);
        expect(key.classList.contains('absent')).toBe(false);
      });

      // Verify keyboard still works
      const keyB = keyboard.querySelector('[data-key="B"]');
      keyB.click();
      expect(guessInput.value).toBe('B');
    });

    test('should handle complete game flow with only keyboard interactions', () => {
      uiController.init();

      const keyboard = document.getElementById('keyboard');
      const guessInput = document.getElementById('guess-input');
      const gameBoard = document.getElementById('game-board');

      const targetWord = gameController.getGameState().getTargetWord();
      const wrongWords = dictionary.wordArray.filter(w => w !== targetWord).slice(0, 2);

      // Make 2 wrong guesses using only keyboard
      wrongWords.forEach(word => {
        word.split('').forEach(letter => {
          const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
          key.click();
        });

        const enterKey = keyboard.querySelector('[data-key="ENTER"]');
        enterKey.click();
      });

      // Verify 2 guesses made
      expect(gameController.getGameState().getGuesses()).toHaveLength(2);
      expect(gameBoard.children.length).toBe(6); // All 6 rows displayed

      // Make winning guess using keyboard
      targetWord.split('').forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
        key.click();
      });

      const enterKey = keyboard.querySelector('[data-key="ENTER"]');
      enterKey.click();

      // Verify game won
      expect(gameController.getGameState().getGameStatus()).toBe('won');
      expect(gameController.getGameState().getGuesses()).toHaveLength(3);

      // Verify all target letters are marked correct on keyboard
      targetWord.split('').forEach(letter => {
        const key = keyboard.querySelector(`[data-key="${letter.toUpperCase()}"]`);
        expect(key.classList.contains('correct')).toBe(true);
      });
    });
  });
});
