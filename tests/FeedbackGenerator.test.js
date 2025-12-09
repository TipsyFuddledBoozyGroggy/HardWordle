/**
 * Tests for FeedbackGenerator
 */

const FeedbackGenerator = require('../src/FeedbackGenerator');
const fc = require('fast-check');

describe('FeedbackGenerator', () => {
  describe('generateFeedback', () => {
    test('should mark exact matches as correct', () => {
      const feedback = FeedbackGenerator.generateFeedback('crane', 'crane');
      
      expect(feedback).toHaveLength(5);
      feedback.forEach(letterFeedback => {
        expect(letterFeedback.status).toBe('correct');
      });
    });

    test('should mark letters in wrong position as present', () => {
      const feedback = FeedbackGenerator.generateFeedback('ncare', 'crane');
      
      expect(feedback[0]).toEqual({ letter: 'n', status: 'present' });
      expect(feedback[1]).toEqual({ letter: 'c', status: 'present' });
      expect(feedback[2]).toEqual({ letter: 'a', status: 'correct' });
      expect(feedback[3]).toEqual({ letter: 'r', status: 'present' });
      expect(feedback[4]).toEqual({ letter: 'e', status: 'correct' });
    });

    test('should mark letters not in target as absent', () => {
      const feedback = FeedbackGenerator.generateFeedback('brick', 'crane');
      
      // b - absent (not in target)
      // r - correct (position 1 matches)
      // i - absent (not in target)
      // c - present (c exists in target at position 0)
      // k - absent (not in target)
      
      expect(feedback[0]).toEqual({ letter: 'b', status: 'absent' });
      expect(feedback[1]).toEqual({ letter: 'r', status: 'correct' });
      expect(feedback[2]).toEqual({ letter: 'i', status: 'absent' });
      expect(feedback[3]).toEqual({ letter: 'c', status: 'present' });
      expect(feedback[4]).toEqual({ letter: 'k', status: 'absent' });
    });

    test('should handle duplicate letters correctly - SPEED vs ERASE', () => {
      const feedback = FeedbackGenerator.generateFeedback('speed', 'erase');
      
      // Target: e-r-a-s-e (positions 0-4)
      // Guess:  s-p-e-e-d
      // s - present (s exists in target at position 3)
      // p - absent (not in target)
      // e - present (e exists in target, first e gets marked present)
      // e - present (second e also exists in target, gets marked present)
      // d - absent (not in target)
      
      expect(feedback[0]).toEqual({ letter: 's', status: 'present' });
      expect(feedback[1]).toEqual({ letter: 'p', status: 'absent' });
      expect(feedback[2]).toEqual({ letter: 'e', status: 'present' });
      expect(feedback[3]).toEqual({ letter: 'e', status: 'present' });
      expect(feedback[4]).toEqual({ letter: 'd', status: 'absent' });
    });

    test('should handle duplicate letters with limited target occurrences', () => {
      const feedback = FeedbackGenerator.generateFeedback('llama', 'label');
      
      // Target: l-a-b-e-l (positions 0-4)
      // Guess:  l-l-a-m-a
      // l - correct (position 0 matches)
      // l - present (second l exists in target at position 4)
      // a - present (a exists in target at position 1, not position 2)
      // m - absent (not in target)
      // a - absent (only 1 'a' in target, already used for position 2)
      
      expect(feedback[0]).toEqual({ letter: 'l', status: 'correct' });
      expect(feedback[1]).toEqual({ letter: 'l', status: 'present' });
      expect(feedback[2]).toEqual({ letter: 'a', status: 'present' });
      expect(feedback[3]).toEqual({ letter: 'm', status: 'absent' });
      expect(feedback[4]).toEqual({ letter: 'a', status: 'absent' });
    });

    test('should be case insensitive', () => {
      const feedback1 = FeedbackGenerator.generateFeedback('CRANE', 'crane');
      const feedback2 = FeedbackGenerator.generateFeedback('crane', 'CRANE');
      const feedback3 = FeedbackGenerator.generateFeedback('CrAnE', 'cRaNe');
      
      feedback1.forEach(f => expect(f.status).toBe('correct'));
      feedback2.forEach(f => expect(f.status).toBe('correct'));
      feedback3.forEach(f => expect(f.status).toBe('correct'));
    });

    test('should throw error for mismatched lengths', () => {
      expect(() => {
        FeedbackGenerator.generateFeedback('cat', 'crane');
      }).toThrow('Guess and target word must have the same length');
    });

    test('should throw error for non-string inputs', () => {
      expect(() => {
        FeedbackGenerator.generateFeedback(123, 'crane');
      }).toThrow('Both guess and targetWord must be strings');
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Feature: hard-wordle, Property 9: Feedback correctness
     * Validates: Requirements 3.2, 3.3, 3.4
     * 
     * For any guess and target word pair, the feedback generation must satisfy these rules:
     * - Letters at matching positions are marked 'correct'
     * - Letters in the target but at wrong positions are marked 'present' (respecting letter frequency)
     * - Letters not in the target are marked 'absent'
     */
    test('Property 9: Feedback correctness - all feedback rules are satisfied', () => {
      // Generator for 5-letter words using lowercase letters
      const fiveLetterWord = fc.stringOf(
        fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz'.split('')),
        { minLength: 5, maxLength: 5 }
      );

      fc.assert(
        fc.property(fiveLetterWord, fiveLetterWord, (guess, target) => {
          const feedback = FeedbackGenerator.generateFeedback(guess, target);

          // Verify feedback has correct length
          expect(feedback).toHaveLength(5);

          // Count letter frequencies in target
          const targetLetterCount = {};
          for (let i = 0; i < target.length; i++) {
            const letter = target[i].toLowerCase();
            targetLetterCount[letter] = (targetLetterCount[letter] || 0) + 1;
          }

          // Track which letters have been used for correct/present marking
          const usedTargetLetters = {};
          for (const letter in targetLetterCount) {
            usedTargetLetters[letter] = 0;
          }

          // Rule 1: Letters at matching positions must be marked 'correct'
          for (let i = 0; i < guess.length; i++) {
            const guessLetter = guess[i].toLowerCase();
            const targetLetter = target[i].toLowerCase();
            
            if (guessLetter === targetLetter) {
              expect(feedback[i].status).toBe('correct');
              expect(feedback[i].letter).toBe(guessLetter);
              usedTargetLetters[guessLetter]++;
            }
          }

          // Rule 2 & 3: Letters not at matching positions should be 'present' or 'absent'
          for (let i = 0; i < guess.length; i++) {
            const guessLetter = guess[i].toLowerCase();
            const targetLetter = target[i].toLowerCase();
            
            // Skip if already marked as correct
            if (guessLetter === targetLetter) {
              continue;
            }

            // Check if letter exists in target
            if (targetLetterCount[guessLetter]) {
              // If we haven't used up all instances of this letter
              if (usedTargetLetters[guessLetter] < targetLetterCount[guessLetter]) {
                expect(feedback[i].status).toBe('present');
                usedTargetLetters[guessLetter]++;
              } else {
                // All instances used, should be absent
                expect(feedback[i].status).toBe('absent');
              }
            } else {
              // Letter not in target at all
              expect(feedback[i].status).toBe('absent');
            }

            expect(feedback[i].letter).toBe(guessLetter);
          }

          // Verify no letter is marked present/correct more times than it appears in target
          const markedLetterCount = {};
          for (const letterFeedback of feedback) {
            if (letterFeedback.status === 'correct' || letterFeedback.status === 'present') {
              const letter = letterFeedback.letter;
              markedLetterCount[letter] = (markedLetterCount[letter] || 0) + 1;
            }
          }

          for (const letter in markedLetterCount) {
            expect(markedLetterCount[letter]).toBeLessThanOrEqual(
              targetLetterCount[letter] || 0
            );
          }
        }),
        { numRuns: 100 } // Run 100 iterations as specified in design
      );
    });
  });
});
