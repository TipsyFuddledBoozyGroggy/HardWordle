# Hard Wordle - AWS Infrastructure Deployment Guide

This guide provides comprehensive instructions for deploying the Hard Wordle application to AWS using CloudFormation Infrastructure as Code (IaC).

## 🚀 Quick Start

**New to this project?** Start here:
- [QUICK-START.md](./QUICK-START.md) - 5-minute setup guide
- [CODESTAR-SETUP.md](./CODESTAR-SETUP.md) - Complete CodeStar connection setup

**Migrating from GitHub OAuth?** See [MIGRATION-NOTES.md](./MIGRATION-NOTES.md)

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [AWS Prerequisites](#aws-prerequisites)
- [Required IAM Permissions](#required-iam-permissions)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Updating the Application](#updating-the-application)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)
- [Cost Considerations](#cost-considerations)
- [Cleanup](#cleanup)

## Overview

The Hard Wordle infrastructure consists of four CloudFormation stacks that must be deployed in a specific order:

1. **Network Stack** - VPC, subnets, security groups
2. **ECR Stack** - Docker container registry
3. **ECS Stack** - ECS cluster, service, Application Load Balancer
4. **Pipeline Stack** - CI/CD pipeline with CodePipeline and CodeBuild

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Application Load     │
              │ Balancer (ALB)       │
              └──────────┬───────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────┐           ┌─────────────────┐
│  ECS Task       │           │  ECS Task       │
│  (Fargate)      │           │  (Fargate)      │
│  - Container    │           │  - Container    │
│    Port 80      │           │    Port 80      │
└─────────────────┘           └─────────────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Amazon ECR          │
              │  (Docker Registry)   │
              └──────────────────────┘
                         ▲
                         │
              ┌──────────────────────┐
              │  CodePipeline        │
              │  ┌────────────────┐  │
              │  │ Source (GitHub)│  │
              │  └────────┬───────┘  │
              │           │          │
              │  ┌────────▼───────┐  │
              │  │ Build          │  │
              │  │ (CodeBuild)    │  │
              │  └────────┬───────┘  │
              │           │          │
              │  ┌────────▼───────┐  │
              │  │ Deploy (ECS)   │  │
              │  └────────────────┘  │
              └──────────────────────┘
```

## Prerequisites

### Local Development Tools

- **AWS CLI** (version 2.x or later)
  ```bash
  aws --version
  ```
  Install: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html

- **Git**
  ```bash
  git --version
  ```

- **Bash** (for running deployment scripts)
  - Linux/macOS: Built-in
  - Windows: Use Git Bash or WSL

### AWS Account Setup

1. **AWS Account**: Active AWS account with billing enabled
2. **AWS CLI Configuration**: Configure with your credentials
   ```bash
   aws configure
   ```
   You'll need:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., `us-east-1`)
   - Default output format (e.g., `json`)

3. **Verify AWS CLI Access**:
   ```bash
   aws sts get-caller-identity
   ```

## AWS Prerequisites

### 1. GitHub Personal Access Token

The CI/CD pipeline requires a GitHub personal access token to access your repository.

**Create a GitHub Token:**

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Hard Wordle AWS Pipeline")
4. Select scopes:
   - `repo` (Full control of private repositories)
   - `admin:repo_hook` (Full control of repository hooks)
5. Click "Generate token"
6. **Copy the token immediately** (you won't be able to see it again)

### 2. GitHub Repository

- Push your Hard Wordle code to a GitHub repository
- Note your GitHub username and repository name

### 3. AWS Service Limits

Ensure your AWS account has sufficient service limits:
- VPCs: At least 1 available
- Elastic IPs: At least 2 available
- ECS Fargate tasks: At least 4 vCPUs available
- Application Load Balancers: At least 1 available

Check limits in AWS Console → Service Quotas

## Required IAM Permissions

The AWS user/role deploying the infrastructure needs the following permissions:

### CloudFormation Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:DeleteStack",
        "cloudformation:DescribeStacks",
        "cloudformation:DescribeStackEvents",
        "cloudformation:DescribeStackResources",
        "cloudformation:GetTemplate",
        "cloudformation:ValidateTemplate"
      ],
      "Resource": "*"
    }
  ]
}
```

### Service-Specific Permissions

The deploying user needs permissions to create and manage:

- **EC2**: VPC, Subnets, Internet Gateway, Route Tables, Security Groups
- **ECR**: Repositories, Lifecycle Policies
- **ECS**: Clusters, Task Definitions, Services
- **ELB**: Application Load Balancers, Target Groups, Listeners
- **IAM**: Roles, Policies (with `CAPABILITY_IAM` and `CAPABILITY_NAMED_IAM`)
- **CodePipeline**: Pipelines
- **CodeBuild**: Projects
- **S3**: Buckets (for pipeline artifacts)
- **CloudWatch**: Log Groups
- **Application Auto Scaling**: Scaling Targets, Scaling Policies

### Recommended IAM Policy

For initial deployment, you can use the AWS managed policy:
- `PowerUserAccess` (allows all services except IAM user management)

Plus a custom policy for IAM role creation:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PassRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:GetRolePolicy",
        "iam:TagRole",
        "iam:UntagRole"
      ],
      "Resource": "*"
    }
  ]
}
```

## Configuration

### 1. Update Parameter Files

Edit the parameter files for your environment(s):

**For Development (`infrastructure/parameters/dev-params.json`):**

```json
[
  {
    "ParameterKey": "EnvironmentName",
    "ParameterValue": "dev"
  },
  {
    "ParameterKey": "GitHubOwner",
    "ParameterValue": "YOUR_GITHUB_USERNAME"
  },
  {
    "ParameterKey": "GitHubRepo",
    "ParameterValue": "hard-wordle"
  },
  {
    "ParameterKey": "GitHubBranch",
    "ParameterValue": "main"
  },
  {
    "ParameterKey": "GitHubToken",
    "ParameterValue": "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN"
  }
]
```

**For Production (`infrastructure/parameters/prod-params.json`):**

Update the same fields, plus adjust resource sizing if needed:
- `DesiredCount`: Number of ECS tasks (default: 2)
- `MinTaskCount`: Minimum tasks for auto-scaling (default: 2)
- `MaxTaskCount`: Maximum tasks for auto-scaling (default: 4)
- `ContainerCpu`: CPU units (256, 512, 1024, 2048)
- `ContainerMemory`: Memory in MB (512, 1024, 2048, 4096)

### 2. Update ContainerImage Parameter

After the ECR stack is deployed, you'll need to update the `ContainerImage` parameter with your ECR repository URI.

**Get ECR URI after ECR stack deployment:**
```bash
aws cloudformation describe-stacks \
  --stack-name hard-wordle-ecr-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryUri`].OutputValue' \
  --output text
```

