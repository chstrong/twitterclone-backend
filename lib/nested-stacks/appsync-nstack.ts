import { Construct } from 'constructs';
import { NestedStack, StackProps } from 'aws-cdk-lib'
import * as path from 'path'
import {
    GraphqlApi,
    SchemaFile,
    AuthorizationType,
    FieldLogLevel,
    MappingTemplate,
} from '@aws-cdk/aws-appsync-alpha'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { Config } from '../shared/stack-helper';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

interface AppsyncApiStackProps extends StackProps {
    config: Config
    userPool: UserPool,
    userTable: Table,
    tweetTable: Table,
    timelineTable: Table,
    transferAssetsBucket: Bucket
}

export class AppsyncApiStack extends NestedStack {
    public readonly api: GraphqlApi

    constructor(scope: Construct, id: string, props: AppsyncApiStackProps) {
        super(scope, id, props);

        // CREATE API
        const api = new GraphqlApi(this, 'GraphqlAPI', {
            name: `${props.config.appName.toLowerCase()}-${props.config.stage.toLowerCase()}`,
            schema: SchemaFile.fromAsset(path.join(__dirname, '../graphql/schema.graphql')),
            authorizationConfig: {
                defaultAuthorization: {
                    authorizationType: AuthorizationType.USER_POOL,
                    userPoolConfig: {
                        userPool: props.userPool,
                    },
                },
                additionalAuthorizationModes: [
                    { authorizationType: AuthorizationType.IAM },
                ],
            },
            logConfig: {
                fieldLogLevel: FieldLogLevel.ALL,
            },
            xrayEnabled: false,
        });

        this.api = api

        // CREATE DYNAMODB RESOLVER DATASOURCES
        const UserTableDs = api.addDynamoDbDataSource('UserTableDs', props.userTable);
        const TweetTableDs = api.addDynamoDbDataSource('TweetTableDs', props.tweetTable);
        const TimelineTableDs = api.addDynamoDbDataSource('TimelineTableDs', props.timelineTable);

        // CREATE DYNAMODB RESOLVERS
        UserTableDs.createResolver('GetMyProfile', {
            typeName: 'Query',
            fieldName: 'getMyProfile',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Query.getMyProfile.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Query.getMyProfile.response.vtl')
            ),
        });

        UserTableDs.createResolver('EditMyProfile', {
            typeName: 'Mutation',
            fieldName: 'editMyProfile',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Mutation.editMyProfile.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Mutation.editMyProfile.response.vtl')
            ),
        });

        TweetTableDs.createResolver('GetTweets', {
            typeName: 'Query',
            fieldName: 'getTweets',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Query.getTweets.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Query.getTweets.response.vtl')
            ),
        });

        TimelineTableDs.createResolver('GetMyTimeline', {
            typeName: 'Query',
            fieldName: 'getMyTimeline',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Query.getMyTimeline.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Query.getMyTimeline.response.vtl')
            ),
        });

        UserTableDs.createResolver('NestedTweetProfile', {
            typeName: 'Tweet',
            fieldName: 'profile',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Tweet.profile.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Tweet.profile.response.vtl')
            ),
        });

        TweetTableDs.createResolver('NestedTimelineProfile', {
            typeName: 'TimelinePage',
            fieldName: 'tweets',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/TimelinePage.tweets.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/TimelinePage.tweets.response.vtl')
            ),
        });

        // LAMBDA FUNCTIONS
        const profileImageUploadUrlHandler = new NodejsFunction(this, "ProfileGetImageUploadUrlHandler", {
            functionName: `${props.config.appName.toLowerCase()}-profile-get-image-upload-url-${props.config.stage.toLowerCase()}`,
            description: 'Profile Image Upload Url Handler',
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, `../lambda/appsync/profile-get-image-upload-url.ts`),
            handler: "handler",
            environment: {
                TRANSFER_BUCKET: props.transferAssetsBucket.bucketName
            },
        });

        props.transferAssetsBucket.grantPut(profileImageUploadUrlHandler);
        props.transferAssetsBucket.grantPutAcl(profileImageUploadUrlHandler);

        const tweetHandler = new NodejsFunction(this, 'TweetHandler', {
            functionName: `${props.config.appName.toLowerCase()}-tweet-${props.config.stage.toLowerCase()}`,
            description: 'Tweet Handler',
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, `../lambda/appsync/tweet.ts`),
            handler: "handler",
            environment: {
                USER_TABLE: props.userTable.tableName,
                TWEET_TABLE: props.tweetTable.tableName,
                TIMELINE_TABLE: props.timelineTable.tableName,
            },
        });

        props.userTable.grantReadWriteData(tweetHandler);
        props.tweetTable.grantReadWriteData(tweetHandler);
        props.timelineTable.grantReadWriteData(tweetHandler);

        // CREATE LAMBDA RESOLVER DATASOURCES
        const TweetDs = api.addLambdaDataSource('TweetDs', tweetHandler);
        const ProfileImageUploadUrlDs = api.addLambdaDataSource('ProfileImageUploadUrlDs', profileImageUploadUrlHandler);

        // LAMBDA RESOLVERS
        TweetDs.createResolver('Tweet', {
            typeName: 'Mutation',
            fieldName: 'tweet',
        });

        ProfileImageUploadUrlDs.createResolver('ProfileImageUploadUrl', {
            typeName: 'Query',
            fieldName: 'getImageUploadUrl',
        });
    }
}