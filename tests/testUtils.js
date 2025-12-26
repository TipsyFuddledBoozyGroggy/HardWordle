/**
 * Test utilities for Vue component testing
 */

// Import Vue test utilities
const { mount } = require('@vue/test-utils');
const { nextTick } = require('vue');

// Import business logic modules
const Dictionary = require('../src/Dictionary');
const GameController = require('../src/GameController');

// Import Vue component
const App = require('../src/App.vue').default;

/**
 * Create a test dictionary with a small set of known words
 */
function createTestDictionary() {
  const testWords = [
    'APPLE', 'BREAD', 'CRANE', 'DANCE', 'EAGLE',
    'FLAME', 'GRAPE', 'HOUSE', 'IMAGE', 'JUICE',
    'KNIFE', 'LEMON', 'MOUSE', 'NURSE', 'OCEAN',
    'PIANO', 'QUEEN', 'RIVER', 'SNAKE', 'TIGER',
    'UNCLE', 'VOICE', 'WATER', 'XERUS', 'YOUTH', 'ZEBRA'
  ];
  return new Dictionary(testWords);
}

/**
 * Create a game controller with test dictionary
 */
function createTestGameController() {
  const dictionary = createTestDictionary();
  return new GameController(dictionary);
}

/**
 * Mount App component with test game controller
 */
function mountAppWithTestController(options = {}) {
  const gameController = createTestGameController();
  
  const defaultProps = {
    gameController
  };
  
  const mountOptions = {
    props: { ...defaultProps, ...options.props },
    ...options
  };
  
  return {
    wrapper: mount(App, mountOptions),
    gameController
  };
}

/**
 * Wait for Vue's nextTick and any additional async operations
 */
async function waitForUpdates() {
  await nextTick();
  // Add small delay for any async operations
  await new Promise(resolve => setTimeout(resolve, 10));
}

/**
 * Simulate typing a word character by character
 */
async function typeWord(wrapper, word) {
  for (const char of word.toUpperCase()) {
    const keyButton = wrapper.find(`[data-key="${char}"]`);
    if (keyButton.exists()) {
      await keyButton.trigger('click');
      await waitForUpdates();
    }
  }
}

/**
 * Simulate pressing Enter to submit a guess
 */
async function submitGuess(wrapper) {
  const enterButton = wrapper.find('[data-key="ENTER"]');
  if (enterButton.exists()) {
    await enterButton.trigger('click');
    await waitForUpdates();
  }
}

/**
 * Simulate pressing Backspace
 */
async function pressBackspace(wrapper) {
  const backspaceButton = wrapper.find('[data-key="BACKSPACE"]');
  if (backspaceButton.exists()) {
    await backspaceButton.trigger('click');
    await waitForUpdates();
  }
}

/**
 * Get the current state of the game board as a 2D array
 */
function getBoardState(wrapper) {
  const rows = wrapper.findAll('.guess-row');
  return rows.map(row => {
    const tiles = row.findAll('.letter-tile');
    return tiles.map(tile => ({
      letter: tile.text().trim(),
      classes: tile.classes()
    }));
  });
}

/**
 * Get the current keyboard state
 */
function getKeyboardState(wrapper) {
  const keys = wrapper.findAll('.key');
  const state = {};
  
  keys.forEach(key => {
    const keyText = key.text().trim();
    if (keyText && keyText !== '⌫' && keyText !== 'ENTER' && keyText !== 'BACKSPACE') {
      state[keyText] = key.classes();
    }
  });
  
  return state;
}

/**
 * Check if a message is displayed
 */
function getDisplayedMessage(wrapper) {
  const messageArea = wrapper.find('#message-area');
  if (messageArea.exists() && messageArea.isVisible()) {
    return {
      text: messageArea.text().trim(),
      classes: messageArea.classes()
    };
  }
  return null;
}

/**
 * Simulate a complete game to win state
 */
async function playGameToWin(wrapper, gameController, targetWord = null) {
  // If no target word provided, get it from the game state
  if (!targetWord) {
    targetWord = gameController.getGameState().getTargetWord();
  }
  
  await typeWord(wrapper, targetWord);
  await submitGuess(wrapper);
  await waitForUpdates();
}

/**
 * Simulate a complete game to loss state
 */
async function playGameToLoss(wrapper, gameController) {
  const targetWord = gameController.getGameState().getTargetWord();
  const testWords = ['APPLE', 'BREAD', 'CRANE', 'DANCE', 'EAGLE', 'FLAME'];
  
  // Make 6 wrong guesses (avoid the target word)
  for (let i = 0; i < 6; i++) {
    let guessWord = testWords[i];
    // Make sure we don't accidentally guess the target word
    if (guessWord === targetWord.toUpperCase()) {
      guessWord = testWords[(i + 1) % testWords.length];
    }
    
    await typeWord(wrapper, guessWord);
    await submitGuess(wrapper);
    await waitForUpdates();
  }
}

module.exports = {
  createTestDictionary,
  createTestGameController,
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
};