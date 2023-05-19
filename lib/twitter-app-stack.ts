import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import Chance from 'chance';
import { Config } from './shared/stack-helper'

import { S3BucketStack } from './nested-stacks/s3-nstack';
import { DynamoDbTableStack } from './nested-stacks/dynamodb-nstack';
import { CognitoStack } from './nested-stacks/cognito-nstack';
import { AppsyncApiStack } from './nested-stacks/appsync-nstack';

export class TwitterAppStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props)

        const chance = new Chance();

        // CONFIG
        const config: Config = {
            stage: "dev",
            appName: "twitterapp",
            awsRegion: "us-east-1",
            randomString: chance.string({
                length: 6,
                casing: 'lower',
                alpha: true,
            })
        }

        // STACKS
        const s3BucketStack = new S3BucketStack(this, 'S3BucketStack', {
            config: config
        })

        const dynamodbTableStack = new DynamoDbTableStack(this, 'DynamoDbTableStack', {
            config: config
        })

        const cognitoStack = new CognitoStack(this, 'CognitoStack', {
            config: config,
            userTable: dynamodbTableStack.userTable
        })

        const appsyncApiStack = new AppsyncApiStack(this, 'AppsyncApiStack', {
            config: config,
            userPool: cognitoStack.userPool,
            userTable: dynamodbTableStack.userTable,
            tweetTable: dynamodbTableStack.tweetTable,
            timelineTable: dynamodbTableStack.timelineTable,
            likeTable: dynamodbTableStack.likeTable,
            retweetTable: dynamodbTableStack.retweetTable,
            relationshipTable: dynamodbTableStack.relationshipTable,
            transferAssetsBucket: s3BucketStack.transferAssetsBucket,
        })

        // OUTPUTS
        new CfnOutput(this, 'AWSRegion', {
            value: config.awsRegion,
        });

        new CfnOutput(this, 'AppName', {
            value: config.appName,
        });

        new CfnOutput(this, 'Stage', {
            value: config.stage,
        });

        new CfnOutput(this, 'RandomString', {
            value: config.randomString,
        });

        new CfnOutput(this, 'TransferAssetsBucketName', {
            value: s3BucketStack.transferAssetsBucket.bucketName,
        })

        new CfnOutput(this, 'UserTableName', {
            value: dynamodbTableStack.userTable.tableName,
        })

        new CfnOutput(this, 'TweetTableName', {
            value: dynamodbTableStack.tweetTable.tableName,
        })

        new CfnOutput(this, 'TimelineTableName', {
            value: dynamodbTableStack.timelineTable.tableName,
        })

        new CfnOutput(this, 'LikeTableName', {
            value: dynamodbTableStack.likeTable.tableName,
        })

        new CfnOutput(this, 'RetweetTableName', {
            value: dynamodbTableStack.retweetTable.tableName,
        })

        new CfnOutput(this, 'RelationshipTableName', {
            value: dynamodbTableStack.relationshipTable.tableName,
        })

        new CfnOutput(this, 'UserPoolId', {
			value: cognitoStack.userPool.userPoolId,
		})

		new CfnOutput(this, 'UserPoolClientId', {
			value: cognitoStack.userPoolClient.userPoolClientId,
		})

        new CfnOutput(this, 'GraphQLAPIURL', {
			value: appsyncApiStack.api.graphqlUrl,
		});

		new CfnOutput(this, 'GraphQLAPIID', {
			value: appsyncApiStack.api.apiId,
		});
    }
}