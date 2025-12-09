# Quick Start Guide - CodeStar Connection Setup

## TL;DR - What You Need

1. **CodeStar Connection ARN** from AWS Console
2. **Repository ID** in format `owner/repo-name`
3. **Branch Name** (usually `main`)

## 5-Minute Setup

### 1. Get Your Git Info

```bash
git remote -v
# Example output: https://github.com/myusername/hard-wordle.git
# Repository ID: myusername/hard-wordle
```

### 2. Create CodeStar Connection

Go to: https://console.aws.amazon.com/codesuite/settings/connections

- Click "Create connection"
- Choose your Git provider (GitHub/GitLab/Bitbucket)
- Name it: `hard-wordle-connection`
- Authorize AWS to access your repos
- Copy the Connection ARN (looks like `arn:aws:codestar-connections:us-east-1:123456789012:connection/abc123...`)

### 3. Update Parameters

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

### 4. Deploy

```bash
cd infrastructure
./deploy.sh dev
```

### 5. Test

```bash
# Push a change
git commit -am "Test pipeline"
git push

# Watch it deploy automatically!
```

## What This Does

- Connects AWS CodePipeline to your Git repository
- Automatically triggers builds when you push code
- Runs tests, builds Docker image, deploys to ECS
- No more manual deployments!

## Need More Details?

See [CODESTAR-SETUP.md](./CODESTAR-SETUP.md) for complete instructions and troubleshooting.
