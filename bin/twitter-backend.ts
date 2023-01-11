#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { DynamoDbTableStack } from '../lib/dynamodb-table-stack'
import { CognitoLambdaStack } from '../lib/cognito-lambda-stack';
import { CognitoUserPoolStack } from '../lib/cognito-userpool-stack'
//import { CognitoIdentityPoolStack } from '../lib/cognito-identitypool-stack'
import { AppsyncApiStack } from '../lib/appsync-api-stack'

import Config from '../config.json';
import { GlobalConfigStack } from '../lib/global-config-stack';
import { AppsyncProfileResolverStack } from '../lib/appsync-profile-resolver-stack';
import { AppsyncLambdaStack } from '../lib/appsync-lambda-stack';
import { S3BucketStack } from '../lib/s3-bucket-stack';

const app = new cdk.App();

const globalConfigStack = new GlobalConfigStack(app, 'GlobalConfigStack', {})

const dynamodbTableStack = new DynamoDbTableStack(app, 'DynamoDbTableStack', {
  appName: Config.appName,
  stage: Config.stage,
})

const s3BucketStack = new S3BucketStack(app, 'S3BucketStack', {
  appName: Config.appName,
  stage: Config.stage,
})

const cognitoLambdaStack = new CognitoLambdaStack(app, 'CognitoLambdaTriggerStack', {
  appName: Config.appName,
  stage: Config.stage,
  userTable: dynamodbTableStack.userTable,
})

const appsyncLambdaStack = new AppsyncLambdaStack(app, 'AppsyncLambdaStack', {
  appName: Config.appName,
  stage: Config.stage,
  userTable: dynamodbTableStack.userTable,
  transferAssetsBucket: s3BucketStack.transferAssetsBucket,
})

const userPoolStack = new CognitoUserPoolStack(app, 'CognitoUserPoolStack', {
  appName: Config.appName,
  stage: Config.stage,
  confirmUserSignupHandler: cognitoLambdaStack.confirmUserSignupHandler,
})

const appsyncApiStack = new AppsyncApiStack(app, 'AppsyncApiStack', {
  appName: Config.appName,
  stage: Config.stage,
  userPool: userPoolStack.userPool,
})

const appSyncProfileResolverStack = new AppsyncProfileResolverStack(app, 'AppsyncProfileResolverStack', {
  appName: Config.appName,
  stage: Config.stage,
  api: appsyncApiStack.api,
  userTable: dynamodbTableStack.userTable,
  profileGetImageUploadUrlHandler: appsyncLambdaStack.profileGetImageUploadUrlHandler,
})