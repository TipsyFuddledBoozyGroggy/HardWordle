# Hard Wordle Design Document

## Overview

Hard Wordle is a browser-based word-guessing game implemented using Vue.js 3, HTML, CSS, and JavaScript. The application follows a client-side architecture where all game logic executes in the browser. The design emphasizes simplicity, maintainability, and a clean separation between game logic, state management, and UI rendering using Vue's reactive system.

The game will use a comprehensive dictionary of 5-letter English words stored as a JSON file. The architecture consists of three main layers: the data layer (dictionary and game state), the logic layer (game rules and validation), and the presentation layer (Vue components with reactive UI rendering and user interaction). Vue's Composition API will be used for better code organization and reusability.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────┐
│           User Interface Layer          │
│  (HTML/CSS + DOM Manipulation)          │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Game Logic Layer                │
│  - Game Controller                      │
│  - Guess Validator                      │
│  - Feedback Generator                   │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│          Data Layer                     │
│  - Game State                           │
│  - Word Dictionary                      │
└─────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: Vue.js 3 (Composition API), HTML5, CSS3
- **Build Tool**: Vite
- **Web Server**: Nginx (for serving static files)
- **Containerization**: Docker
- **Data Storage**: JSON file for dictionary, browser localStorage for game state persistence (optional)
- **Testing**: Jest for unit tests, fast-check for property-based testing, Vue Test Utils for component testing
- **CI/CD**: AWS CodePipeline, AWS CodeBuild
- **Infrastructure**: AWS CloudFormation
- **Hosting**: AWS S3 + CloudFront (static site) or AWS ECS (containerized)

## Components and Interfaces

### 1. Dictionary Module

**Responsibility**: Load and provide access to the word dictionary

```javascript
class Dictionary {
  constructor(words)
  
  // Check if a word exists in the dictionary
  isValidWord(word: string): boolean
  
  // Get a random word from the dictionary
  getRandomWord(): string
  
  // Get the total number of words
  size(): number
}
```

### 2. Game State

**Responsibility**: Maintain the current state of the game

```javascript
class GameState {
  targetWord: string
  guesses: Guess[]
  maxAttempts: number
  gameStatus: 'in-progress' | 'won' | 'lost'
  
  constructor(targetWord: string, maxAttempts: number = 6)
  
  // Add a new guess to the game
  addGuess(guess: Guess): void
  
  // Get remaining attempts
  getRemainingAttempts(): number
  
  // Check if game is over
  isGameOver(): boolean
  
  // Get all guesses
  getGuesses(): Guess[]
}
```

### 3. Guess

**Responsibility**: Represent a single guess with its feedback

```javascript
class Guess {
  word: string
  feedback: LetterFeedback[]
  
  constructor(word: string, feedback: LetterFeedback[])
}

type LetterFeedback = {
  letter: string
  status: 'correct' | 'present' | 'absent'
}
```

### 4. Feedback Generator

**Responsibility**: Generate feedback for a guess compared to the target word

```javascript
class FeedbackGenerator {
  // Generate feedback for a guess
  static generateFeedback(guess: string, targetWord: string): LetterFeedback[]
}
```

**Algorithm for Feedback Generation**:
1. Initialize all letters as 'absent'
2. First pass: Mark exact matches (correct position) as 'correct'
3. Count remaining letters in target (excluding exact matches)
4. Second pass: For non-exact matches, check if letter exists in remaining target letters
   - If yes, mark as 'present' and decrement count
   - If no, keep as 'absent'

### 5. Game Controller

**Responsibility**: Orchestrate game flow and enforce game rules

```javascript
class GameController {
  constructor(dictionary: Dictionary)
  
  // Start a new game
  startNewGame(): GameState
  
  // Submit a guess
  submitGuess(word: string): GuessResult
  
  // Get current game state
  getGameState(): GameState
}

type GuessResult = {
  success: boolean
  error?: string
  guess?: Guess
  gameStatus: 'in-progress' | 'won' | 'lost'
}
```

### 6. Vue App Component

**Responsibility**: Main Vue component that handles user interactions and displays game state

The application will use Vue 3 with the Composition API. The main App component will:
- Manage reactive state for the game
- Integrate with GameController for game logic
- Handle user input and events
- Render the game board with reactive updates

```javascript
// Vue Component (Composition API)
<script setup>
import { ref, computed, onMounted } from 'vue'
import GameController from './GameController'
import Dictionary from './Dictionary'

// Reactive state
const gameController = ref(null)
const guesses = ref([])
const currentGuess = ref('')
const message = ref('')
const messageType = ref('')
const gameStatus = ref('in-progress')
const remainingAttempts = ref(6)

// Methods
const startNewGame = () => { /* ... */ }
const submitGuess = () => { /* ... */ }
const handleInput = (value) => { /* ... */ }
</script>
```

## Data Models

### Word Dictionary Format

