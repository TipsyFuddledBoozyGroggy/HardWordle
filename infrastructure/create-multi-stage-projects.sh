#!/bin/bash

# Create separate CodeBuild projects for multi-stage pipeline
# This script creates Test, Build, and Deploy projects manually

set -e

# Configuration
ENVIRONMENT="dev"
REGION="us-east-1"
ACCOUNT_ID="864899864715"
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ENVIRONMENT}-hard-wordle-codebuild-role"

echo "🚀 Creating Multi-Stage CodeBuild Projects"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# 1. Create Test Project
echo "🧪 Creating Test Project..."
aws codebuild create-project \
    --name "${ENVIRONMENT}-hard-wordle-test" \
    --description "Run Jest tests for Hard Wordle application" \
    --service-role "$ROLE_ARN" \
    --artifacts type=CODEPIPELINE \
    --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL,privilegedMode=false \
    --source type=CODEPIPELINE,buildspec=buildspec-test.yml \
    --region $REGION \
    --tags key=Name,value="${ENVIRONMENT}-hard-wordle-test" key=Environment,value="$ENVIRONMENT" key=Project,value=hard-wordle \
    2>/dev/null || echo "Test project already exists"

# 2. Create Build Project  
echo "🏗️ Creating Build Project..."
aws codebuild create-project \
    --name "${ENVIRONMENT}-hard-wordle-build-app" \
    --description "Build Hard Wordle application for S3 deployment" \
    --service-role "$ROLE_ARN" \
    --artifacts type=CODEPIPELINE \
    --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL,privilegedMode=false \
    --source type=CODEPIPELINE,buildspec='version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 18
  pre_build:
    commands:
      - echo "🏗️ Starting Build Stage..."
      - echo "Installing dependencies..."
      - npm ci
  build:
    commands:
      - echo "📦 Building the application..."
      - npm run build
  post_build:
    commands:
      - echo "✅ Build completed successfully!"
      - ls -la dist/
artifacts:
  files:
    - "**/*"
  base-directory: dist
  name: BuildArtifact
cache:
  paths:
    - "node_modules/**/*"' \
    --region $REGION \
    --tags key=Name,value="${ENVIRONMENT}-hard-wordle-build-app" key=Environment,value="$ENVIRONMENT" key=Project,value=hard-wordle \
    2>/dev/null || echo "Build project already exists"

# 3. Create Deploy Project
echo "🚀 Creating Deploy Project..."
aws codebuild create-project \
    --name "${ENVIRONMENT}-hard-wordle-deploy-s3" \
    --description "Deploy Hard Wordle application to S3" \
    --service-role "$ROLE_ARN" \
    --artifacts type=CODEPIPELINE \
    --environment type=LINUX_CONTAINER,image=aws/codebuild/standard:7.0,computeType=BUILD_GENERAL1_SMALL,privilegedMode=false,environmentVariables='[{"name":"WEBSITE_BUCKET","value":"'${ENVIRONMENT}'-hard-wordle-website-'${ACCOUNT_ID}'"}]' \
    --source type=CODEPIPELINE,buildspec='version: 0.2
phases:
  pre_build:
    commands:
      - echo "🚀 Starting Deploy Stage..."
      - echo "Website bucket: $WEBSITE_BUCKET"
  build:
    commands:
      - echo "📤 Deploying to S3..."
      - aws s3 sync . s3://$WEBSITE_BUCKET --delete
      - echo "🌐 Deployment completed!"
  post_build:
    commands:
      - echo "✅ Application deployed successfully to S3!"
      - echo "🔗 Website URL: http://$WEBSITE_BUCKET.s3-website-us-east-1.amazonaws.com"' \
    --region $REGION \
    --tags key=Name,value="${ENVIRONMENT}-hard-wordle-deploy-s3" key=Environment,value="$ENVIRONMENT" key=Project,value=hard-wordle \
    2>/dev/null || echo "Deploy project already exists"

echo ""
echo "✅ Multi-Stage CodeBuild Projects Created!"
echo ""
echo "📋 Created Projects:"
echo "   • ${ENVIRONMENT}-hard-wordle-test - Runs Jest tests and coverage"
echo "   • ${ENVIRONMENT}-hard-wordle-build-app - Builds the application"  
echo "   • ${ENVIRONMENT}-hard-wordle-deploy-s3 - Deploys to S3"
echo ""
echo "🎯 Next Steps:"
echo "   • Update your pipeline to use these separate projects"
echo "   • Each stage will now have dedicated logs and can be run independently"
echo "   • Test failures will stop the pipeline before build/deploy"
echo ""