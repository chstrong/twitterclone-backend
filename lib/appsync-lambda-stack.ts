// https://aws.amazon.com/blogs/mobile/building-scalable-graphql-apis-on-aws-with-cdk-and-aws-appsync/
import { Stack, StackProps } from 'aws-cdk-lib'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from 'path';
import { Bucket } from 'aws-cdk-lib/aws-s3';

interface AppsyncLambdaStackProps extends StackProps {
    appName: string,
    stage: string,
    userTable: Table,
    tweetTable: Table,
    timelineTable: Table,
    transferAssetsBucket: Bucket
}

export class AppsyncLambdaStack extends Stack {
    public readonly profileGetImageUploadUrlHandler: NodejsFunction
    public readonly tweetHandler: NodejsFunction

	constructor(scope: Construct, id: string, props: AppsyncLambdaStackProps) {
		super(scope, id, props)

        // PROFILE GET IMAGE UPLOAD URL HANDLER
		const profileGetImageUploadUrlHandler = new NodejsFunction(this, "ProfileGetImageUploadUrlHandler", {
            functionName: `${props.appName.toLowerCase()}-profile-get-image-upload-url-${props.stage.toLowerCase()}`,
            description: 'Profile Image Upload Url Handler',
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, `/lambda/appsync/profile-get-image-upload-url.ts`),
            handler: "handler",
            environment: {
                USER_TABLE: props.userTable.tableName,
                TRANSFER_BUCKET: props.transferAssetsBucket.bucketName
            },
        });

        props.userTable.grantWriteData(profileGetImageUploadUrlHandler);
        props.transferAssetsBucket.grantPut(profileGetImageUploadUrlHandler);
        props.transferAssetsBucket.grantPutAcl(profileGetImageUploadUrlHandler);

        this.profileGetImageUploadUrlHandler = profileGetImageUploadUrlHandler;


        // TWEET HANDLER
        const tweetHandler = new NodejsFunction(this, 'TweetHandler', {
            functionName: `${props.appName.toLowerCase()}-tweet-${props.stage.toLowerCase()}`,
            description: 'Tweet Handler',
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, `/lambda/appsync/tweet.ts`),
            handler: "handler",
            environment: {
                USER_TABLE: props.userTable.tableName,
                TWEET_TABLE: props.tweetTable.tableName,
                TIMELINE_TABLE: props.timelineTable.tableName,
            },
        });

        props.userTable.grantWriteData(tweetHandler);
        props.tweetTable.grantWriteData(tweetHandler);
        props.timelineTable.grantWriteData(tweetHandler);

        this.tweetHandler = tweetHandler;
	}
}