Update the parameter file:
```json
{
  "ParameterKey": "ContainerImage",
  "ParameterValue": "123456789012.dkr.ecr.us-east-1.amazonaws.com/dev-hard-wordle:latest"
}
```

### 3. Environment Variables

Set your AWS region (if not using default):
```bash
export AWS_DEFAULT_REGION=us-east-1
```

## Deployment

### Option 1: Automated Deployment (Recommended)

Use the provided deployment script to deploy all stacks in the correct order:

```bash
# Make the script executable
chmod +x infrastructure/deploy.sh

# Deploy to development environment
./infrastructure/deploy.sh dev

# Deploy to production environment
./infrastructure/deploy.sh prod
```

The script will:
1. Validate parameter files exist
2. Deploy Network Stack and wait for completion
3. Deploy ECR Stack and wait for completion
4. Deploy ECS Stack and wait for completion
5. Deploy Pipeline Stack and wait for completion
6. Display the Application URL and ECR Repository URI

### Option 2: Manual Deployment

Deploy each stack individually in order:

#### Step 1: Deploy Network Stack

```bash
aws cloudformation create-stack \
  --stack-name hard-wordle-network-dev \
  --template-body file://infrastructure/network-stack.yaml \
  --parameters file://infrastructure/parameters/dev-params.json \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name hard-wordle-network-dev \
  --region us-east-1
```

#### Step 2: Deploy ECR Stack

```bash
aws cloudformation create-stack \
  --stack-name hard-wordle-ecr-dev \
  --template-body file://infrastructure/ecr-stack.yaml \
  --parameters file://infrastructure/parameters/dev-params.json \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name hard-wordle-ecr-dev \
  --region us-east-1
```

