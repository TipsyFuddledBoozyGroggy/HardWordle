# Hard Wordle

A challenging word-guessing game based on the New York Times Wordle. Players attempt to guess a randomly selected 5-letter English word within 6 attempts, with visual feedback after each guess.

Unlike the original Wordle which uses a curated list of common words, Hard Wordle accepts any valid 5-letter word from the English language, making it significantly more challenging.

## Game Rules

1. You have 6 attempts to guess a randomly selected 5-letter word
2. After each guess, you receive color-coded feedback:
   - **Green**: Letter is correct and in the right position
   - **Yellow**: Letter is in the word but in the wrong position
   - **Gray**: Letter is not in the word at all
3. Only valid 5-letter English words are accepted as guesses
4. The game ends when you guess the word correctly or run out of attempts

## Features

- Comprehensive dictionary of 5000+ 5-letter English words
- Visual feedback system with color-coded tiles
- Input validation and error handling
- Clean, responsive user interface
- Dockerized for consistent deployment
- Full AWS infrastructure with automated CI/CD pipeline
- Comprehensive test suite with unit and property-based tests

## Project Structure

```
hard-wordle/
├── src/                    # Source code
│   ├── Dictionary.js       # Word dictionary management
│   ├── FeedbackGenerator.js # Feedback generation logic
│   ├── GameController.js   # Game orchestration
│   ├── GameState.js        # Game state management
│   ├── Guess.js            # Guess data structure
│   ├── UIController.js     # UI interaction handling
│   └── main.js             # Application entry point
├── tests/                  # Test files
│   ├── FeedbackGenerator.test.js
│   ├── GameController.test.js
│   ├── GameState.test.js
│   └── Guess.test.js
├── public/                 # Static assets
│   ├── index.html          # Main HTML file
│   ├── styles.css          # Styling
│   └── words.json          # Word dictionary (5000+ words)
├── infrastructure/         # CloudFormation templates
│   ├── network-stack.yaml  # VPC, subnets, security groups
│   ├── ecr-stack.yaml      # Container registry
│   ├── ecs-stack.yaml      # ECS cluster, service, ALB
│   ├── pipeline-stack.yaml # CI/CD pipeline
│   ├── deploy.sh           # Deployment script
│   └── parameters/         # Environment-specific parameters
├── dist/                   # Build output (generated)
├── Dockerfile              # Multi-stage Docker build
├── buildspec.yml           # AWS CodeBuild configuration
├── webpack.config.js       # Webpack configuration
├── jest.config.js          # Jest test configuration
└── package.json            # Dependencies and scripts
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- **Docker** (for containerization)
- **AWS CLI** (for AWS deployment)
- **Git** (for version control)

### Installing Prerequisites

**Node.js and npm:**
- Download from [nodejs.org](https://nodejs.org/)
- Verify installation: `node --version` and `npm --version`

**Docker:**
- Download from [docker.com](https://www.docker.com/get-started)
- Verify installation: `docker --version`

**AWS CLI:**
- Install following [AWS CLI installation guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- Configure with: `aws configure`
- Verify installation: `aws --version`

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hard-wordle
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Jest (testing framework)
- fast-check (property-based testing)
- Webpack (bundler)
- Babel (transpiler)

### 3. Start Development Server

```bash
npm start
```

This will:
- Start the webpack dev server
- Open the application in your default browser at `http://localhost:8080`
- Enable hot module replacement for live updates

Alternatively, to start without auto-opening the browser:

```bash
npm run dev
```

### 4. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

## Running Tests

The project includes comprehensive test coverage with both unit tests and property-based tests.

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

This will re-run tests automatically when files change.

### Generate Coverage Report

```bash
npm run test:coverage
```

This generates a detailed coverage report in the `coverage/` directory. Open `coverage/lcov-report/index.html` in a browser to view the interactive report.

### Test Structure

