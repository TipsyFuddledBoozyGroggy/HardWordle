#!/bin/bash

# Deploy Multi-Stage Pipeline for Hard Wordle
# This script updates the existing pipeline to use separate Test, Build, and Deploy stages

set -e

# Configuration
ENVIRONMENT="dev"
REGION="us-east-1"
STACK_NAME="${ENVIRONMENT}-hard-wordle-pipeline"
TEMPLATE_FILE="infrastructure/pipeline-stack-multi-stage.yaml"
PARAMS_FILE="infrastructure/parameters/${ENVIRONMENT}-params.json"

echo "🚀 Deploying Multi-Stage Pipeline for Hard Wordle"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Stack: $STACK_NAME"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if parameter file exists
if [ ! -f "$PARAMS_FILE" ]; then
    echo "❌ Parameter file not found: $PARAMS_FILE"
    echo "Creating parameter file..."
    
    # Get existing parameters from current stack
    CODESTAR_ARN=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Parameters[?ParameterKey==`CodeStarConnectionArn`].ParameterValue' \
        --output text 2>/dev/null || echo "")
    
    REPO_ID=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $REGION \
        --query 'Stacks[0].Parameters[?ParameterKey==`RepositoryId`].ParameterValue' \
        --output text 2>/dev/null || echo "TipsyFuddledBoozyGroggy/HardWordle")
    
    if [ -z "$CODESTAR_ARN" ]; then
        echo "❌ Could not retrieve CodeStar connection ARN from existing stack"
        echo "Please create $PARAMS_FILE manually with your CodeStar connection details"
        exit 1
    fi
    
    cat > "$PARAMS_FILE" << EOF
[
  {
    "ParameterKey": "EnvironmentName",
    "ParameterValue": "$ENVIRONMENT"
  },
  {
    "ParameterKey": "CodeStarConnectionArn",
    "ParameterValue": "$CODESTAR_ARN"
  },
  {
    "ParameterKey": "RepositoryId",
    "ParameterValue": "$REPO_ID"
  },
  {
    "ParameterKey": "BranchName",
    "ParameterValue": "main"
  }
]
EOF
    echo "✅ Created parameter file: $PARAMS_FILE"
fi

echo "📋 Using parameters from: $PARAMS_FILE"

# Validate CloudFormation template
echo "🔍 Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://$TEMPLATE_FILE \
    --region $REGION

echo "✅ Template validation successful"

# Check if stack exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $REGION > /dev/null 2>&1; then
    echo "🔄 Updating existing pipeline stack..."
    OPERATION="update-stack"
else
    echo "🆕 Creating new pipeline stack..."
    OPERATION="create-stack"
fi

# Deploy/Update the stack
echo "🚀 Deploying pipeline stack..."
aws cloudformation $OPERATION \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters file://$PARAMS_FILE \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION \
    --tags \
        Key=Environment,Value=$ENVIRONMENT \
        Key=Project,Value=hard-wordle \
        Key=ManagedBy,Value=CloudFormation

echo "⏳ Waiting for stack operation to complete..."
aws cloudformation wait stack-${OPERATION%-stack}-complete \
    --stack-name $STACK_NAME \
    --region $REGION

# Get stack outputs
echo "📊 Pipeline deployment completed successfully!"
echo ""
echo "🔗 Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue,Description]' \
    --output table

echo ""
echo "✅ Multi-Stage Pipeline Deployment Complete!"
echo ""
echo "📋 Pipeline Stages:"
echo "   1. Source    - Pulls code from GitHub"
echo "   2. Test      - Runs Jest tests and coverage"
echo "   3. Build     - Builds Docker container and pushes to ECR"
echo "   4. Deploy    - Deploys to ECS Fargate"
echo ""
echo "🎯 Next Steps:"
echo "   • Push code to trigger the new multi-stage pipeline"
echo "   • Monitor pipeline execution in AWS Console"
echo "   • View detailed logs for each stage separately"
echo ""

# Get pipeline URL
PIPELINE_URL=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`PipelineUrl`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ ! -z "$PIPELINE_URL" ]; then
    echo "🌐 Pipeline Console: $PIPELINE_URL"
fi