#!/bin/bash

# Hard Wordle FREE TIER ONLY Infrastructure Deployment Script
# This script deploys ONLY free tier resources - NO COSTS!

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
REGION=${AWS_DEFAULT_REGION:-us-east-1}
NETWORK_PARAMS="infrastructure/parameters/network-params.json"
ECR_PARAMS="infrastructure/parameters/ecr-params.json"
WEBSITE_PARAMS="infrastructure/parameters/website-params.json"
PIPELINE_PARAMS="infrastructure/parameters/free-tier-dev-params.json"

# Stack names
NETWORK_STACK="hard-wordle-network-${ENVIRONMENT}"
ECR_STACK="hard-wordle-ecr-${ENVIRONMENT}"
WEBSITE_STACK="hard-wordle-website-${ENVIRONMENT}"
PIPELINE_STACK="hard-wordle-pipeline-${ENVIRONMENT}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Hard Wordle FREE TIER Infrastructure${NC}"
echo -e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}Region: ${REGION}${NC}"
echo -e "${BLUE}💰 COST: $0.00 (100% Free Tier)${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if parameters files exist
for params_file in "$NETWORK_PARAMS" "$ECR_PARAMS" "$WEBSITE_PARAMS" "$PIPELINE_PARAMS"; do
    if [ ! -f "$params_file" ]; then
        echo -e "${RED}Error: Parameters file not found: ${params_file}${NC}"
        exit 1
    fi
done

# Function to wait for stack completion
wait_for_stack() {
    local stack_name=$1
    local operation=$2
    
    echo -e "${YELLOW}Waiting for ${stack_name} to complete ${operation}...${NC}"
    
    aws cloudformation wait stack-${operation}-complete \
        --stack-name ${stack_name} \
        --region ${REGION}
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ ${stack_name} ${operation} completed successfully${NC}"
    else
        echo -e "${RED}✗ ${stack_name} ${operation} failed${NC}"
        exit 1
    fi
}

# Function to deploy a stack
deploy_stack() {
    local stack_name=$1
    local template_file=$2
    local params_file=$3
    
    echo -e "${YELLOW}Deploying ${stack_name}...${NC}"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name ${stack_name} --region ${REGION} >/dev/null 2>&1; then
        echo -e "${YELLOW}Stack exists, updating...${NC}"
        
        aws cloudformation update-stack \
            --stack-name ${stack_name} \
            --template-body file://${template_file} \
            --parameters file://${params_file} \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
            --region ${REGION}
        
        if [ $? -eq 0 ]; then
            wait_for_stack ${stack_name} "update"
        else
            echo -e "${YELLOW}No updates to be performed on ${stack_name}${NC}"
        fi
    else
        echo -e "${YELLOW}Stack does not exist, creating...${NC}"
        
        aws cloudformation create-stack \
            --stack-name ${stack_name} \
            --template-body file://${template_file} \
            --parameters file://${params_file} \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
            --region ${REGION}
        
        wait_for_stack ${stack_name} "create"
    fi
}

# Deploy stacks in order (FREE TIER ONLY)
echo -e "${GREEN}Step 1: Deploying Network Stack (FREE)${NC}"
deploy_stack ${NETWORK_STACK} "infrastructure/network-stack.yaml" ${NETWORK_PARAMS}

echo -e "${GREEN}Step 2: Deploying ECR Stack (FREE - 500MB)${NC}"
deploy_stack ${ECR_STACK} "infrastructure/ecr-stack.yaml" ${ECR_PARAMS}

echo -e "${GREEN}Step 3: Deploying S3 Website Stack (FREE - 5GB)${NC}"
deploy_stack ${WEBSITE_STACK} "infrastructure/free-tier-ecs-stack.yaml" ${WEBSITE_PARAMS}

echo -e "${GREEN}Step 4: Deploying Pipeline Stack (FREE - 1 pipeline, 100 minutes)${NC}"
deploy_stack ${PIPELINE_STACK} "infrastructure/free-tier-pipeline-stack.yaml" ${PIPELINE_PARAMS}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}FREE TIER Deployment completed!${NC}"
echo -e "${BLUE}💰 Total Cost: $0.00${NC}"
echo -e "${GREEN}========================================${NC}"

# Output important information
echo -e "${YELLOW}Retrieving stack outputs...${NC}"

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name ${WEBSITE_STACK} \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteURL`].OutputValue' \
    --output text \
    --region ${REGION})

if [ ! -z "$WEBSITE_URL" ]; then
    echo -e "${GREEN}🌐 Website URL: ${WEBSITE_URL}${NC}"
fi

ECR_URI=$(aws cloudformation describe-stacks \
    --stack-name ${ECR_STACK} \
    --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryUri`].OutputValue' \
    --output text \
    --region ${REGION})

if [ ! -z "$ECR_URI" ]; then
    echo -e "${GREEN}📦 ECR Repository: ${ECR_URI}${NC}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}Free Tier Limits:${NC}"
echo -e "${BLUE}• S3: 5 GB storage, 20K GET, 2K PUT requests/month${NC}"
echo -e "${BLUE}• ECR: 500 MB storage for 12 months${NC}"
echo -e "${BLUE}• CodePipeline: 1 active pipeline/month${NC}"
echo -e "${BLUE}• CodeBuild: 100 build minutes/month${NC}"
echo -e "${BLUE}• CloudWatch Logs: 5 GB ingestion/month${NC}"
echo -e "${GREEN}========================================${NC}"