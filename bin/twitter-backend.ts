#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { CognitoUserPoolStack } from '../lib/cognito-userpool-stack'
//import { CognitoIdentityPoolStack } from '../lib/cognito-identitypool-stack'
//import { DynamoDbTableStack } from '../lib/dynamodb-table-stack'
import { AppsyncApiStack } from '../lib/appsync-api-stack'

import Config from '../config.json';

const app = new cdk.App();

const userPoolStack = new CognitoUserPoolStack(app, 'CognitoUserPoolStack', {
  appName: Config.appName,
  stage: Config.stage,
})

const graphqlApiStack = new AppsyncApiStack(app, 'AppsyncApiStack', {
  appName: Config.appName,
  stage: Config.stage,
  userPool: userPoolStack.userPool,
})