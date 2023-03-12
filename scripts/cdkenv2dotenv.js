#!/usr/bin/env node

const fs = require('fs')
const cdkEnv = require("../cdk-env.json")
const path = require('path')

const envVars = {
    "CONFIG_STAGE": cdkEnv.TwitterAppStack.Stage,
    "CONFIG_APPNAME": cdkEnv.TwitterAppStack.AppName,
    "AWS_REGION": cdkEnv.TwitterAppStack.AWSRegion,
    "RANDOM_STRING": cdkEnv.TwitterAppStack.RandomString,
    "COGNITO_USERPOOL_ID": cdkEnv.TwitterAppStack.UserPoolId,
    "COGNITO_USERPOOL_CLIENT_ID": cdkEnv.TwitterAppStack.UserPoolClientId,
    "GRAPHQL_API_URL": cdkEnv.TwitterAppStack.GraphQLAPIURL,
    "USER_TABLE": cdkEnv.TwitterAppStack.UserTableName,
    "TWEET_TABLE": cdkEnv.TwitterAppStack.TweetTableName,
    "TIMELINE_TABLE": cdkEnv.TwitterAppStack.TimelineTableName,
    "LIKE_TABLE": cdkEnv.TwitterAppStack.LikeTableName,
    "TRANSFER_BUCKET": cdkEnv.TwitterAppStack.TransferAssetsBucketName,
}

const filePath = path.join(__dirname, '../')

const envFile = `${filePath}.env`

const fileExists = fs.existsSync(envFile)

if(fileExists) {
    console.log(`Deleting ${envFile}...`)
    fs.unlinkSync(envFile) 
}

var newEnvFile = fs.createWriteStream(envFile, {
    flags: 'a' // 'a' means appending (old data will be preserved)
})

for (const [key, value] of Object.entries(envVars)) {
    newEnvFile.write(`${key}=${value}\n`)
    console.log(`${key}=${value}`);
}

newEnvFile.close()