#### Step 3: Build and Push Initial Docker Image

Before deploying the ECS stack, you need an initial Docker image in ECR:

```bash
# Get ECR repository URI
ECR_URI=$(aws cloudformation describe-stacks \
  --stack-name hard-wordle-ecr-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ECRRepositoryUri`].OutputValue' \
  --output text)

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR_URI

# Build Docker image
docker build -t hard-wordle:latest .

# Tag image for ECR
docker tag hard-wordle:latest $ECR_URI:latest

# Push to ECR
docker push $ECR_URI:latest
```

#### Step 4: Update ContainerImage Parameter

Update `infrastructure/parameters/dev-params.json` with the ECR URI from Step 3.

#### Step 5: Deploy ECS Stack

```bash
aws cloudformation create-stack \
  --stack-name hard-wordle-ecs-dev \
  --template-body file://infrastructure/ecs-stack.yaml \
  --parameters file://infrastructure/parameters/dev-params.json \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for completion (this may take 5-10 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name hard-wordle-ecs-dev \
  --region us-east-1
```

#### Step 6: Deploy Pipeline Stack

```bash
aws cloudformation create-stack \
  --stack-name hard-wordle-pipeline-dev \
  --template-body file://infrastructure/pipeline-stack.yaml \
  --parameters file://infrastructure/parameters/dev-params.json \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name hard-wordle-pipeline-dev \
  --region us-east-1
```

### Verify Deployment

#### 1. Get Application URL

```bash
aws cloudformation describe-stacks \
  --stack-name hard-wordle-ecs-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerUrl`].OutputValue' \
  --output text
```

Visit the URL in your browser to verify the application is running.

#### 2. Check Pipeline Status

```bash
# Get pipeline name
aws cloudformation describe-stacks \
  --stack-name hard-wordle-pipeline-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`PipelineName`].OutputValue' \
  --output text

# Check pipeline execution status
aws codepipeline get-pipeline-state \
  --name dev-hard-wordle-pipeline
```

Or visit the AWS Console → CodePipeline to see the visual pipeline status.

## Updating the Application

### Automatic Updates via CI/CD

Once the pipeline is deployed, updates are automatic:

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Update application"
   git push origin main
   ```

2. **Pipeline automatically triggers**:
   - Source stage: Pulls latest code from GitHub
   - Build stage: Runs tests, builds Docker image, pushes to ECR
   - Deploy stage: Updates ECS service with new image

3. **Monitor pipeline progress**:
   ```bash
   aws codepipeline get-pipeline-state --name dev-hard-wordle-pipeline
   ```

4. **ECS performs rolling update**:
   - New tasks start with updated image
   - Health checks pass
   - Old tasks are drained and stopped
   - Zero-downtime deployment

### Manual Updates

If you need to update the infrastructure (not the application code):

```bash
# Update a specific stack
aws cloudformation update-stack \
  --stack-name hard-wordle-ecs-dev \
  --template-body file://infrastructure/ecs-stack.yaml \
  --parameters file://infrastructure/parameters/dev-params.json \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM

# Wait for update to complete
aws cloudformation wait stack-update-complete \
  --stack-name hard-wordle-ecs-dev
```

Or use the deployment script which handles updates automatically:
```bash
./infrastructure/deploy.sh dev
```

### Force New Deployment (Same Image)

To force ECS to deploy the current image (useful for configuration changes):

```bash
aws ecs update-service \
  --cluster dev-hard-wordle-cluster \
  --service dev-hard-wordle-service \
  --force-new-deployment
```

## Monitoring and Maintenance

### CloudWatch Logs

View application logs:

```bash
# List log streams
aws logs describe-log-streams \
  --log-group-name /ecs/dev-hard-wordle \
  --order-by LastEventTime \
  --descending

