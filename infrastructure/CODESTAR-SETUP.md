# AWS CodeStar Connection Setup Guide

This guide walks you through setting up AWS CodeStar Connections to automatically trigger your CI/CD pipeline when you push to your Git repository.

## Prerequisites

- AWS Account with appropriate permissions
- Git repository (GitHub, GitLab, or Bitbucket)
- AWS CLI configured
- Repository pushed to your Git provider

## Step 1: Get Your Repository Information

Run these commands in your local repository:

```bash
# Get the remote URL
git remote -v

# Get current branch
git branch --show-current
```

From the remote URL, extract:
- **Repository Owner**: Your username or organization (e.g., `myusername`)
- **Repository Name**: The repo name (e.g., `hard-wordle`)
- **Full Repository ID**: Format as `owner/repo-name` (e.g., `myusername/hard-wordle`)

Example:
```
Remote URL: https://github.com/myusername/hard-wordle.git
Owner: myusername
Repo: hard-wordle
Full Repository ID: myusername/hard-wordle
```

## Step 2: Create CodeStar Connection in AWS Console

### Option A: Using AWS Console (Recommended)

1. **Navigate to CodeStar Connections**:
   - Go to AWS Console → Developer Tools → CodePipeline → Settings → Connections
   - Direct link: https://console.aws.amazon.com/codesuite/settings/connections

2. **Create Connection**:
   - Click "Create connection"
   - Select your provider:
     - GitHub
     - GitLab
     - Bitbucket
   - Connection name: `hard-wordle-connection` (or your preferred name)
   - Click "Connect to [Provider]"

3. **Authorize AWS**:
   - You'll be redirected to your Git provider
   - Sign in if needed
   - Click "Authorize AWS Connector for [Provider]"
   - Select which repositories to grant access:
     - "All repositories" (easier)
     - "Only select repositories" (more secure - select your hard-wordle repo)
   - Click "Install" or "Authorize"

4. **Complete Connection**:
   - You'll be redirected back to AWS Console
   - Connection status should show "Available"
   - **Copy the Connection ARN** - it looks like:
     ```
     arn:aws:codestar-connections:us-east-1:123456789012:connection/abc123def456...
     ```

### Option B: Using AWS CLI

```bash
# Create the connection (this creates a pending connection)
aws codestar-connections create-connection \
  --provider-type GitHub \
  --connection-name hard-wordle-connection

# Note the ConnectionArn from the output
# You must complete the handshake in the AWS Console
# Go to: https://console.aws.amazon.com/codesuite/settings/connections
# Find your connection and click "Update pending connection"
# Follow the authorization flow
```

## Step 3: Update Parameter Files

Update the parameter files with your information:

### For Development Environment

Edit `infrastructure/parameters/dev-params.json`:

```json
{
  "ParameterKey": "CodeStarConnectionArn",
  "ParameterValue": "arn:aws:codestar-connections:us-east-1:123456789012:connection/abc123..."
},
{
  "ParameterKey": "RepositoryId",
  "ParameterValue": "myusername/hard-wordle"
},
{
  "ParameterKey": "BranchName",
  "ParameterValue": "main"
}
```

### For Production Environment

Edit `infrastructure/parameters/prod-params.json`:

```json
{
  "ParameterKey": "CodeStarConnectionArn",
  "ParameterValue": "arn:aws:codestar-connections:us-east-1:123456789012:connection/abc123..."
},
{
  "ParameterKey": "RepositoryId",
  "ParameterValue": "myusername/hard-wordle"
},
{
  "ParameterKey": "BranchName",
  "ParameterValue": "main"
}
```

## Step 4: Deploy the Infrastructure

### Deploy All Stacks

```bash
cd infrastructure

# For development environment
./deploy.sh dev

# For production environment
./deploy.sh prod
```

The deploy script will create stacks in this order:
1. Network stack (VPC, subnets, security groups)
2. ECR stack (container registry)
3. ECS stack (cluster, service, load balancer)
4. Pipeline stack (CI/CD pipeline with CodeStar connection)

### Deploy Only the Pipeline Stack

If you've already deployed the other stacks and only need to update the pipeline:

```bash
# Development
aws cloudformation deploy \
  --template-file pipeline-stack.yaml \
  --stack-name hard-wordle-pipeline-dev \
  --parameter-overrides file://parameters/dev-params.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Production
aws cloudformation deploy \
  --template-file pipeline-stack.yaml \
  --stack-name hard-wordle-pipeline-prod \
  --parameter-overrides file://parameters/prod-params.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Step 5: Verify the Setup

### Check Pipeline Status

```bash
# Get pipeline name
aws cloudformation describe-stacks \
  --stack-name hard-wordle-pipeline-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`PipelineName`].OutputValue' \
  --output text

