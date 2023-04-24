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
import * as iam from 'aws-cdk-lib/aws-iam';

interface AppsyncApiStackProps extends StackProps {
    config: Config,
    userPool: UserPool,
    userTable: Table,
    tweetTable: Table,
    timelineTable: Table,
    likeTable: Table,
    retweetTable: Table,
    transferAssetsBucket: Bucket
}

export class AppsyncApiStack extends NestedStack {
    public readonly api: GraphqlApi

    constructor(scope: Construct, id: string, props: AppsyncApiStackProps) {
        super(scope, id, props);

        // ---------------------------------------------------------------
        // CREATE API
        // ---------------------------------------------------------------
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

        // ---------------------------------------------------------------
        // CREATE DYNAMODB RESOLVER DATASOURCES
        // ---------------------------------------------------------------
        const UserTableDs = api.addDynamoDbDataSource('UserTableDs', props.userTable);
        const TweetTableDs = api.addDynamoDbDataSource('TweetTableDs', props.tweetTable);
        const TimelineTableDs = api.addDynamoDbDataSource('TimelineTableDs', props.timelineTable);
        const LikeTableDs = api.addDynamoDbDataSource('LikeTableDs', props.likeTable);
        const RetweetTableDs = api.addDynamoDbDataSource('RetweetTableDs', props.retweetTable);

        // ---------------------------------------------------------------
        // CREATE DYNAMODB RESOLVERS
        // ---------------------------------------------------------------

        // GetMyProfile
        // ---------------------------------------------------------------
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

        // EditMyProfile
        // ---------------------------------------------------------------
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

        // GetTweets
        // ---------------------------------------------------------------
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

        // GetMyTimeline
        // ---------------------------------------------------------------
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

        // GetLikes
        // ---------------------------------------------------------------
        LikeTableDs.createResolver('GetLikes', {
            typeName: 'Query',
            fieldName: 'getLikes',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Query.getLikes.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Query.getLikes.response.vtl')
            ),
        });        

        // LikeMutation
        // ---------------------------------------------------------------

        // Create the IAM role for the DynamoDB data source
        const role = new iam.Role(this, 'MyDataSourceRole', {
            assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
        });

        // Allow the role to access all three DynamoDB tables
        props.likeTable.grantReadWriteData(role);
        props.tweetTable.grantReadWriteData(role);
        props.userTable.grantReadWriteData(role);

        LikeTableDs.ds.serviceRoleArn = role.roleArn