# Tail logs (requires log stream name from above)
aws logs tail /ecs/dev-hard-wordle --follow
```

Or use AWS Console → CloudWatch → Log Groups → `/ecs/dev-hard-wordle`

### ECS Service Metrics

Monitor in AWS Console → ECS → Clusters → dev-hard-wordle-cluster → Services → dev-hard-wordle-service

Key metrics:
- CPU Utilization
- Memory Utilization
- Running Task Count
- Desired Task Count

### Application Load Balancer Metrics

Monitor in AWS Console → EC2 → Load Balancers → dev-hard-wordle-alb

Key metrics:
- Request Count
- Target Response Time
- HTTP 4xx/5xx Errors
- Healthy/Unhealthy Target Count

### Auto-Scaling

The ECS service is configured with auto-scaling based on:
- **CPU Utilization**: Target 70%
- **Memory Utilization**: Target 80%

View scaling activities:
```bash
aws application-autoscaling describe-scaling-activities \
  --service-namespace ecs \
  --resource-id service/dev-hard-wordle-cluster/dev-hard-wordle-service
```

### Cost Monitoring

Track costs in AWS Console → Cost Explorer

Filter by tags:
- Project: hard-wordle
- Environment: dev or prod

## Troubleshooting

### Common Issues

#### 1. Stack Creation Fails

**Check stack events:**
```bash
aws cloudformation describe-stack-events \
  --stack-name hard-wordle-network-dev \
  --max-items 20
```

**Common causes:**
- Insufficient IAM permissions
- Service limits exceeded
- Invalid parameter values
- Resource name conflicts

**Solution:**
- Review error messages in stack events
- Fix the issue
- Delete the failed stack: `aws cloudformation delete-stack --stack-name STACK_NAME`
- Retry deployment

#### 2. ECS Tasks Failing to Start

**Check task status:**
```bash
aws ecs describe-tasks \
  --cluster dev-hard-wordle-cluster \
  --tasks $(aws ecs list-tasks --cluster dev-hard-wordle-cluster --query 'taskArns[0]' --output text)
```

**Common causes:**
- Docker image not found in ECR
- Insufficient memory/CPU
- Container fails health checks
- IAM role permissions issues

**Solution:**
- Check CloudWatch logs for container errors
- Verify ECR image exists and is accessible
- Increase task memory/CPU in parameters
- Check task execution role permissions

#### 3. Application Not Accessible

**Check ALB target health:**
```bash
aws elbv2 describe-target-health \
  --target-group-arn $(aws cloudformation describe-stacks \
    --stack-name hard-wordle-ecs-dev \
    --query 'Stacks[0].Outputs[?OutputKey==`TargetGroupArn`].OutputValue' \
    --output text)
```

**Common causes:**
- Targets unhealthy (failing health checks)
- Security group misconfiguration
- Container not listening on port 80

**Solution:**
- Check target health status
- Review security group rules
- Verify container logs for startup errors
- Test health check endpoint: `curl http://ALB_DNS/`

#### 4. Pipeline Build Fails

**Check CodeBuild logs:**
```bash
# Get latest build ID
BUILD_ID=$(aws codebuild list-builds-for-project \
  --project-name dev-hard-wordle-build \
  --query 'ids[0]' \
  --output text)

# Get build logs
aws codebuild batch-get-builds --ids $BUILD_ID
```

**Common causes:**
- Tests failing
- Docker build errors
- ECR push permission issues
- buildspec.yml syntax errors

**Solution:**
- Review build logs in CloudWatch
- Run tests locally: `npm test`
- Build Docker image locally to reproduce errors
- Verify CodeBuild IAM role has ECR push permissions

#### 5. GitHub Connection Issues

**Symptoms:**
- Pipeline source stage fails
- "Unable to access repository" errors

**Solution:**
- Verify GitHub token is valid and has correct scopes
- Check token hasn't expired
- Update token in parameter file and update pipeline stack
- Ensure repository is accessible (not deleted/renamed)

#### 6. Stack Update Shows "No Updates"

**Cause:** No changes detected in template or parameters

**Solution:**
- This is normal if nothing changed
- If you need to force an update, make a minor change (e.g., add a tag)

### Debugging Commands

**View all stack resources:**
```bash
aws cloudformation describe-stack-resources \
  --stack-name hard-wordle-ecs-dev
```

**Get stack outputs:**
```bash
aws cloudformation describe-stacks \
  --stack-name hard-wordle-ecs-dev \
  --query 'Stacks[0].Outputs'
```

