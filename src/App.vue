<template>
  <div id="game-container">
    <header>
      <h1>Hard Wordle</h1>
      <div id="attempts-remaining">Attempts: {{ attemptsUsed }}/{{ maxAttempts }}</div>
    </header>
    
    <div id="game-board">
      <div v-for="(row, index) in boardRows" :key="index" class="guess-row">
        <div 
          v-for="(tile, tileIndex) in row" 
          :key="tileIndex"
          :class="['letter-tile', tile.status, { active: tile.active }]"
        >
          {{ tile.letter }}
        </div>
      </div>
    </div>
    
    <!-- Input is now handled through the on-screen keyboard and direct typing -->
    
    <div id="keyboard">
      <div v-for="(row, index) in keyboardLayout" :key="index" class="keyboard-row">
        <button
          v-for="key in row"
          :key="key"
          :class="['key', { wide: key === 'ENTER' || key === 'BACKSPACE' }, keyboardState[key]]"
          :data-key="key"
          @click="handleKeyPress(key)"
        >
          {{ key === 'BACKSPACE' ? '⌫' : key }}
        </button>
      </div>
    </div>
    
    <div v-if="message" :class="['message-area', messageType]" id="message-area">
      {{ message }}
    </div>
    
    <div v-if="definition" id="definition-area">
      <div class="word-title">{{ definition.word }}</div>
      <div class="definition-text">
        <em>{{ definition.partOfSpeech }}</em> - {{ definition.text }}
      </div>
    </div>
    
    <button @click="handleNewGame" id="new-game-btn">New Game</button>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

