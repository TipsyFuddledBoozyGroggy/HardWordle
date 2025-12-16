#!/bin/bash

# Script to update CodeStar Connection ARN in parameter files
# Usage: ./update-codestar-connection.sh <connection-arn>

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <codestar-connection-arn>"
    echo "Example: $0 arn:aws:codestar-connections:us-east-1:864899864715:connection/12345678-1234-1234-1234-123456789012"
    exit 1
fi

CONNECTION_ARN=$1

echo "Updating CodeStar Connection ARN in parameter files..."

# Update dev parameters
sed -i.bak 's|"REPLACE_WITH_YOUR_CODESTAR_CONNECTION_ARN"|"'$CONNECTION_ARN'"|g' infrastructure/parameters/dev-params.json

# Update prod parameters  
sed -i.bak 's|"REPLACE_WITH_YOUR_CODESTAR_CONNECTION_ARN"|"'$CONNECTION_ARN'"|g' infrastructure/parameters/prod-params.json

echo "✓ Updated dev-params.json"
echo "✓ Updated prod-params.json"
echo ""
echo "Connection ARN: $CONNECTION_ARN"
echo ""
echo "You can now deploy the pipeline stack with:"
echo "  ./infrastructure/deploy.sh dev"