**List ECS tasks:**
```bash
aws ecs list-tasks --cluster dev-hard-wordle-cluster
```

**Describe ECS service:**
```bash
aws ecs describe-services \
  --cluster dev-hard-wordle-cluster \
  --services dev-hard-wordle-service
```

**View recent pipeline executions:**
```bash
aws codepipeline list-pipeline-executions \
  --pipeline-name dev-hard-wordle-pipeline \
  --max-results 5
```

## Cost Considerations

### Estimated Monthly Costs (Development Environment)

- **ECS Fargate** (1 task, 0.25 vCPU, 0.5 GB): ~$10-15/month
- **Application Load Balancer**: ~$16-20/month
- **ECR Storage** (< 1 GB): ~$0.10/month
- **Data Transfer**: ~$1-5/month (varies with traffic)
- **CloudWatch Logs** (7-day retention): ~$0.50/month
- **S3 (Pipeline Artifacts)**: ~$0.10/month

**Total Development**: ~$28-40/month

### Estimated Monthly Costs (Production Environment)

- **ECS Fargate** (2-4 tasks, 0.5 vCPU, 1 GB): ~$40-80/month
- **Application Load Balancer**: ~$16-20/month
- **ECR Storage**: ~$0.10/month
- **Data Transfer**: ~$5-20/month (varies with traffic)
- **CloudWatch Logs**: ~$1-2/month
- **S3**: ~$0.10/month

**Total Production**: ~$62-122/month

### Cost Optimization Tips

1. **Use Fargate Spot** for non-critical workloads (up to 70% savings)
2. **Reduce task count** during off-hours using scheduled scaling
3. **Enable S3 lifecycle policies** to delete old artifacts
4. **Reduce log retention** to 3-7 days
5. **Use CloudWatch Logs Insights** instead of exporting logs
6. **Delete unused ECR images** regularly
7. **Consider CloudFront** for static content caching (reduces ALB costs)

## Cleanup

### Delete All Resources

To avoid ongoing charges, delete all stacks in reverse order:

```bash
# Delete Pipeline Stack
aws cloudformation delete-stack --stack-name hard-wordle-pipeline-dev
aws cloudformation wait stack-delete-complete --stack-name hard-wordle-pipeline-dev

# Delete ECS Stack
aws cloudformation delete-stack --stack-name hard-wordle-ecs-dev
aws cloudformation wait stack-delete-complete --stack-name hard-wordle-ecs-dev

# Delete ECR Stack (this will delete all Docker images)
aws cloudformation delete-stack --stack-name hard-wordle-ecr-dev
aws cloudformation wait stack-delete-complete --stack-name hard-wordle-ecr-dev

# Delete Network Stack
aws cloudformation delete-stack --stack-name hard-wordle-network-dev
aws cloudformation wait stack-delete-complete --stack-name hard-wordle-network-dev
```

### Manual Cleanup

Some resources may need manual deletion:

1. **S3 Artifact Bucket**: Empty and delete manually
   ```bash
   # List buckets
   aws s3 ls | grep hard-wordle
   
   # Empty bucket
   aws s3 rm s3://dev-hard-wordle-pipeline-artifacts-ACCOUNT_ID --recursive
   
   # Delete bucket
   aws s3 rb s3://dev-hard-wordle-pipeline-artifacts-ACCOUNT_ID
   ```

2. **CloudWatch Log Groups**: Delete if not automatically removed
   ```bash
   aws logs delete-log-group --log-group-name /ecs/dev-hard-wordle
   aws logs delete-log-group --log-group-name /aws/codebuild/dev-hard-wordle-build
   ```

3. **ECR Images**: Delete manually if ECR stack deletion fails
   ```bash
   # List images
   aws ecr list-images --repository-name dev-hard-wordle
   
   # Delete all images
   aws ecr batch-delete-image \
     --repository-name dev-hard-wordle \
     --image-ids imageTag=latest
   ```

## Additional Resources

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS Fargate Pricing](https://aws.amazon.com/fargate/pricing/)
- [Docker Documentation](https://docs.docker.com/)

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review CloudWatch logs for error messages
3. Check AWS CloudFormation stack events
4. Review the main project README.md

---

**Last Updated**: December 2024
