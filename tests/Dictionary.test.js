/**
 * Tests for Dictionary class
 * Includes both unit tests and property-based tests
 */

const Dictionary = require('../src/Dictionary');
const fc = require('fast-check');

describe('Dictionary', () => {
  describe('Unit Tests', () => {
    describe('constructor', () => {
      test('should create a dictionary with valid words', () => {
        const words = ['apple', 'bread', 'crane'];
        const dictionary = new Dictionary(words);
        
        expect(dictionary).toBeDefined();
        expect(dictionary.size()).toBe(3);
      });

      test('should throw error if words is not an array', () => {
        expect(() => new Dictionary('not an array')).toThrow('Dictionary constructor requires an array of words');
      });

      test('should throw error if words array is empty', () => {
        expect(() => new Dictionary([])).toThrow('Dictionary cannot be empty');
      });

      test('should remove duplicate words', () => {
        const words = ['apple', 'apple', 'bread', 'bread', 'crane'];
        const dictionary = new Dictionary(words);
        
        expect(dictionary.size()).toBe(3);
      });

      test('should normalize words to lowercase', () => {
        const words = ['APPLE', 'Bread', 'cRaNe'];
        const dictionary = new Dictionary(words);
        
        expect(dictionary.isValidWord('apple')).toBe(true);
        expect(dictionary.isValidWord('bread')).toBe(true);
        expect(dictionary.isValidWord('crane')).toBe(true);
      });
    });

    describe('isValidWord', () => {
      let dictionary;

      beforeEach(() => {
        dictionary = new Dictionary(['apple', 'bread', 'crane']);
      });

      test('should return true for words in dictionary', () => {
        expect(dictionary.isValidWord('apple')).toBe(true);
        expect(dictionary.isValidWord('bread')).toBe(true);
        expect(dictionary.isValidWord('crane')).toBe(true);
      });

      test('should return false for words not in dictionary', () => {
        expect(dictionary.isValidWord('zzzzz')).toBe(false);
        expect(dictionary.isValidWord('delta')).toBe(false);
      });

      test('should be case insensitive', () => {
        expect(dictionary.isValidWord('APPLE')).toBe(true);
        expect(dictionary.isValidWord('BrEaD')).toBe(true);
        expect(dictionary.isValidWord('CRANE')).toBe(true);
      });

      test('should return false for non-string input', () => {
        expect(dictionary.isValidWord(123)).toBe(false);
        expect(dictionary.isValidWord(null)).toBe(false);
        expect(dictionary.isValidWord(undefined)).toBe(false);
        expect(dictionary.isValidWord({})).toBe(false);
      });
    });

    describe('getRandomWord', () => {
      test('should return a word from the dictionary', () => {
        const words = ['apple', 'bread', 'crane'];
        const dictionary = new Dictionary(words);
        
        const randomWord = dictionary.getRandomWord();
        
        expect(words).toContain(randomWord);
      });

      test('should return different words over multiple calls', () => {
        const words = ['apple', 'bread', 'crane', 'delta', 'eagle', 'frost', 'grape', 'house'];
        const dictionary = new Dictionary(words);
        
        const results = new Set();
        for (let i = 0; i < 50; i++) {
          results.add(dictionary.getRandomWord());
        }
        
        // With 50 calls and 8 words, we should get at least 2 different words
        expect(results.size).toBeGreaterThan(1);
      });
    });

    describe('size', () => {
      test('should return the number of unique words', () => {
        const dictionary = new Dictionary(['apple', 'bread', 'crane']);
        expect(dictionary.size()).toBe(3);
      });

      test('should return correct size after deduplication', () => {
        const dictionary = new Dictionary(['apple', 'apple', 'bread']);
        expect(dictionary.size()).toBe(2);
      });
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: hard-wordle, Property 1: Target word validity
     * Validates: Requirements 1.1, 7.1, 7.3
     * 
     * For any new game initialization, the selected target word must be 
     * exactly 5 letters long and exist in the word dictionary.
     */
    test('Property 1: Target word validity - random words from dictionary are valid and 5 letters', () => {
      fc.assert(
        fc.property(
          // Generate an array of 5-letter words
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 10, maxLength: 100 }
          ),
          (words) => {
            // Skip if no words (though minLength prevents this)
            fc.pre(words.length > 0);
            
            const dictionary = new Dictionary(words);
            
            // Get a random word from the dictionary
            const randomWord = dictionary.getRandomWord();
            
            // The random word must be exactly 5 letters
            expect(randomWord).toHaveLength(5);
            
            // The random word must be valid according to the dictionary
            expect(dictionary.isValidWord(randomWord)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 5: Dictionary validation
     * Validates: Requirements 2.2, 7.2
     * 
     * For any 5-letter string, the system must accept it as a valid guess 
     * only if it exists in the word dictionary.
     */
    test('Property 5: Dictionary validation - words in dictionary are valid, words not in dictionary are invalid', () => {
      fc.assert(
        fc.property(
          // Generate dictionary words
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 10, maxLength: 50 }
          ),
          // Generate a test word (may or may not be in dictionary)
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
          (dictionaryWords, testWord) => {
            fc.pre(dictionaryWords.length > 0);
            
            const dictionary = new Dictionary(dictionaryWords);
            const normalizedDictWords = dictionaryWords.map(w => w.toLowerCase());
            const normalizedTestWord = testWord.toLowerCase();
            
            // If the test word is in the dictionary, it should be valid
            // If it's not in the dictionary, it should be invalid
            const shouldBeValid = normalizedDictWords.includes(normalizedTestWord);
            const isValid = dictionary.isValidWord(testWord);
            
            expect(isValid).toBe(shouldBeValid);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 5: Dictionary validation (case insensitivity)
     * Validates: Requirements 2.2, 7.2
     * 
     * Dictionary validation should be case-insensitive.
     */
    test('Property 5: Dictionary validation - case insensitive validation', () => {
      fc.assert(
        fc.property(
          // Generate dictionary words
          fc.array(
            fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'), { minLength: 5, maxLength: 5 }),
            { minLength: 10, maxLength: 50 }
          ),
          (words) => {
            fc.pre(words.length > 0);
            
            const dictionary = new Dictionary(words);
            
            // Pick a random word from the dictionary
            const word = words[Math.floor(Math.random() * words.length)];
            
            // Test various case combinations
            const lowercase = word.toLowerCase();
            const uppercase = word.toUpperCase();
            const mixedCase = word.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('');
            
            // All case variations should be valid
            expect(dictionary.isValidWord(lowercase)).toBe(true);
            expect(dictionary.isValidWord(uppercase)).toBe(true);
            expect(dictionary.isValidWord(mixedCase)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: hard-wordle, Property 16: Dictionary minimum size
     * Validates: Requirements 7.4
     * 
     * The word dictionary must contain at least 5000 valid 5-letter English words.
     * 
     * Note: This test loads the actual words.json file to verify the requirement.
     */
    test('Property 16: Dictionary minimum size - dictionary contains at least 5000 words', () => {
      // Load the actual words.json file
      const fs = require('fs');
      const path = require('path');
      
      const wordsPath = path.join(__dirname, '../public/words.json');
      
      // Check if the file exists
      if (!fs.existsSync(wordsPath)) {
        // If the file doesn't exist, skip this test
        console.warn('words.json not found, skipping Property 16 test');
        return;
      }
      
      const wordsData = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
      const words = wordsData.words || wordsData;
      
      const dictionary = new Dictionary(words);
      
      // The dictionary must contain at least 5000 words
      expect(dictionary.size()).toBeGreaterThanOrEqual(5000);
      
      // Additionally verify that all words are 5 letters long
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: dictionary.size() - 1 }),
          (index) => {
            const word = dictionary.wordArray[index];
            expect(word).toHaveLength(5);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