export default {
  name: 'App',
  props: {
    gameController: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const currentGuess = ref('');
    const message = ref('');
    const messageType = ref('');
    const definition = ref(null);
    const keyboardState = ref({});

    
    const keyboardLayout = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
    ];
    
    const gameState = computed(() => props.gameController.getGameState());
    const isGameOver = computed(() => gameState.value?.isGameOver() || false);
    const maxAttempts = computed(() => gameState.value?.maxAttempts || 6);
    const attemptsUsed = computed(() => gameState.value?.getGuesses().length || 0);
    
    const boardRows = computed(() => {
      console.log('Computing boardRows... currentGuess:', currentGuess.value, 'gameState exists:', !!gameState.value);
      
      if (!gameState.value) {
        console.log('No gameState, creating grid with current guess in first row');
        // Even without gameState, show current guess in first row
        const rows = [];
        for (let rowIndex = 0; rowIndex < 6; rowIndex++) {
          const row = [];
          for (let colIndex = 0; colIndex < 5; colIndex++) {
            const isCurrentRow = rowIndex === 0;
            const hasLetter = isCurrentRow && colIndex < currentGuess.value.length;
            row.push({
              letter: hasLetter ? currentGuess.value[colIndex].toUpperCase() : '',
              status: 'empty',
              active: hasLetter
            });
          }
          rows.push(row);
        }
        return rows;
      }
      
      const guesses = gameState.value.getGuesses();
      const rows = [];
      console.log('Current guesses:', guesses.length);
      
      // Add completed guess rows with feedback
      guesses.forEach((guess, guessIndex) => {
        const feedback = guess.getFeedback();
        const row = feedback.map(letterFeedback => ({
          letter: letterFeedback.letter.toUpperCase(),
          status: letterFeedback.status,
          active: false
        }));
        rows.push(row);
        console.log(`Added completed guess ${guessIndex + 1}:`, row.map(t => `${t.letter}(${t.status})`).join(' '));
      });
      
      // Add current guess row (if game not over and we haven't used all attempts)
      if (!isGameOver.value && rows.length < maxAttempts.value) {
        const currentRow = [];
        for (let i = 0; i < 5; i++) {
          currentRow.push({
            letter: i < currentGuess.value.length ? currentGuess.value[i].toUpperCase() : '',
            status: 'empty',
            active: i < currentGuess.value.length
          });
        }
        rows.push(currentRow);
        console.log('Added current guess row:', currentRow.map(t => t.letter || '_').join(''));
      }
      
      // Fill remaining empty rows
      while (rows.length < maxAttempts.value) {
        const emptyRow = Array(5).fill(null).map(() => ({
          letter: '',
          status: 'empty',
          active: false
        }));
        rows.push(emptyRow);
      }
      
      console.log(`Final board: ${rows.length} rows, ${guesses.length} completed guesses`);
      return rows;
    });
    
    const showMessage = (msg, type) => {
      message.value = msg;
      messageType.value = type;
    };
    
    const updateKeyboardState = (guess) => {
      const feedback = guess.getFeedback();
      
      feedback.forEach(letterFeedback => {
        const letter = letterFeedback.letter.toUpperCase();
        const status = letterFeedback.status;
        
        const currentStatus = keyboardState.value[letter];
        
        if (!currentStatus) {
          keyboardState.value[letter] = status;
        } else if (status === 'correct') {
          keyboardState.value[letter] = 'correct';
        } else if (status === 'present' && currentStatus !== 'correct') {
          keyboardState.value[letter] = 'present';
        }
      });
    };
    
    const resetKeyboardState = () => {
      keyboardState.value = {};
    };
    
    const handleKeyPress = (key) => {
      console.log('Key pressed:', key);
      if (isGameOver.value) return;
      
      if (key === 'ENTER') {
        console.log('Enter pressed, submitting guess:', currentGuess.value);
        handleGuessSubmit();
      } else if (key === 'BACKSPACE') {
        if (currentGuess.value.length > 0) {
          console.log('Backspace pressed, removing letter');
          currentGuess.value = currentGuess.value.slice(0, -1);
        }
      } else if (currentGuess.value.length < 5) {
        console.log('Adding letter:', key);
        currentGuess.value += key;
      }
      console.log('Current guess after key press:', currentGuess.value);
    };
    
    const handleGlobalKeydown = (event) => {
      if (isGameOver.value) return;
      
      const key = event.key.toUpperCase();
      console.log('Global key pressed:', key);
      
      if (key === 'ENTER') {
        event.preventDefault();
        handleGuessSubmit();
      } else if (key === 'BACKSPACE') {
        event.preventDefault();
        if (currentGuess.value.length > 0) {
          currentGuess.value = currentGuess.value.slice(0, -1);
        }
      } else if (/^[A-Z]$/.test(key)) {
        event.preventDefault();
        if (currentGuess.value.length < 5) {
          currentGuess.value += key;
        }
      }
    };
    
    const handleGuessSubmit = () => {
      if (isGameOver.value) return;
      
      const input = currentGuess.value.trim();
      console.log('Submitting guess:', input);
      
      showMessage('', '');
      
      if (!input) {
        showMessage('Please enter a word', 'error');
        return;
      }
      
      if (input.length !== 5) {
        showMessage('Word must be 5 letters long', 'error');
        return;
      }
      
      console.log('Game state before submission:', gameState.value ? gameState.value.getGuesses().length : 'no game state');
      
      const result = props.gameController.submitGuess(input);
      console.log('Submission result:', result);
      
      if (!result.success) {
        showMessage(result.error, 'error');
        return;
      }
      
      console.log('Game state after submission:', gameState.value ? gameState.value.getGuesses().length : 'no game state');
      
      // Clear current guess after successful submission
      currentGuess.value = '';
      
      if (result.guess) {
        updateKeyboardState(result.guess);
        console.log('Updated keyboard state for guess');
      }
      
      if (result.gameStatus === 'won') {
        showGameOver(true);
      } else if (result.gameStatus === 'lost') {
        showGameOver(false);
      } else {
        console.log('Game continues, next guess ready');
      }
    };
    
    const showGameOver = async (won) => {
      const targetWord = gameState.value.getTargetWord().toUpperCase();
      
      if (won) {
        showMessage(`Congratulations! You won! The word was ${targetWord}`, 'success');
      } else {
        showMessage(`Game Over! The word was ${targetWord}`, 'error');
      }
      
      await fetchWordDefinition(targetWord);
    };
    
    const fetchWordDefinition = async (word) => {
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
        
        if (!response.ok) {
          throw new Error('Definition not found');
        }
        
        const data = await response.json();
        
        if (data && data.length > 0 && data[0].meanings && data[0].meanings.length > 0) {
          const meaning = data[0].meanings[0];
          definition.value = {
            word: word,
            partOfSpeech: meaning.partOfSpeech,
            text: meaning.definitions[0].definition
          };
        } else {
          definition.value = {
            word: word,
            partOfSpeech: '',
            text: 'Definition not available'
          };
        }
      } catch (error) {
        console.error('Error fetching definition:', error);
        definition.value = {
          word: word,
          partOfSpeech: '',
          text: 'Definition not available'
        };
      }
    };
    
    const handleNewGame = () => {
      console.log('Starting new game...');
      props.gameController.startNewGame();
      currentGuess.value = '';
      showMessage('', '');
      definition.value = null;
      resetKeyboardState();
      console.log('New game started, gameState:', gameState.value);
    };
    
    onMounted(() => {
      handleNewGame();
      // Add global keyboard event listener
      document.addEventListener('keydown', handleGlobalKeydown);
    });
    
    // Clean up event listener when component unmounts
    onUnmounted(() => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    });
    
    return {
      currentGuess,
      message,
      messageType,
      definition,
      keyboardState,
      keyboardLayout,
      boardRows,
      isGameOver,
      maxAttempts,
      attemptsUsed,
      handleKeyPress,
      handleGlobalKeydown,
      handleGuessSubmit,
      handleNewGame
    };
  }
};
</script>

<style src="../public/styles.css"></style>
