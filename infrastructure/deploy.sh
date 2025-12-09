#!/bin/bash

# Hard Wordle Infrastructure Deployment Script
# This script deploys CloudFormation stacks in the correct order

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
REGION=${AWS_DEFAULT_REGION:-us-east-1}
PARAMS_FILE="infrastructure/parameters/${ENVIRONMENT}-params.json"

# Stack names
NETWORK_STACK="hard-wordle-network-${ENVIRONMENT}"
ECR_STACK="hard-wordle-ecr-${ENVIRONMENT}"
ECS_STACK="hard-wordle-ecs-${ENVIRONMENT}"
PIPELINE_STACK="hard-wordle-pipeline-${ENVIRONMENT}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Hard Wordle Infrastructure Deployment${NC}"
echo -e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}Region: ${REGION}${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if parameters file exists
if [ ! -f "$PARAMS_FILE" ]; then
    echo -e "${RED}Error: Parameters file not found: ${PARAMS_FILE}${NC}"
    exit 1
fi

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
    
    echo -e "${YELLOW}Deploying ${stack_name}...${NC}"
    
    # Check if stack exists
    if aws cloudformation describe-stacks --stack-name ${stack_name} --region ${REGION} >/dev/null 2>&1; then
        echo -e "${YELLOW}Stack exists, updating...${NC}"
        
        aws cloudformation update-stack \
            --stack-name ${stack_name} \
            --template-body file://${template_file} \
            --parameters file://${PARAMS_FILE} \
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
            --parameters file://${PARAMS_FILE} \
            --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
            --region ${REGION}
        
        wait_for_stack ${stack_name} "create"
    fi
}

# Deploy stacks in order
echo -e "${GREEN}Step 1: Deploying Network Stack${NC}"
deploy_stack ${NETWORK_STACK} "infrastructure/network-stack.yaml"

echo -e "${GREEN}Step 2: Deploying ECR Stack${NC}"
deploy_stack ${ECR_STACK} "infrastructure/ecr-stack.yaml"

echo -e "${GREEN}Step 3: Deploying ECS Stack${NC}"
deploy_stack ${ECS_STACK} "infrastructure/ecs-stack.yaml"

echo -e "${GREEN}Step 4: Deploying Pipeline Stack${NC}"
deploy_stack ${PIPELINE_STACK} "infrastructure/pipeline-stack.yaml"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"

# Output important information
echo -e "${YELLOW}Retrieving stack outputs...${NC}"

ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name ${ECS_STACK} \
    --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
    --output text \
    --region ${REGION})

if [ ! -z "$ALB_DNS" ]; then
    echo -e "${GREEN}Application URL: http://${ALB_DNS}${NC}"
fi

ECR_URI=$(aws cloudformation describe-stacks \
    --stack-name ${ECR_STACK} \
    --query 'Stacks[0].Outputs[?OutputKey==`RepositoryUri`].OutputValue' \
    --output text \
    --region ${REGION})

if [ ! -z "$ECR_URI" ]; then
    echo -e "${GREEN}ECR Repository: ${ECR_URI}${NC}"
fi

echo -e "${GREEN}========================================${NC}"
