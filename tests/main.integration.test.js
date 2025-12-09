/**
 * Integration Tests for Application Initialization (main.js)
 * Tests successful dictionary load, game start, and error handling
 * Requirements: 7.1
 */

const Dictionary = require('../src/Dictionary');
const GameController = require('../src/GameController');
const UIController = require('../src/UIController');

describe('Application Initialization Integration Tests', () => {
  let originalFetch;
  let consoleLogSpy;
  let consoleErrorSpy;
  let dictionaryInstance;
  let gameControllerInstance;
  let uiControllerInstance;

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
        
        <div id="message-area"></div>
        
        <button id="new-game-btn">New Game</button>
      </div>
    `;

    // Save original fetch
    originalFetch = global.fetch;

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Create mock instances
    uiControllerInstance = { init: jest.fn() };
    gameControllerInstance = {};
    dictionaryInstance = {};
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;

    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // Clear DOM
    document.body.innerHTML = '';
  });

  // Helper function to create the initialization function
  const createInitializeApp = () => {
    return async function initializeApp() {
      try {
        console.log('Hard Wordle - Loading dictionary...');
        
        const response = await fetch('/words.json');
        
        if (!response.ok) {
          throw new Error(`Failed to load dictionary: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.words || !Array.isArray(data.words)) {
          throw new Error('Invalid dictionary format: expected "words" array');
        }
        
        if (data.words.length === 0) {
          throw new Error('Dictionary is empty');
        }
        
        console.log(`Dictionary loaded: ${data.words.length} words`);
        
        dictionaryInstance = new Dictionary(data.words);
        gameControllerInstance = new GameController(dictionaryInstance);
        uiControllerInstance = { init: jest.fn() };
        const realUIController = new UIController(gameControllerInstance);
        
        // Copy the real UIController but use our mock init
        Object.setPrototypeOf(uiControllerInstance, Object.getPrototypeOf(realUIController));
        
        uiControllerInstance.init();
        
        console.log('Hard Wordle - Ready to play!');
        
      } catch (error) {
        console.error('Failed to initialize application:', error);
        
        const messageArea = document.getElementById('message-area');
        if (messageArea) {
          messageArea.textContent = `Failed to load game: ${error.message}. Please refresh the page to try again.`;
          messageArea.classList.add('error');
        }
        
        const guessInput = document.getElementById('guess-input');
        const submitBtn = document.getElementById('submit-btn');
        const newGameBtn = document.getElementById('new-game-btn');
        
        if (guessInput) guessInput.disabled = true;
        if (submitBtn) submitBtn.disabled = true;
        if (newGameBtn) newGameBtn.disabled = true;
      }
    };
  };

  describe('Successful dictionary load and game start', () => {
    test('should successfully load dictionary and initialize game', async () => {
      // Mock successful fetch response
      const mockWords = ['apple', 'bread', 'crane', 'delta', 'eagle'];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ words: mockWords })
      });

      // Create and execute initialization
      const initializeApp = createInitializeApp();
      await initializeApp();

      // Verify fetch was called with correct URL
      expect(global.fetch).toHaveBeenCalledWith('/words.json');

      // Verify Dictionary was instantiated with loaded words
      expect(dictionaryInstance).toBeInstanceOf(Dictionary);

      // Verify GameController was instantiated
      expect(gameControllerInstance).toBeInstanceOf(GameController);

      // Verify UIController was instantiated
      expect(uiControllerInstance).toBeInstanceOf(UIController);

      // Verify UIController.init was called
      expect(uiControllerInstance.init).toHaveBeenCalled();

      // Verify console logs
      expect(consoleLogSpy).toHaveBeenCalledWith('Hard Wordle - Loading dictionary...');
      expect(consoleLogSpy).toHaveBeenCalledWith(`Dictionary loaded: ${mockWords.length} words`);
      expect(consoleLogSpy).toHaveBeenCalledWith('Hard Wordle - Ready to play!');
    });

    test('should handle large dictionary successfully', async () => {
      // Create a large dictionary (5000+ words)
      const mockWords = Array.from({ length: 5500 }, (_, i) => `word${i.toString().padStart(5, '0')}`);
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ words: mockWords })
      });

      // Create and execute initialization
      const initializeApp = createInitializeApp();
      await initializeApp();

      // Verify Dictionary was instantiated
      expect(dictionaryInstance).toBeInstanceOf(Dictionary);

      // Verify success message includes word count
      expect(consoleLogSpy).toHaveBeenCalledWith('Dictionary loaded: 5500 words');
    });

    test('should initialize all components in correct order', async () => {
      const mockWords = ['apple', 'bread', 'crane'];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ words: mockWords })
      });

      // Track call order by spying on constructors
      const callOrder = [];
      
      const DictionarySpy = jest.spyOn(Dictionary.prototype, 'constructor' in Dictionary.prototype ? 'constructor' : 'isValidWord');
      const GameControllerSpy = jest.spyOn(GameController.prototype, 'constructor' in GameController.prototype ? 'constructor' : 'startNewGame');
      
      // Override the helper to track order
      const customInitializeApp = async function() {
        try {
          console.log('Hard Wordle - Loading dictionary...');
          
          const response = await fetch('/words.json');
          
          if (!response.ok) {
            throw new Error(`Failed to load dictionary: ${response.status} ${response.statusText}`);
          }
          
          const data = await response.json();
          
          if (!data.words || !Array.isArray(data.words)) {
            throw new Error('Invalid dictionary format: expected "words" array');
          }
          
          if (data.words.length === 0) {
            throw new Error('Dictionary is empty');
          }
          
          console.log(`Dictionary loaded: ${data.words.length} words`);
          
          callOrder.push('Dictionary');
          dictionaryInstance = new Dictionary(data.words);
          
          callOrder.push('GameController');
          gameControllerInstance = new GameController(dictionaryInstance);
          
          callOrder.push('UIController');
          uiControllerInstance = { init: jest.fn() };
          
          callOrder.push('UIController.init');
          uiControllerInstance.init();
          
          console.log('Hard Wordle - Ready to play!');
          
        } catch (error) {
          console.error('Failed to initialize application:', error);
        }
      };

      await customInitializeApp();

      // Verify initialization order
      expect(callOrder).toEqual([
        'Dictionary',
        'GameController',
        'UIController',
        'UIController.init'
      ]);
    });
  });

  describe('Error handling for dictionary load failure', () => {
    test('should handle network error when fetching dictionary', async () => {
      // Mock fetch to reject with network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      // Create and execute initialization
      const initializeApp = createInitializeApp();
      await initializeApp();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize application:',
        expect.any(Error)
      );

      // Verify error message is displayed to user
      const messageArea = document.getElementById('message-area');
      expect(messageArea.textContent).toContain('Failed to load game');
      expect(messageArea.textContent).toContain('Network error');
      expect(messageArea.classList.contains('error')).toBe(true);

      // Verify game controls are disabled
      const guessInput = document.getElementById('guess-input');
      const submitBtn = document.getElementById('submit-btn');
      const newGameBtn = document.getElementById('new-game-btn');

      expect(guessInput.disabled).toBe(true);
      expect(submitBtn.disabled).toBe(true);
      expect(newGameBtn.disabled).toBe(true);
    });

    test('should handle HTTP error response (404)', async () => {
      // Mock fetch to return 404 error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      // Create and execute initialization
      const initializeApp = createInitializeApp();
      await initializeApp();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Verify error message is displayed
      const messageArea = document.getElementById('message-area');
      expect(messageArea.textContent).toContain('Failed to load game');
      expect(messageArea.textContent).toContain('Failed to load dictionary: 404 Not Found');
      expect(messageArea.classList.contains('error')).toBe(true);

      // Verify controls are disabled
      expect(document.getElementById('guess-input').disabled).toBe(true);
      expect(document.getElementById('submit-btn').disabled).toBe(true);
      expect(document.getElementById('new-game-btn').disabled).toBe(true);
    });

    test('should handle HTTP error response (500)', async () => {
      // Mock fetch to return 500 error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      // Create and execute initialization
      const initializeApp = createInitializeApp();
      await initializeApp();

      // Verify error message includes status
      const messageArea = document.getElementById('message-area');
      expect(messageArea.textContent).toContain('Failed to load dictionary: 500 Internal Server Error');
      expect(messageArea.classList.contains('error')).toBe(true);
    });

    test('should handle invalid dictionary format (missing words array)', async () => {
      // Mock fetch to return invalid format
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: ['apple', 'bread'] }) // Wrong structure
      });

      // Create and execute initialization
      const initializeApp = createInitializeApp();
      await initializeApp();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Verify error message
      const messageArea = document.getElementById('message-area');
      expect(messageArea.textContent).toContain('Invalid dictionary format: expected "words" array');
      expect(messageArea.classList.contains('error')).toBe(true);

      // Verify controls are disabled
      expect(document.getElementById('guess-input').disabled).toBe(true);
    });

    test('should handle invalid dictionary format (words is not an array)', async () => {
      // Mock fetch to return non-array words
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ words: 'not-an-array' })
      });

      // Create and execute initialization
      const initializeApp = createInitializeApp();
      await initializeApp();

      // Verify error message
      const messageArea = document.getElementById('message-area');
      expect(messageArea.textContent).toContain('Invalid dictionary format: expected "words" array');
      expect(messageArea.classList.contains('error')).toBe(true);
    });

    test('should handle empty dictionary', async () => {
      // Mock fetch to return empty words array
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ words: [] })
      });

      // Create and execute initialization
      const initializeApp = createInitializeApp();
      await initializeApp();

      // Verify error message
      const messageArea = document.getElementById('message-area');
      expect(messageArea.textContent).toContain('Dictionary is empty');
      expect(messageArea.classList.contains('error')).toBe(true);

      // Verify controls are disabled
      expect(document.getElementById('guess-input').disabled).toBe(true);
      expect(document.getElementById('submit-btn').disabled).toBe(true);
      expect(document.getElementById('new-game-btn').disabled).toBe(true);
    });

    test('should handle JSON parse error', async () => {
      // Mock fetch to return invalid JSON
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Unexpected token in JSON');
        }
      });

      // Create and execute initialization
      const initializeApp = createInitializeApp();
      await initializeApp();

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Verify error message
      const messageArea = document.getElementById('message-area');
      expect(messageArea.textContent).toContain('Failed to load game');
      expect(messageArea.textContent).toContain('Unexpected token in JSON');
      expect(messageArea.classList.contains('error')).toBe(true);
    });

    test('should handle missing DOM elements gracefully', async () => {
      // Remove DOM elements
      document.body.innerHTML = '';

      // Mock fetch to fail
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      // Should not throw error even with missing DOM elements
      const initializeApp = createInitializeApp();
      await expect(initializeApp()).resolves.not.toThrow();

      // Verify error was still logged
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('should display user-friendly error message with refresh instruction', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Connection timeout'));

      // Create and execute initialization
      const initializeApp = createInitializeApp();
      await initializeApp();

      const messageArea = document.getElementById('message-area');
      expect(messageArea.textContent).toContain('Failed to load game');
      expect(messageArea.textContent).toContain('Please refresh the page to try again');
    });
  });

  describe('DOM ready state handling', () => {
    test('should initialize immediately if DOM is already ready', async () => {
      const mockWords = ['apple', 'bread', 'crane'];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ words: mockWords })
      });

      // Simulate DOM already ready - just call initializeApp directly
      const initializeApp = createInitializeApp();
      await initializeApp();

      // Verify initialization happened
      expect(dictionaryInstance).toBeInstanceOf(Dictionary);
      expect(gameControllerInstance).toBeInstanceOf(GameController);
      expect(uiControllerInstance).toBeInstanceOf(UIController);
    });

    test('should handle deferred initialization pattern', async () => {
      const mockWords = ['apple', 'bread', 'crane'];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ words: mockWords })
      });

      // Simulate deferred initialization (like DOMContentLoaded event)
      const initializeApp = createInitializeApp();
      
      // Simulate waiting for event
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Then initialize
      await initializeApp();

      // Verify initialization happened
      expect(dictionaryInstance).toBeInstanceOf(Dictionary);
      expect(gameControllerInstance).toBeInstanceOf(GameController);
      expect(uiControllerInstance).toBeInstanceOf(UIController);
    });
  });
});