        // Like Mutation
        LikeTableDs.createResolver('LikeMutation', {
            typeName: 'Mutation',
            fieldName: 'like',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Mutation.like.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Mutation.like.response.vtl')
            ),
        });

        // Unlike Mutation
        LikeTableDs.createResolver('UnlikeMutation', {
            typeName: 'Mutation',
            fieldName: 'unlike',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Mutation.unlike.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Mutation.unlike.response.vtl')
            ),
        });        

        // ---------------------------------------------------------------
        // NESTED FIELD RESOLVERS
        // ---------------------------------------------------------------

        // NestedTweetProfile
        // ---------------------------------------------------------------
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

        // NestedRetweetProfile
        // ---------------------------------------------------------------
        UserTableDs.createResolver('NestedRetweetProfile', {
            typeName: 'Retweet',
            fieldName: 'profile',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Tweet.profile.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Tweet.profile.response.vtl')
            ),
        });        

        // NestedTimelineProfile
        // ---------------------------------------------------------------
        TweetTableDs.createResolver('NestedTimelineProfile', {
            typeName: 'UnhydratedTweetsPage',
            fieldName: 'tweets',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/UnhydratedTweetsPage.tweets.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/UnhydratedTweetsPage.tweets.response.vtl')
            ),
        });

        // NestedTweetLiked
        // ---------------------------------------------------------------
        LikeTableDs.createResolver('NestedTweetLiked', {
            typeName: 'Tweet',
            fieldName: 'liked',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Tweet.liked.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Tweet.liked.response.vtl')
            ),
        });

        // NestedRetweetOf
        // ---------------------------------------------------------------
        TweetTableDs.createResolver('NestedRetweetOf', {
            typeName: 'Retweet',
            fieldName: 'retweetOf',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Retweet.retweetOf.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Retweet.retweetOf.response.vtl')
            ),
        });

        // NestedMyProfileTweets
        // ---------------------------------------------------------------
        TweetTableDs.createResolver('NestedMyProfileTweets', {
            typeName: 'MyProfile',
            fieldName: 'tweets',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/MyProfile.tweets.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/MyProfile.tweets.response.vtl')
            ),
        });     

        // NestedOtherProfileTweets
        // ---------------------------------------------------------------
        TweetTableDs.createResolver('NestedOtherProfileTweets', {
            typeName: 'OtherProfile',
            fieldName: 'tweets',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/MyProfile.tweets.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/MyProfile.tweets.response.vtl')
            ),
        });

        // TweetRetweet
        // ---------------------------------------------------------------
        RetweetTableDs.createResolver('NestedTweetRetweeted', {
            typeName: 'Tweet',
            fieldName: 'retweeted',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Tweet.retweeted.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, '../graphql/mapping-templates/Tweet.retweeted.response.vtl')
            ),
        });

        // ---------------------------------------------------------------
        // LAMBDA FUNCTIONS
        // ---------------------------------------------------------------

        // ProfileGetImageUploadHandler
        // ---------------------------------------------------------------
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

        // TweetHandler
        // ---------------------------------------------------------------
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

        // RetweetHandler
        // ---------------------------------------------------------------
        const retweetHandler = new NodejsFunction(this, 'RetweetHandler', {
            functionName: `${props.config.appName.toLowerCase()}-retweet-${props.config.stage.toLowerCase()}`,
            description: 'Retweet Handler',
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, `../lambda/appsync/retweet.ts`),
            handler: "handler",
            environment: {
                USER_TABLE: props.userTable.tableName,
                RETWEET_TABLE: props.retweetTable.tableName,
                TWEET_TABLE: props.tweetTable.tableName,
                TIMELINE_TABLE: props.timelineTable.tableName,
            },
        });

        props.userTable.grantReadWriteData(retweetHandler);
        props.retweetTable.grantReadWriteData(retweetHandler);
        props.tweetTable.grantReadWriteData(retweetHandler);
        props.timelineTable.grantReadWriteData(retweetHandler);
        
        
        const unretweetHandler = new NodejsFunction(this, 'UnretweetHandler', {
            functionName: `${props.config.appName.toLowerCase()}-unretweet-${props.config.stage.toLowerCase()}`,
            description: 'Unretweet Handler',
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, `../lambda/appsync/unretweet.ts`),
            handler: "handler",
            environment: {
                USER_TABLE: props.userTable.tableName,
                RETWEET_TABLE: props.retweetTable.tableName,
                TWEET_TABLE: props.tweetTable.tableName,
                TIMELINE_TABLE: props.timelineTable.tableName,
            },
        });

        props.userTable.grantReadWriteData(unretweetHandler);
        props.retweetTable.grantReadWriteData(unretweetHandler);
        props.tweetTable.grantReadWriteData(unretweetHandler);
        props.timelineTable.grantReadWriteData(unretweetHandler);

        // ---------------------------------------------------------------
        // CREATE LAMBDA RESOLVER DATASOURCES
        // ---------------------------------------------------------------
        const TweetDs = api.addLambdaDataSource('TweetDs', tweetHandler);
        const RetweetDs = api.addLambdaDataSource('RetweetDs', retweetHandler);
        const UnretweetDs = api.addLambdaDataSource('UnretweetDs', unretweetHandler);
        const ProfileImageUploadUrlDs = api.addLambdaDataSource('ProfileImageUploadUrlDs', profileImageUploadUrlHandler);

        // ---------------------------------------------------------------
        // CREATE LAMBDA RESOLVERS
        // ---------------------------------------------------------------

        TweetDs.createResolver('Tweet', {
            typeName: 'Mutation',
            fieldName: 'tweet',
        });

        ProfileImageUploadUrlDs.createResolver('ProfileImageUploadUrl', {
            typeName: 'Query',
            fieldName: 'getImageUploadUrl',
        });

        RetweetDs.createResolver('Retweet', {
            typeName: 'Mutation',
            fieldName: 'retweet',
        });

        UnretweetDs.createResolver('Unretweet', {
            typeName: 'Mutation',
            fieldName: 'unretweet',
        });
    }
}