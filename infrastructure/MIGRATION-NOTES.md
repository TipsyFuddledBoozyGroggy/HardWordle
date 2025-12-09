# Migration from GitHub OAuth to CodeStar Connections

## What Changed

The pipeline has been updated to use **AWS CodeStar Connections** instead of the deprecated GitHub OAuth token method.

### Benefits of CodeStar Connections

1. **More Secure**: No need to store personal access tokens
2. **Better Integration**: Native AWS service with proper IAM controls
3. **Multi-Provider**: Works with GitHub, GitLab, and Bitbucket
4. **Automatic Webhooks**: AWS manages webhooks automatically
5. **Future-Proof**: Recommended by AWS, OAuth method is deprecated

## Changes Made

### CloudFormation Template (`pipeline-stack.yaml`)

**Old Parameters:**
```yaml
GitHubOwner: String
GitHubRepo: String
GitHubBranch: String
GitHubToken: String (NoEcho)
```

**New Parameters:**
```yaml
CodeStarConnectionArn: String
RepositoryId: String (format: owner/repo-name)
BranchName: String
```

**Old Source Stage:**
```yaml
ActionTypeId:
  Category: Source
  Owner: ThirdParty
  Provider: GitHub
  Version: '1'
Configuration:
  Owner: !Ref GitHubOwner
  Repo: !Ref GitHubRepo
  Branch: !Ref GitHubBranch
  OAuthToken: !Ref GitHubToken
  PollForSourceChanges: true
```

**New Source Stage:**
```yaml
ActionTypeId:
  Category: Source
  Owner: AWS
  Provider: CodeStarSourceConnection
  Version: '1'
Configuration:
  ConnectionArn: !Ref CodeStarConnectionArn
  FullRepositoryId: !Ref RepositoryId
  BranchName: !Ref BranchName
  OutputArtifactFormat: CODE_ZIP
  DetectChanges: true
```

### Parameter Files

**Old Format:**
```json
{
  "ParameterKey": "GitHubOwner",
  "ParameterValue": "username"
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
  "ParameterValue": "ghp_token..."
}
```

**New Format:**
```json
{
  "ParameterKey": "CodeStarConnectionArn",
  "ParameterValue": "arn:aws:codestar-connections:region:account:connection/id"
},
{
  "ParameterKey": "RepositoryId",
  "ParameterValue": "username/hard-wordle"
},
{
  "ParameterKey": "BranchName",
  "ParameterValue": "main"
}
```

## Migration Steps

### If You Have an Existing Pipeline

1. **Create CodeStar Connection** (see CODESTAR-SETUP.md)
2. **Update Parameter Files** with new format
3. **Update the Stack**:
   ```bash
   cd infrastructure
   aws cloudformation update-stack \
     --stack-name hard-wordle-pipeline-dev \
     --template-body file://pipeline-stack.yaml \
     --parameters file://parameters/dev-params.json \
     --capabilities CAPABILITY_NAMED_IAM
   ```
4. **Verify**: Push a change and confirm pipeline triggers

### For New Deployments

Just follow the [QUICK-START.md](./QUICK-START.md) guide.

## Rollback (If Needed)

If you need to rollback to the old OAuth method:

```bash
git revert <commit-hash>
# Update parameter files with GitHub token
./deploy.sh dev
```

Note: GitHub OAuth integration is deprecated and may stop working in the future.

## Troubleshooting

### Pipeline Not Triggering

1. Check connection status is "Available":
   ```bash
   aws codestar-connections get-connection --connection-arn YOUR_ARN
   ```

2. Verify RepositoryId format: `owner/repo-name` (case-sensitive)

3. Check branch name matches exactly

### Connection Pending

- Go to AWS Console → CodeStar Connections
- Click "Update pending connection"
- Complete authorization with your Git provider

## Additional Documentation

- [CODESTAR-SETUP.md](./CODESTAR-SETUP.md) - Complete setup guide
- [QUICK-START.md](./QUICK-START.md) - 5-minute quick start
- [AWS CodeStar Connections Docs](https://docs.aws.amazon.com/codepipeline/latest/userguide/connections.html)
