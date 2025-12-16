# CodeStar Connection Setup Guide

This guide will help you set up the CodeStar connection between AWS and GitHub for your Hard Wordle CI/CD pipeline.

## Prerequisites

- AWS CLI configured with appropriate permissions
- GitHub repository created: `TipsyFuddledBoozyGroggy/hard-wordle`
- Your code pushed to the GitHub repository

## Step 1: Create CodeStar Connection

Since your current IAM user doesn't have CodeStar permissions, you'll need to create the connection through the AWS Console:

### Using AWS Console:

1. **Navigate to CodePipeline**:
   - Go to [AWS Console](https://console.aws.amazon.com)
   - Search for "CodePipeline" and click on it

2. **Access Connections**:
   - In the left sidebar, click "Settings" → "Connections"

3. **Create Connection**:
   - Click "Create connection"
   - Select "GitHub" as the provider
   - Connection name: `hard-wordle-github-connection`
   - Click "Connect to GitHub"

4. **Authorize GitHub**:
   - You'll be redirected to GitHub
   - Click "Authorize AWS Connector for GitHub"
   - Select your GitHub account if prompted

5. **Complete Connection**:
   - Back in AWS Console, click "Connect"
   - **IMPORTANT**: Copy the Connection ARN (looks like: `arn:aws:codestar-connections:us-east-1:864899864715:connection/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## Step 2: Update Parameter Files

Run the helper script with your connection ARN:

```bash
./infrastructure/update-codestar-connection.sh "arn:aws:codestar-connections:us-east-1:864899864715:connection/YOUR-CONNECTION-ID"
```

## Step 3: Verify Configuration

Check that your parameter files have been updated:

```bash
# Check dev parameters
grep -A 1 "CodeStarConnectionArn" infrastructure/parameters/dev-params.json

# Check prod parameters  
grep -A 1 "CodeStarConnectionArn" infrastructure/parameters/prod-params.json
```

## Step 4: Deploy Infrastructure

Deploy your infrastructure stacks:

```bash
# Deploy development environment
./infrastructure/deploy.sh dev

# Or deploy production environment
./infrastructure/deploy.sh prod
```

## Repository Information

- **Repository**: `TipsyFuddledBoozyGroggy/hard-wordle`
- **Branch**: `main`
- **GitHub URL**: https://github.com/TipsyFuddledBoozyGroggy/hard-wordle

## Troubleshooting

### Connection Status Issues

If your connection shows as "Pending" or "Available":
- **Pending**: The connection is being set up
- **Available**: Ready to use
- **Error**: Check GitHub authorization

### Pipeline Failures

If the pipeline fails to start:
1. Verify the connection ARN is correct
2. Check that the repository exists and is accessible
3. Ensure the branch name matches (default: `main`)

### Permission Issues

If you get permission errors:
1. Your IAM user needs additional CodeStar permissions
2. Contact your AWS administrator to add these policies:
   - `AWSCodeStarFullAccess` or
   - Custom policy with `codestar-connections:*` permissions

## Next Steps

After successful setup:
1. Push code to your GitHub repository
2. The pipeline will automatically trigger
3. Monitor the pipeline in AWS CodePipeline console
4. Access your deployed application via the ALB DNS name

## Support

For issues with this setup:
1. Check AWS CloudFormation stack events
2. Review CodePipeline execution details
3. Check CodeBuild logs for build failures