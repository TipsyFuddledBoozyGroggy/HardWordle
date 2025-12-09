# Deployment Checklist

Use this checklist to ensure you have everything ready for deployment.

## Pre-Deployment Checklist

### ☐ Git Repository Setup

- [ ] Code is pushed to your Git repository (GitHub, GitLab, or Bitbucket)
- [ ] You know your repository owner/username
- [ ] You know your repository name
- [ ] You know which branch to deploy from (usually `main`)

**Get this info:**
```bash
git remote -v
git branch --show-current
```

### ☐ AWS Account Setup

- [ ] AWS account created and accessible
- [ ] AWS CLI installed and configured
- [ ] You have appropriate IAM permissions (see main README.md)
- [ ] You've chosen your AWS region (e.g., `us-east-1`)

**Verify:**
```bash
aws --version
aws sts get-caller-identity
```

### ☐ CodeStar Connection Created

- [ ] Created CodeStar connection in AWS Console
- [ ] Connection status is "Available" (not "Pending")
- [ ] Connection ARN copied and saved
- [ ] Connection has access to your repository

**Connection ARN format:**
```
arn:aws:codestar-connections:us-east-1:123456789012:connection/abc123def456...
```

**Create at:** https://console.aws.amazon.com/codesuite/settings/connections

### ☐ Parameter Files Updated

- [ ] Opened `infrastructure/parameters/dev-params.json`
- [ ] Updated `CodeStarConnectionArn` with your connection ARN
- [ ] Updated `RepositoryId` with `owner/repo-name` format
- [ ] Updated `BranchName` if not using `main`
- [ ] Verified all other parameters (VPC CIDR, container settings, etc.)

**Example:**
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

### ☐ Local Testing

- [ ] Application builds locally: `npm run build`
- [ ] Tests pass locally: `npm test`
- [ ] Docker image builds: `docker build -t hard-wordle .`
- [ ] Docker container runs: `docker run -p 80:80 hard-wordle`

## Deployment Checklist

### ☐ Deploy Infrastructure

- [ ] Navigate to infrastructure directory: `cd infrastructure`
- [ ] Run deployment script: `./deploy.sh dev`
- [ ] Wait for all stacks to complete (15-20 minutes)
- [ ] No errors in CloudFormation console

**Monitor:**
```bash
# Watch stack progress
aws cloudformation describe-stacks --stack-name hard-wordle-pipeline-dev
```

### ☐ Verify Deployment

- [ ] All 4 stacks show "CREATE_COMPLETE" or "UPDATE_COMPLETE"
  - [ ] `hard-wordle-network-dev`
  - [ ] `hard-wordle-ecr-dev`
  - [ ] `hard-wordle-ecs-dev`
  - [ ] `hard-wordle-pipeline-dev`

**Check:**
```bash
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE
```

### ☐ Pipeline Verification

- [ ] Pipeline exists in CodePipeline console
- [ ] Pipeline has 3 stages: Source, Build, Deploy
- [ ] Source stage shows your repository connection
- [ ] Pipeline is not in "Failed" state

**View:**
```bash
aws codepipeline get-pipeline-state --name dev-hard-wordle-pipeline
```

## Post-Deployment Checklist

### ☐ Test Pipeline Trigger

- [ ] Make a small change to code
- [ ] Commit and push to your branch
- [ ] Pipeline automatically triggers (within 1 minute)
- [ ] Source stage completes successfully
- [ ] Build stage runs tests and builds image
- [ ] Deploy stage updates ECS service

**Test:**
```bash
echo "# Pipeline test" >> README.md
git add README.md
git commit -m "Test pipeline trigger"
git push origin main
```

### ☐ Application Access

- [ ] Retrieved Load Balancer URL
- [ ] Application accessible via browser
- [ ] Game loads and functions correctly
- [ ] No console errors in browser

**Get URL:**
```bash
aws cloudformation describe-stacks \
  --stack-name hard-wordle-ecs-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
  --output text
```

### ☐ Monitoring Setup

- [ ] CloudWatch logs accessible
- [ ] ECS service shows healthy tasks
- [ ] ALB target group shows healthy targets
- [ ] No errors in CodeBuild logs

**Check Health:**
```bash
# ECS service status
aws ecs describe-services \
  --cluster dev-hard-wordle-cluster \
  --services dev-hard-wordle-service

# View logs
aws logs tail /aws/codebuild/dev-hard-wordle-build --follow
```

## Production Deployment Checklist

If deploying to production, repeat the above with these changes:

- [ ] Update `infrastructure/parameters/prod-params.json`
- [ ] Use production branch (if different)
- [ ] Run `./deploy.sh prod`
- [ ] Verify production stacks
- [ ] Test production pipeline
- [ ] Access production application

## Troubleshooting

If anything fails, see:
- [CODESTAR-SETUP.md](./CODESTAR-SETUP.md) - Troubleshooting section
- [README.md](./README.md) - Main troubleshooting guide
- CloudFormation console - Stack events for error details
- CodeBuild logs - Build failure details

## Common Issues

### Connection Status "Pending"
→ Go to AWS Console → CodeStar Connections → Update pending connection

### Pipeline Not Triggering
→ Verify RepositoryId format: `owner/repo-name` (case-sensitive)
→ Check branch name matches exactly
→ Ensure connection status is "Available"

### Build Fails
→ Run tests locally first: `npm test`
→ Check CodeBuild logs for specific errors
→ Verify buildspec.yml is correct

### Deployment Fails
→ Check ECS task logs in CloudWatch
→ Verify ECR image was pushed successfully
→ Check ECS service events for errors

## Success Criteria

✅ All stacks deployed successfully
✅ Pipeline triggers on code push
✅ Tests pass in CodeBuild
✅ Application accessible via Load Balancer
✅ Game functions correctly
✅ No errors in logs

## Next Steps

- [ ] Set up custom domain (Route 53)
- [ ] Configure HTTPS (ACM certificate)
- [ ] Set up CloudWatch alarms
- [ ] Configure auto-scaling policies
- [ ] Set up backup/disaster recovery
- [ ] Document runbooks for operations team

---

**Need Help?**
- See [CODESTAR-SETUP.md](./CODESTAR-SETUP.md) for detailed setup
- See [QUICK-START.md](./QUICK-START.md) for quick reference
- Check AWS CloudFormation console for stack events
- Review CodePipeline console for pipeline status
