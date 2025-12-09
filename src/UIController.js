/**
 * UIController module for Hard Wordle
 * Manages UI interactions and updates the display based on game state
 */

/**
 * UIController class
 * Handles all user interface interactions and display updates
 */
class UIController {
  /**
   * Create a UIController instance
   * @param {GameController} gameController - The GameController instance
   */
  constructor(gameController) {
    if (!gameController) {
      throw new Error('GameController is required');
    }
    
    this.gameController = gameController;
    
    // Cache DOM elements
    this.newGameBtn = null;
    this.gameBoard = null;
    this.attemptsDisplay = null;
    this.messageArea = null;
    this.definitionArea = null;
    this.keyboard = null;
    
    // Keyboard layout
    this.keyboardLayout = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];
    
    // Track keyboard letter states
    // Maps letter to status: 'correct' | 'present' | 'absent'
    this.keyboardState = {};
    
    // Track current guess being typed
    this.currentGuess = '';
  }

  /**
   * Initialize the UI controller
   * Sets up event listeners and starts a new game
   */
  init() {
    // Cache DOM elements
    this.newGameBtn = document.getElementById('new-game-btn');
    this.gameBoard = document.getElementById('game-board');
    this.attemptsDisplay = document.getElementById('attempts-remaining');
    this.messageArea = document.getElementById('message-area');
    this.definitionArea = document.getElementById('definition-area');
    this.keyboard = document.getElementById('keyboard');
    this.guessInput = document.getElementById('guess-input');
    this.submitBtn = document.getElementById('submit-btn');
    
    // Validate that all required elements exist
    if (!this.newGameBtn || !this.gameBoard || !this.attemptsDisplay || 
        !this.messageArea || !this.definitionArea || !this.keyboard || !this.guessInput || !this.submitBtn) {
      throw new Error('Required DOM elements not found');
    }
    
    // Set up event listeners
    this.newGameBtn.addEventListener('click', () => this.handleNewGame());
    this.submitBtn.addEventListener('click', () => this.handleGuessSubmit());
    
    // Sync input field changes with currentGuess
    this.guessInput.addEventListener('input', (event) => {
      this.currentGuess = event.target.value.toUpperCase();
      this.updateCurrentGuessDisplay();
    });
    
    // Handle physical keyboard input
    document.addEventListener('keydown', (event) => this.handlePhysicalKeyboard(event));
    
    // Create on-screen keyboard
    this.createKeyboard();
    
    // Start a new game
    this.handleNewGame();
  }

  /**
   * Create the on-screen keyboard
   * Generates keyboard layout with QWERTY arrangement
   */
  createKeyboard() {
    // Clear existing keyboard
    this.keyboard.innerHTML = '';
    
    // Create each row of the keyboard
    this.keyboardLayout.forEach(row => {
      const keyboardRow = document.createElement('div');
      keyboardRow.className = 'keyboard-row';
      
      row.forEach(key => {
        const keyButton = document.createElement('button');
        keyButton.className = 'key';
        keyButton.dataset.key = key;
        
        // Add wide class for special keys
        if (key === 'ENTER' || key === 'BACKSPACE') {
          keyButton.classList.add('wide');
        }
        
        // Set button text
        if (key === 'BACKSPACE') {
          keyButton.textContent = '⌫';
        } else {
          keyButton.textContent = key;
        }
        
        // Add click handler
        keyButton.addEventListener('click', () => this.handleKeyPress(key));
        
        keyboardRow.appendChild(keyButton);
      });
      
      this.keyboard.appendChild(keyboardRow);
    });
  }

  /**
   * Handle physical keyboard input
   * @param {KeyboardEvent} event - The keyboard event
   */
  handlePhysicalKeyboard(event) {
    // Ignore if game is over
    const gameState = this.gameController.getGameState();
    if (!gameState || gameState.isGameOver()) {
      return;
    }
    
    const key = event.key.toUpperCase();
    
    if (key === 'ENTER') {
      event.preventDefault();
      this.handleGuessSubmit();
    } else if (key === 'BACKSPACE') {
      event.preventDefault();
      this.handleBackspace();
    } else if (/^[A-Z]$/.test(key) && this.currentGuess.length < 5) {
      event.preventDefault();
      this.handleLetterInput(key);
    }
  }

  /**
   * Handle keyboard key press
   * @param {string} key - The key that was pressed
   */
  handleKeyPress(key) {
    if (key === 'ENTER') {
      this.handleGuessSubmit();
    } else if (key === 'BACKSPACE') {
      this.handleBackspace();
    } else {
      // Add letter if not at max length
      if (this.currentGuess.length < 5) {
        this.handleLetterInput(key);
      }
    }
    
    // Focus the input field after keyboard interaction
    if (this.guessInput) {
      this.guessInput.focus();
    }
  }
  
  /**
   * Handle letter input
   * @param {string} letter - The letter to add
   */
  handleLetterInput(letter) {
    // Sync with input field if needed
    if (this.guessInput && this.guessInput.value.toUpperCase() !== this.currentGuess) {
      this.currentGuess = this.guessInput.value.toUpperCase();
    }
    
    if (this.currentGuess.length < 5) {
      this.currentGuess += letter.toUpperCase();
      this.updateCurrentGuessDisplay();
    }
  }
  
  /**
   * Handle backspace
   */
  handleBackspace() {
    // Sync with input field if needed
    if (this.guessInput && this.guessInput.value.toUpperCase() !== this.currentGuess) {
      this.currentGuess = this.guessInput.value.toUpperCase();
    }
    
    if (this.currentGuess.length > 0) {
      this.currentGuess = this.currentGuess.slice(0, -1);
      this.updateCurrentGuessDisplay();
    }
  }
  
  /**
   * Update the display of the current guess being typed
   */
  updateCurrentGuessDisplay() {
    const gameState = this.gameController.getGameState();
    if (!gameState) return;
    
    // Update the input field
    if (this.guessInput) {
      this.guessInput.value = this.currentGuess;
    }
    
    const currentRowIndex = gameState.getGuesses().length;
    const rows = this.gameBoard.querySelectorAll('.guess-row');
    
    if (currentRowIndex < rows.length) {
      const currentRow = rows[currentRowIndex];
      const tiles = currentRow.querySelectorAll('.letter-tile');
      
      // Update each tile with the current guess
      for (let i = 0; i < 5; i++) {
        if (i < this.currentGuess.length) {
          tiles[i].textContent = this.currentGuess[i];
          tiles[i].classList.add('active');
        } else {
          tiles[i].textContent = '';
          tiles[i].classList.remove('active');
        }
      }
    }
  }

  /**
   * Handle guess submission
   * Validates input, submits guess to game controller, and updates display
   */
  handleGuessSubmit() {
    // Sync with input field if needed
    if (this.guessInput && this.guessInput.value.toUpperCase() !== this.currentGuess) {
      this.currentGuess = this.guessInput.value.toUpperCase();
    }
    
    const input = this.currentGuess.trim();
    
    // Clear any previous messages
    this.showMessage('', '');
    
    // Validate input is not empty
    if (!input) {
      this.showMessage('Please enter a word', 'error');
      return;
    }
    
    // Submit guess to game controller
    const result = this.gameController.submitGuess(input);
    
    if (!result.success) {
      // Show error message
      this.showMessage(result.error, 'error');
      return;
    }
    
    // Clear current guess
    this.currentGuess = '';
    
    // Update keyboard state with the new guess feedback
    if (result.guess) {
      this.updateKeyboardState(result.guess);
    }
    
    // Update display
    this.renderGameBoard();
    this.updateAttemptsDisplay();
    
    // Check if game is over
    if (result.gameStatus === 'won') {
      this.showGameOver(true);
    } else if (result.gameStatus === 'lost') {
      this.showGameOver(false);
    } else {
      // Focus input for next guess
      if (this.guessInput) {
        this.guessInput.focus();
      }
    }
  }

  /**
   * Update keyboard state based on guess feedback
   * Applies the best status for each letter (correct > present > absent)
   * @param {Guess} guess - The guess with feedback
   */
  updateKeyboardState(guess) {
    const feedback = guess.getFeedback();
    
    feedback.forEach(letterFeedback => {
      const letter = letterFeedback.letter.toUpperCase();
      const status = letterFeedback.status;
      
      // Apply best status: correct > present > absent
      const currentStatus = this.keyboardState[letter];
      
      if (!currentStatus) {
        this.keyboardState[letter] = status;
      } else if (status === 'correct') {
        // Correct always overrides
        this.keyboardState[letter] = 'correct';
      } else if (status === 'present' && currentStatus !== 'correct') {
        // Present overrides absent but not correct
        this.keyboardState[letter] = 'present';
      }
      // If current is already correct or present, don't downgrade to absent
    });
    
    // Update keyboard visual state
    this.renderKeyboardState();
  }

  /**
   * Render keyboard state by applying CSS classes to keys
   */
  renderKeyboardState() {
    Object.keys(this.keyboardState).forEach(letter => {
      const status = this.keyboardState[letter];
      const keyButton = this.keyboard.querySelector(`[data-key="${letter}"]`);
      
      if (keyButton) {
        // Remove all status classes
        keyButton.classList.remove('correct', 'present', 'absent');
        // Add current status class
        keyButton.classList.add(status);
      }
    });
  }

  /**
   * Reset keyboard state
   * Clears all letter statuses
   */
  resetKeyboardState() {
    this.keyboardState = {};
    
    // Remove all status classes from keyboard keys
    const keys = this.keyboard.querySelectorAll('.key');
    keys.forEach(key => {
      key.classList.remove('correct', 'present', 'absent');
    });
  }

  /**
   * Render the game board with all guesses and feedback
   * Always displays all 6 rows, showing empty tiles for rows not yet guessed
   */
  renderGameBoard() {
    const gameState = this.gameController.getGameState();
    
    if (!gameState) {
      this.gameBoard.innerHTML = '';
      return;
    }
    
    const guesses = gameState.getGuesses();
    const maxAttempts = gameState.maxAttempts;
    
    // Clear the game board
    this.gameBoard.innerHTML = '';
    
    // Render all 6 rows (filled guesses + empty rows)
    for (let i = 0; i < maxAttempts; i++) {
      const guessRow = document.createElement('div');
      guessRow.className = 'guess-row';
      
      if (i < guesses.length) {
        // Render filled guess row
        const guess = guesses[i];
        const feedback = guess.getFeedback();
        
        feedback.forEach(letterFeedback => {
          const tile = document.createElement('div');
          tile.className = `letter-tile ${letterFeedback.status}`;
          tile.textContent = letterFeedback.letter.toUpperCase();
          guessRow.appendChild(tile);
        });
      } else {
        // Render empty row
        for (let j = 0; j < 5; j++) {
          const tile = document.createElement('div');
          tile.className = 'letter-tile empty';
          tile.textContent = '';
          guessRow.appendChild(tile);
        }
      }
      
      this.gameBoard.appendChild(guessRow);
    }
    
    // Update current guess display if game is still in progress
    if (!gameState.isGameOver()) {
      this.updateCurrentGuessDisplay();
    }
  }

  /**
   * Update the attempts display
   * Shows remaining attempts out of maximum attempts
   */
  updateAttemptsDisplay() {
    const gameState = this.gameController.getGameState();
    
    if (!gameState) {
      this.attemptsDisplay.textContent = 'Attempts: 6/6';
      return;
    }
    
    const remaining = gameState.getRemainingAttempts();
    const total = gameState.maxAttempts;
    const used = total - remaining;
    
    this.attemptsDisplay.textContent = `Attempts: ${used}/${total}`;
  }

  /**
   * Show a message to the user
   * @param {string} message - The message text to display
   * @param {string} type - The message type ('error', 'success', 'info', or empty)
   */
  showMessage(message, type) {
    this.messageArea.textContent = message;
    
    // Remove all type classes
    this.messageArea.classList.remove('error', 'success', 'info');
    
    // Add the appropriate type class if specified
    if (type) {
      this.messageArea.classList.add(type);
    }
  }

  /**
   * Show game over message
   * Displays win/loss message, reveals target word, and shows definition
   * @param {boolean} won - Whether the player won the game
   */
  async showGameOver(won) {
    const gameState = this.gameController.getGameState();
    const targetWord = gameState.getTargetWord().toUpperCase();
    
    if (won) {
      this.showMessage(`Congratulations! You won! The word was ${targetWord}`, 'success');
    } else {
      this.showMessage(`Game Over! The word was ${targetWord}`, 'error');
    }
    
    // Disable input controls
    if (this.guessInput) {
      this.guessInput.disabled = true;
    }
    if (this.submitBtn) {
      this.submitBtn.disabled = true;
    }
    
    // Fetch and display word definition
    await this.showWordDefinition(targetWord);
  }
  
  /**
   * Fetch and display word definition
   * @param {string} word - The word to get definition for
   */
  async showWordDefinition(word) {
    this.definitionArea.innerHTML = '<div class="loading">Loading definition...</div>';
    
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      
      if (!response.ok) {
        throw new Error('Definition not found');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0) {
        const meaning = data[0].meanings[0];
        const definition = meaning.definitions[0].definition;
        const partOfSpeech = meaning.partOfSpeech;
        
        this.definitionArea.innerHTML = `
          <div class="word-title">${word}</div>
          <div class="definition-text"><em>${partOfSpeech}</em> - ${definition}</div>
        `;
      } else {
        this.definitionArea.innerHTML = `
          <div class="word-title">${word}</div>
          <div class="definition-text">Definition not available</div>
        `;
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
      this.definitionArea.innerHTML = `
        <div class="word-title">${word}</div>
        <div class="definition-text">Definition not available</div>
      `;
    }
  }

  /**
   * Handle new game request
   * Resets UI and starts a new game
   */
  handleNewGame() {
    // Start new game in controller
    this.gameController.startNewGame();
    
    // Reset UI
    this.currentGuess = '';
    
    // Clear messages and definition
    this.showMessage('', '');
    this.definitionArea.innerHTML = '';
    
    // Re-enable input controls
    if (this.guessInput) {
      this.guessInput.disabled = false;
      this.guessInput.value = '';
    }
    if (this.submitBtn) {
      this.submitBtn.disabled = false;
    }
    
    // Reset keyboard state
    this.resetKeyboardState();
    
    // Update display
    this.renderGameBoard();
    this.updateAttemptsDisplay();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIController;
}
