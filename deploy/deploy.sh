#!/bin/bash

# Set variables
FUNCTION_NAME="generate3GAuthVector"
ZIP_FILE="function.zip"
DIST_DIR="dist"

echo "Installing dependencies..."
npm install

echo "Building the project..."
npm run build

echo "Zipping the files..."
cd $DIST_DIR || exit
zip -r ../$ZIP_FILE .
cd ..

echo "Deploying to AWS Lambda..."
aws lambda update-function-code \
  --function-name $FUNCTION_NAME \
  --zip-file fileb://$ZIP_FILE

echo "Deployment completed!"

rm $ZIP_FILE