# Check pipeline status
aws codepipeline get-pipeline-state \
  --name dev-hard-wordle-pipeline
```

### View in AWS Console

1. Go to AWS Console → CodePipeline
2. Find your pipeline: `dev-hard-wordle-pipeline` or `prod-hard-wordle-pipeline`
3. You should see the pipeline with three stages:
   - Source (connected to your Git repo)
   - Build (CodeBuild project)
   - Deploy (ECS deployment)

## Step 6: Test the Pipeline

### Trigger a Build

Push a change to your repository:

```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "Test pipeline trigger"
git push origin main
```

The pipeline should automatically:
1. Detect the change (within ~1 minute)
2. Pull the source code
3. Run tests via CodeBuild
4. Build Docker image
5. Push to ECR
6. Deploy to ECS

### Monitor the Pipeline

```bash
# Watch pipeline execution
aws codepipeline get-pipeline-state \
  --name dev-hard-wordle-pipeline

# View CodeBuild logs
aws logs tail /aws/codebuild/dev-hard-wordle-build --follow
```

Or view in AWS Console:
- CodePipeline: https://console.aws.amazon.com/codesuite/codepipeline/pipelines
- CodeBuild: https://console.aws.amazon.com/codesuite/codebuild/projects

## Step 7: Access Your Application

After successful deployment:

```bash
# Get the load balancer URL
aws cloudformation describe-stacks \
  --stack-name hard-wordle-ecs-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text
```

Open the URL in your browser to access Hard Wordle!

## Troubleshooting

### Connection Status is "Pending"

- Go to AWS Console → CodeStar Connections
- Click "Update pending connection"
- Complete the authorization flow with your Git provider

### Pipeline Not Triggering on Push

1. **Check Connection Status**:
   ```bash
   aws codestar-connections get-connection \
     --connection-arn YOUR_CONNECTION_ARN
   ```
   Status should be "AVAILABLE"

2. **Verify Repository ID Format**:
   - Must be `owner/repo-name` (case-sensitive)
   - No spaces, no `.git` extension

3. **Check Branch Name**:
   - Ensure branch name matches exactly (case-sensitive)
   - Common: `main` vs `master`

4. **Verify Webhook**:
   - CodeStar automatically creates webhooks
   - Check your Git provider's webhook settings
   - Should see AWS webhook pointing to CodePipeline

### Build Fails

1. **Check CodeBuild Logs**:
   ```bash
   aws logs tail /aws/codebuild/dev-hard-wordle-build --follow
   ```

2. **Common Issues**:
   - Tests failing: Fix tests locally first
   - ECR permissions: Check CodeBuild IAM role
   - Missing dependencies: Verify `package.json`

### Deployment Fails

1. **Check ECS Service**:
   ```bash
   aws ecs describe-services \
     --cluster dev-hard-wordle-cluster \
     --services dev-hard-wordle-service
   ```

2. **Check Task Logs**:
   - Go to ECS Console → Clusters → Tasks
   - Click on failed task → Logs tab

3. **Common Issues**:
   - Image pull errors: Check ECR permissions
   - Health check failures: Verify nginx configuration
   - Resource limits: Check CPU/memory allocation

## Security Best Practices

1. **Least Privilege**: Grant CodeStar connection access only to required repositories
2. **Separate Connections**: Use different connections for dev and prod if needed
3. **Monitor Access**: Regularly review connection access in your Git provider
4. **Rotate Credentials**: If using CLI, rotate AWS credentials regularly
5. **Branch Protection**: Enable branch protection rules in your Git provider

## Additional Resources

- [AWS CodeStar Connections Documentation](https://docs.aws.amazon.com/codepipeline/latest/userguide/connections.html)
- [CodePipeline with GitHub](https://docs.aws.amazon.com/codepipeline/latest/userguide/connections-github.html)
- [Troubleshooting CodeStar Connections](https://docs.aws.amazon.com/dtconsole/latest/userguide/troubleshooting-connections.html)

## Summary

You've now configured:
- ✅ CodeStar Connection to your Git repository
- ✅ Automated CI/CD pipeline
- ✅ Automatic deployments on every push
- ✅ Full infrastructure as code

Every time you push to your repository, the pipeline will automatically build, test, and deploy your application to AWS!