The dictionary will be stored as a JSON file:

```json
{
  "words": [
    "apple",
    "bread",
    "crane",
    ...
  ]
}
```

### Game State Structure

```javascript
{
  targetWord: "crane",
  guesses: [
    {
      word: "apple",
      feedback: [
        { letter: "a", status: "present" },
        { letter: "p", status: "absent" },
        { letter: "p", status: "absent" },
        { letter: "l", status: "absent" },
        { letter: "e", status: "correct" }
      ]
    }
  ],
  maxAttempts: 6,
  gameStatus: "in-progress"
}
```

### Vue Component Structure

```vue
<template>
  <div id="game-container">
    <header>
      <h1>Hard Wordle</h1>
      <div id="attempts-remaining">Attempts: {{ remainingAttempts }}/6</div>
    </header>
    
    <div id="game-board">
      <div v-for="(guess, index) in displayGuesses" :key="index" class="guess-row">
        <div 
          v-for="(tile, tileIndex) in guess" 
          :key="tileIndex" 
          class="letter-tile"
          :class="tile.status"
        >
          {{ tile.letter }}
        </div>
      </div>
    </div>
    
    <div id="input-section">
      <input 
        v-model="currentGuess"
        @keyup.enter="submitGuess"
        id="guess-input" 
        type="text" 
        maxlength="5"
        :disabled="gameStatus !== 'in-progress'"
      />
      <button 
        @click="submitGuess"
        id="submit-btn"
        :disabled="gameStatus !== 'in-progress'"
      >
        Submit
      </button>
    </div>
    
    <div id="message-area" :class="messageType">{{ message }}</div>
    
    <button @click="startNewGame" id="new-game-btn">New Game</button>
  </div>
</template>
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Target word validity
*For any* new game initialization, the selected target word must be exactly 5 letters long and exist in the word dictionary.
**Validates: Requirements 1.1, 7.1, 7.3**

### Property 2: Initial state consistency
*For any* new game, the initial game state must have zero guesses, six remaining attempts, and 'in-progress' status.
**Validates: Requirements 1.2**

### Property 3: State isolation between games
*For any* game state with previous guesses, starting a new game must result in a fresh state with no previous guesses and a different target word.
**Validates: Requirements 1.4**

### Property 4: Length validation
*For any* string input, the system must accept it as a valid guess only if it is exactly 5 characters long.
**Validates: Requirements 2.1**

### Property 5: Dictionary validation
*For any* 5-letter string, the system must accept it as a valid guess only if it exists in the word dictionary.
**Validates: Requirements 2.2, 7.2**

### Property 6: Invalid guess preservation
*For any* invalid guess (wrong length or not in dictionary), submitting it must not change the number of remaining attempts or add it to the guess history.
**Validates: Requirements 2.3**

### Property 7: Attempt decrement
*For any* valid guess submitted during an in-progress game, the number of remaining attempts must decrease by exactly 1.
**Validates: Requirements 2.4**

### Property 8: Case normalization
*For any* valid word, submitting it in different cases (uppercase, lowercase, mixed) must produce identical feedback results.
**Validates: Requirements 2.5**

### Property 9: Feedback correctness
*For any* guess and target word pair, the feedback generation must satisfy these rules:
- Letters at matching positions are marked 'correct'
- Letters in the target but at wrong positions are marked 'present' (respecting letter frequency)
- Letters not in the target are marked 'absent'
**Validates: Requirements 3.2, 3.3, 3.4**

### Property 10: Guess history ordering
*For any* sequence of valid guesses, the game state must maintain them in chronological order (first to last).
**Validates: Requirements 4.2**

### Property 11: Guess persistence
*For any* guess submitted during gameplay, it must remain accessible in the game state along with its feedback until the game ends.
**Validates: Requirements 4.1, 4.3**

### Property 12: Win condition
*For any* game state where a guess exactly matches the target word, the game status must be 'won' and no further guesses must be accepted.
**Validates: Requirements 5.1**

### Property 13: Loss condition
*For any* game state where six guesses have been made without matching the target word, the game status must be 'lost'.
**Validates: Requirements 5.2**

### Property 14: Game status accuracy
*For any* game state, the game status must accurately reflect whether the game is 'in-progress', 'won', or 'lost' based on the guesses and target word.
**Validates: Requirements 5.3**

### Property 15: Remaining attempts accuracy
*For any* game state, the displayed remaining attempts must equal (max attempts - number of guesses made).
**Validates: Requirements 6.2**

### Property 16: Dictionary minimum size
The word dictionary must contain at least 5000 valid 5-letter English words.
**Validates: Requirements 7.4**

### Property 17: Container port exposure
*For any* Docker container instance, the application must be accessible on port 80.
**Validates: Requirements 8.2**

### Property 18: Build test execution
*For any* build process, all unit tests and integration tests must execute before the Docker image is created.
**Validates: Requirements 8.3**

### Property 19: Build failure on test failure
*For any* build process where tests fail, the build must fail and no Docker image must be created.
**Validates: Requirements 8.4**

### Property 20: Pipeline trigger on code push
*For any* code push to the source repository, the CI/CD pipeline must automatically initiate a build.
**Validates: Requirements 9.1**

### Property 21: Deployment on successful build
*For any* successful build that passes all tests, the Docker image must be pushed to ECR and deployed to ECS.
**Validates: Requirements 9.3, 9.4**

## Error Handling

### Input Validation Errors

1. **Empty Input**: Display "Please enter a word" message
2. **Wrong Length**: Display "Word must be exactly 5 letters" message
3. **Not in Dictionary**: Display "Not a valid word" message
4. **Game Already Over**: Prevent submission and display "Game is over. Start a new game!" message

### System Errors

1. **Dictionary Load Failure**: Display error message and prevent game start
2. **Invalid Dictionary Format**: Validate dictionary structure on load

### Error Response Format

```javascript
{
  success: false,
  error: "Error message here",
  errorType: "validation" | "system"
}
```

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Feedback Generation Edge Cases**:
   - Duplicate letters in guess and target (e.g., guess "SPEED" vs target "ERASE")
   - All letters correct
   - No letters correct
   - Mix of correct, present, and absent letters

2. **Game State Transitions**:
   - Winning on first guess
   - Winning on last guess
   - Losing after six attempts
   - State after each guess

3. **Input Validation**:
   - Empty strings
   - Strings with numbers or special characters
   - Strings shorter or longer than 5 letters
   - Valid words in different cases

4. **Dictionary Operations**:
   - Loading dictionary from JSON
   - Checking word existence
   - Getting random words

### Property-Based Testing

Property-based testing will verify universal properties across many randomly generated inputs using the **fast-check** library. Each property test will run a minimum of 100 iterations.

1. **Feedback Generation Properties**:
   - Test Property 9 with randomly generated guess/target pairs
   - Verify letter frequency handling with random duplicate scenarios

2. **Game State Properties**:
   - Test Properties 2, 3, 6, 7, 10, 11 with random game sequences
   - Verify state consistency across random guess sequences

3. **Validation Properties**:
   - Test Properties 4, 5, 8 with random string inputs
   - Verify case insensitivity with random case combinations

4. **Win/Loss Properties**:
   - Test Properties 12, 13, 14 with random game scenarios
   - Verify game termination conditions

Each property-based test will be tagged with a comment in this format:
```javascript
// Feature: hard-wordle, Property 9: Feedback correctness
```

### Integration Testing

Integration tests will verify the interaction between components using Vue Test Utils:

1. Complete game flow from start to win
2. Complete game flow from start to loss
3. Multiple sequential games
4. Vue component interaction with game controller
5. User input handling and reactive state updates

### Test Coverage Goals

- Aim for 90%+ code coverage on game logic
- 100% coverage on feedback generation algorithm
- All correctness properties must have corresponding property-based tests

## Deployment Architecture

### Docker Container

The application will be containerized using Docker with the following structure:

```dockerfile
# Multi-stage build
# Stage 1: Build and test
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm test
RUN npm run build  # Vite build for Vue app

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### AWS Infrastructure

