#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { DynamoDbTableStack } from '../lib/dynamodb-table-stack'
import { CognitoLambdaTriggerStack } from '../lib/cognito-lambda-trigger-stack';
import { CognitoUserPoolStack } from '../lib/cognito-userpool-stack'
//import { CognitoIdentityPoolStack } from '../lib/cognito-identitypool-stack'
import { AppsyncApiStack } from '../lib/appsync-api-stack'

import Config from '../config.json';
import { GlobalConfigStack } from '../lib/global-config-stack';
import { AppsyncProfileResolverStack } from '../lib/appsync-profile-resolver-stack';

const app = new cdk.App();

const globalConfigStack = new GlobalConfigStack(app, 'GlobalConfigStack', {})

const dynamodbTableStack = new DynamoDbTableStack(app, 'DynamoDbTableStack', {
  appName: Config.appName,
  stage: Config.stage,
})

const cognitoLambdaTriggerStack = new CognitoLambdaTriggerStack(app, 'CognitoLambdaTriggerStack', {
  appName: Config.appName,
  stage: Config.stage,
  userTable: dynamodbTableStack.userTable,
})

const userPoolStack = new CognitoUserPoolStack(app, 'CognitoUserPoolStack', {
  appName: Config.appName,
  stage: Config.stage,
  confirmUserSignupHandler: cognitoLambdaTriggerStack.confirmUserSignupHandler,
})

const appSyncApiStack = new AppsyncApiStack(app, 'AppsyncApiStack', {
  appName: Config.appName,
  stage: Config.stage,
  userPool: userPoolStack.userPool,
})

const appSyncProfileResolverStack = new AppsyncProfileResolverStack(app, 'AppsyncProfileResolverStack', {
  appName: Config.appName,
  stage: Config.stage,
  api: appSyncApiStack.api,
  userTable: dynamodbTableStack.userTable
})