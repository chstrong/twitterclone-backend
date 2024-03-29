#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { TwitterAppStack } from '../lib/twitter-app-stack';

const app = new cdk.App();

const envUS  = { region: 'us-east-1' };

new TwitterAppStack(app, 'TwitterAppStack', { env: envUS })

/*

// Creates all DynamoDB Tables
const dynamodbTableStack = new DynamoDbTableStack(app, 'DynamoDbTableStack', {
  appName: configStack.appName,
  stage: configStack.stage,
})

// Creates all S3 Buckets
const s3BucketStack = new S3BucketStack(app, 'S3BucketStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  randomString: configStack.randomString,
})

// Creates all Cognito Lambda Trigger Handlers
const cognitoLambdaStack = new CognitoLambdaStack(app, 'CognitoLambdaTriggerStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  userTable: dynamodbTableStack.userTable,
})

// Creates the Cognito User Pool
const userPoolStack = new CognitoUserPoolStack(app, 'CognitoUserPoolStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  confirmUserSignupHandler: cognitoLambdaStack.confirmUserSignupHandler,
})

// Creates the Appsync DynamoDB Lambda functions
const appsyncLambdaStack = new AppsyncLambdaStack(app, 'AppsyncLambdaStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  userTable: dynamodbTableStack.userTable,
  tweetTable: dynamodbTableStack.tweetTable,
  timelineTable: dynamodbTableStack.timelineTable,
})

// Creates the Appsync S3 Lambda functions
const appsyncLambdaS3Stack = new AppsyncLambdaS3Stack(app, 'AppsyncLambdaS3Stack', {
  appName: configStack.appName,
  stage: configStack.stage,
  transferAssetsBucket: s3BucketStack.transferAssetsBucket,
})

// Creates the Appsync API
const appsyncApiStack = new AppsyncApiStack(app, 'AppsyncApiStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  userPool: userPoolStack.userPool,
})

// Creates the Appsync DynamoDB resolvers
const appSyncDynamoDbResolverStack = new AppsyncDynamoDbResolverStack(app, 'AppsyncDynamoDbResolverStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  api: appsyncApiStack.api,
  userTable: dynamodbTableStack.userTable,
  tweetTable: dynamodbTableStack.tweetTable,
  timelineTable: dynamodbTableStack.timelineTable,
})

// Creates the Appsync DynamoDB Lambda resolvers
const appSyncLambdaResolverStack = new AppsyncLambdaResolverStack(app, 'AppsyncLambdaResolverStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  api: appsyncApiStack.api,
  tweetHandler: appsyncLambdaStack.tweetHandler,
})

// Creates the Appsync S3 Resolvers
const appSyncLambdaS3ResolverStack = new AppsyncLambdaS3ResolverStack(app, 'AppsyncLambdaS3ResolverStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  api: appsyncApiStack.api,
  profileGetImageUploadUrlHandler: appsyncLambdaS3Stack.profileGetImageUploadUrlHandler,
})

*/