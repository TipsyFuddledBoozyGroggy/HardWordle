/**
 * Tests for Guess class
 */

const Guess = require('../src/Guess');

describe('Guess', () => {
  test('should create a Guess with word and feedback', () => {
    const feedback = [
      { letter: 'c', status: 'correct' },
      { letter: 'r', status: 'correct' },
      { letter: 'a', status: 'correct' },
      { letter: 'n', status: 'correct' },
      { letter: 'e', status: 'correct' }
    ];
    
    const guess = new Guess('crane', feedback);
    
    expect(guess.getWord()).toBe('crane');
    expect(guess.getFeedback()).toEqual(feedback);
  });

  test('should normalize word to lowercase', () => {
    const feedback = [
      { letter: 'c', status: 'correct' },
      { letter: 'r', status: 'correct' },
      { letter: 'a', status: 'correct' },
      { letter: 'n', status: 'correct' },
      { letter: 'e', status: 'correct' }
    ];
    
    const guess = new Guess('CRANE', feedback);
    
    expect(guess.getWord()).toBe('crane');
  });

  test('should throw error if word is not a string', () => {
    const feedback = [
      { letter: 'c', status: 'correct' }
    ];
    
    expect(() => {
      new Guess(123, feedback);
    }).toThrow('Guess word must be a string');
  });

  test('should throw error if feedback is not an array', () => {
    expect(() => {
      new Guess('crane', 'not-an-array');
    }).toThrow('Feedback must be an array');
  });

  test('should throw error if feedback length does not match word length', () => {
    const feedback = [
      { letter: 'c', status: 'correct' },
      { letter: 'r', status: 'correct' }
    ];
    
    expect(() => {
      new Guess('crane', feedback);
    }).toThrow('Feedback array length must match word length');
  });
});