The application will be deployed on AWS using the following services:

1. **Amazon ECR**: Store Docker images
2. **Amazon ECS (Fargate)**: Run containerized application
3. **Application Load Balancer**: Distribute traffic
4. **Amazon CloudFront**: CDN for global distribution (optional)
5. **AWS CodePipeline**: Orchestrate CI/CD workflow
6. **AWS CodeBuild**: Build and test Docker images
7. **AWS CloudFormation**: Infrastructure as Code

### CI/CD Pipeline Flow

```
GitHub/Source → CodePipeline → CodeBuild → ECR → ECS (Fargate) → ALB
                                    ↓
                              Run Tests
                         (Unit + Integration)
```

### CloudFormation Stack Structure

The infrastructure will be defined in CloudFormation templates:

1. **network-stack.yaml**: VPC, subnets, security groups
2. **ecr-stack.yaml**: ECR repository for Docker images
3. **ecs-stack.yaml**: ECS cluster, task definition, service, ALB
4. **pipeline-stack.yaml**: CodePipeline, CodeBuild project, IAM roles

### Environment Configuration

- **Development**: Single container, minimal resources
- **Production**: Auto-scaling (2-4 containers), enhanced monitoring

## Security Considerations

1. **Container Security**:
   - Use official base images
   - Run as non-root user
   - Scan images for vulnerabilities

2. **AWS Security**:
   - Use IAM roles with least privilege
   - Enable CloudTrail logging
   - Use security groups to restrict access
   - Enable ALB access logs

3. **Application Security**:
   - Serve over HTTPS only
   - Implement CSP headers
   - No sensitive data in client-side code
