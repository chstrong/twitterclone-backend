#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { DynamoDbTableStack } from '../lib/dynamodb-table-stack'
import { CognitoLambdaStack } from '../lib/cognito-lambda-stack';
import { CognitoUserPoolStack } from '../lib/cognito-userpool-stack'
//import { CognitoIdentityPoolStack } from '../lib/cognito-identitypool-stack'
import { AppsyncApiStack } from '../lib/appsync-api-stack'

import { ConfigStack } from '../lib/config-stack';
import { AppsyncDynamoDbResolverStack } from '../lib/appsync-dynamodb-resolver-stack';
import { AppsyncLambdaResolverStack } from '../lib/appsync-lambda-resolver-stack';
import { AppsyncLambdaStack } from '../lib/appsync-lambda-stack';
import { S3BucketStack } from '../lib/s3-bucket-stack';

const app = new cdk.App();

const configStack = new ConfigStack(app, 'ConfigStack', {})

const dynamodbTableStack = new DynamoDbTableStack(app, 'DynamoDbTableStack', {
  appName: configStack.appName,
  stage: configStack.stage,
})

const s3BucketStack = new S3BucketStack(app, 'S3BucketStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  randomString: configStack.randomString,
})

const cognitoLambdaStack = new CognitoLambdaStack(app, 'CognitoLambdaTriggerStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  userTable: dynamodbTableStack.userTable,
})

const appsyncLambdaStack = new AppsyncLambdaStack(app, 'AppsyncLambdaStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  userTable: dynamodbTableStack.userTable,
  tweetTable: dynamodbTableStack.tweetTable,
  timelineTable: dynamodbTableStack.timelineTable,
  transferAssetsBucket: s3BucketStack.transferAssetsBucket,
})

const userPoolStack = new CognitoUserPoolStack(app, 'CognitoUserPoolStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  confirmUserSignupHandler: cognitoLambdaStack.confirmUserSignupHandler,
})

const appsyncApiStack = new AppsyncApiStack(app, 'AppsyncApiStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  userPool: userPoolStack.userPool,
})

const appSyncDynamoDbResolverStack = new AppsyncDynamoDbResolverStack(app, 'AppsyncDynamoDbResolverStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  api: appsyncApiStack.api,
  userTable: dynamodbTableStack.userTable,
})

const appSyncLambdaResolverStack = new AppsyncLambdaResolverStack(app, 'AppsyncLambdaResolverStack', {
  appName: configStack.appName,
  stage: configStack.stage,
  api: appsyncApiStack.api,
  profileGetImageUploadUrlHandler: appsyncLambdaStack.profileGetImageUploadUrlHandler,
  tweetHandler: appsyncLambdaStack.tweetHandler,
})