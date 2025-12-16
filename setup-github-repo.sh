#!/bin/bash

# Script to initialize and push Hard Wordle code to GitHub repository
# This script sets up the local git repository and pushes to GitHub

set -e

REPO_URL="https://github.com/TipsyFuddledBoozyGroggy/hard-wordle.git"
REPO_NAME="TipsyFuddledBoozyGroggy/hard-wordle"

echo "========================================="
echo "Hard Wordle GitHub Repository Setup"
echo "========================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing git repository..."
    git init
    echo "✓ Git repository initialized"
else
    echo "✓ Git repository already exists"
fi

# Add remote if it doesn't exist
if ! git remote get-url origin >/dev/null 2>&1; then
    echo "Adding GitHub remote..."
    git remote add origin $REPO_URL
    echo "✓ Remote added: $REPO_URL"
else
    echo "✓ Remote already configured"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    echo "Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Coverage directory used by tools like istanbul
coverage/

# AWS deployment artifacts
*.zip

# Temporary files
tmp/
temp/
EOF
    echo "✓ .gitignore created"
fi

# Stage all files
echo "Staging files for commit..."
git add .
echo "✓ Files staged"

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "No changes to commit"
else
    # Commit changes
    echo "Committing changes..."
    git commit -m "Initial commit: Hard Wordle game with Vue 3 and AWS infrastructure

- Complete Vue 3 application with Composition API
- Game logic with Dictionary, GameController, GameState, FeedbackGenerator
- Comprehensive test suite with Jest and fast-check
- Docker containerization with multi-stage build
- AWS infrastructure as code (CloudFormation)
- CI/CD pipeline with CodePipeline and CodeBuild
- ECS Fargate deployment with Application Load Balancer"
    echo "✓ Changes committed"
fi

# Push to GitHub
echo "Pushing to GitHub..."
git branch -M main
git push -u origin main
echo "✓ Code pushed to GitHub"

echo ""
echo "========================================="
echo "Repository setup complete!"
echo "========================================="
echo "Repository: $REPO_NAME"
echo "URL: $REPO_URL"
echo ""
echo "Next steps:"
echo "1. Create CodeStar connection in AWS Console"
echo "2. Update parameter files with connection ARN"
echo "3. Deploy infrastructure: ./infrastructure/deploy.sh dev"
echo "========================================="