- **Unit Tests**: Test specific examples and edge cases
  - Feedback generation with duplicate letters
  - Game state transitions
  - Input validation scenarios
  
- **Property-Based Tests**: Verify universal properties across randomly generated inputs
  - Uses fast-check library
  - Each property test runs 100+ iterations
  - Tests correctness properties from the design document

## Docker

### Build Docker Image

```bash
docker build -t hard-wordle .
```

The Dockerfile uses a multi-stage build:
1. **Build stage**: Installs dependencies, runs tests, builds the application
2. **Production stage**: Uses nginx to serve the static files

The build will fail if any tests fail, ensuring only tested code is deployed.

### Run Docker Container Locally

```bash
docker run -p 80:80 hard-wordle
```

Access the application at `http://localhost`

To run in detached mode:

```bash
docker run -d -p 80:80 --name hard-wordle-app hard-wordle
```

### Stop and Remove Container

```bash
docker stop hard-wordle-app
docker rm hard-wordle-app
```

### View Container Logs

```bash
docker logs hard-wordle-app
```

## AWS Deployment

The application is deployed on AWS using a fully automated CI/CD pipeline. Infrastructure is defined as code using CloudFormation templates.

### Architecture Overview

```
GitHub → CodePipeline → CodeBuild → ECR → ECS (Fargate) → Application Load Balancer
                            ↓
                       Run Tests
                  (Build fails if tests fail)
```

**AWS Services Used:**
- **Amazon ECR**: Docker container registry
- **Amazon ECS (Fargate)**: Serverless container orchestration
- **Application Load Balancer**: Traffic distribution
- **Amazon VPC**: Network isolation
- **AWS CodePipeline**: CI/CD orchestration
- **AWS CodeBuild**: Build and test automation
- **AWS CloudFormation**: Infrastructure as Code

### Deployment Prerequisites

1. **AWS Account** with appropriate permissions
2. **GitHub Repository** with the code
3. **GitHub Personal Access Token** (for CodePipeline source integration)
4. **AWS CLI** configured with credentials

### Deployment Steps

Detailed deployment instructions are available in [infrastructure/README.md](infrastructure/README.md).

**Quick Start:**

1. Navigate to the infrastructure directory:
   ```bash
   cd infrastructure
   ```

2. Deploy all stacks:
   ```bash
   ./deploy.sh <environment> <github-token>
   ```
   
   Example:
   ```bash
   ./deploy.sh dev ghp_your_github_token_here
   ```

3. The script will deploy stacks in the correct order:
   - Network stack (VPC, subnets, security groups)
   - ECR stack (container registry)
   - ECS stack (cluster, service, load balancer)
   - Pipeline stack (CI/CD pipeline)

4. Once deployed, the pipeline will automatically:
   - Pull code from GitHub on every push
   - Run all tests
   - Build Docker image
   - Push to ECR
   - Deploy to ECS

### Accessing the Deployed Application

After deployment completes, get the Application Load Balancer URL:

```bash
aws cloudformation describe-stacks \
  --stack-name hard-wordle-ecs-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text
```

Access the application at the returned URL.

### Updating the Application

Simply push changes to your GitHub repository. The CI/CD pipeline will automatically:
1. Detect the change
2. Run tests
3. Build new Docker image
4. Deploy to ECS with zero-downtime rolling update

### Monitoring

- **CloudWatch Logs**: View application and container logs
- **ECS Console**: Monitor service health and task status
- **CodePipeline Console**: Track deployment progress
- **ALB Metrics**: Monitor traffic and response times

## Architecture

### Application Architecture

The application follows a layered architecture:

1. **Data Layer**: Dictionary and GameState manage data
2. **Logic Layer**: GameController, FeedbackGenerator handle business logic
3. **Presentation Layer**: UIController manages DOM and user interaction

### Component Interaction

```
User Input → UIController → GameController → GameState
                                ↓
                         FeedbackGenerator
                                ↓
                           Dictionary
```

### Feedback Generation Algorithm

The feedback generation uses a two-pass algorithm to handle duplicate letters correctly:

1. **First Pass**: Mark exact position matches as 'correct'
2. **Count Remaining**: Count unmatched letters in target word
3. **Second Pass**: For non-exact matches, check remaining letters
   - If letter exists in remaining count, mark as 'present'
   - Otherwise, mark as 'absent'

This ensures accurate feedback even with duplicate letters (e.g., "SPEED" vs "ERASE").

## Troubleshooting

### Local Development Issues

**Problem**: `npm install` fails
- **Solution**: Ensure Node.js 18+ is installed. Try deleting `node_modules` and `package-lock.json`, then run `npm install` again.

**Problem**: Tests fail with module not found errors
- **Solution**: Run `npm install` to ensure all dependencies are installed.

**Problem**: Development server won't start
- **Solution**: Check if port 8080 is already in use. Kill the process or change the port in `webpack.config.js`.

**Problem**: Application doesn't load in browser
- **Solution**: Check browser console for errors. Ensure `words.json` is present in the `public/` directory.

### Docker Issues

**Problem**: Docker build fails during test phase
- **Solution**: Run `npm test` locally to identify failing tests. Fix tests before building Docker image.

**Problem**: Container runs but application not accessible
- **Solution**: Ensure port mapping is correct (`-p 80:80`). Check if port 80 is available on your host machine.

**Problem**: "Cannot find words.json" error in container
- **Solution**: Ensure `public/words.json` exists and is included in the Docker build context (not in `.dockerignore`).

### AWS Deployment Issues

**Problem**: CloudFormation stack creation fails
- **Solution**: Check the CloudFormation console for detailed error messages. Common issues:
  - Insufficient IAM permissions
  - Resource limits exceeded
  - Invalid parameter values

**Problem**: CodePipeline fails at build stage
- **Solution**: Check CodeBuild logs in CloudWatch. Common issues:
  - Test failures (fix tests in code)
  - Missing environment variables
  - ECR permissions issues

**Problem**: ECS tasks fail to start
- **Solution**: Check ECS task logs in CloudWatch. Common issues:
  - Image pull errors (check ECR permissions)
  - Insufficient memory/CPU allocation
  - Health check failures

**Problem**: Application not accessible via ALB
- **Solution**: 
  - Verify security group rules allow HTTP traffic
  - Check target group health checks
  - Ensure ECS tasks are running and healthy
  - Verify ALB listener configuration

**Problem**: Pipeline doesn't trigger on code push
- **Solution**:
  - Verify GitHub token is valid and has correct permissions
  - Check CodePipeline source configuration
  - Ensure webhook is properly configured in GitHub

### Getting Help

For additional issues:
1. Check CloudWatch Logs for detailed error messages
2. Review AWS CloudFormation events for stack failures
3. Consult the [infrastructure/README.md](infrastructure/README.md) for deployment-specific troubleshooting

## Testing Strategy

The project uses a dual testing approach:

### Unit Tests
- Test specific examples and edge cases
- Verify component behavior with known inputs
- Located in `tests/` directory

### Property-Based Tests
- Verify universal properties across many random inputs
- Use fast-check library with 100+ iterations per property
- Test correctness properties from design document
- Tagged with property numbers for traceability

Example property test:
```javascript
// Feature: hard-wordle, Property 9: Feedback correctness
test('Property 9: Feedback correctness', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 5, maxLength: 5 }),
      fc.string({ minLength: 5, maxLength: 5 }),
      (guess, target) => {
        // Test feedback generation properties
      }
    ),
    { numRuns: 100 }
  );
});
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Build locally: `npm run build`
6. Submit a pull request

## License

MIT

## Acknowledgments

- Inspired by the New York Times Wordle game
- Word dictionary sourced from public domain English word lists
