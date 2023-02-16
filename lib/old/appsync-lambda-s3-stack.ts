// https://aws.amazon.com/blogs/mobile/building-scalable-graphql-apis-on-aws-with-cdk-and-aws-appsync/
import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from 'path';
import { Bucket } from 'aws-cdk-lib/aws-s3';

interface AppsyncLambdaS3StackProps extends StackProps {
    appName: string,
    stage: string,
    transferAssetsBucket: Bucket
}

export class AppsyncLambdaS3Stack extends Stack {
    public readonly profileGetImageUploadUrlHandler: NodejsFunction

	constructor(scope: Construct, id: string, props: AppsyncLambdaS3StackProps) {
		super(scope, id, props)

        // PROFILE GET IMAGE UPLOAD URL HANDLER
		const profileGetImageUploadUrlHandler = new NodejsFunction(this, "ProfileGetImageUploadUrlHandler", {
            functionName: `${props.appName.toLowerCase()}-profile-get-image-upload-url-${props.stage.toLowerCase()}`,
            description: 'Profile Image Upload Url Handler',
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, `/lambda/appsync/profile-get-image-upload-url.ts`),
            handler: "handler",
            environment: {
                TRANSFER_BUCKET: props.transferAssetsBucket.bucketName
            },
        });

        props.transferAssetsBucket.grantPut(profileGetImageUploadUrlHandler);
        props.transferAssetsBucket.grantPutAcl(profileGetImageUploadUrlHandler);

        this.profileGetImageUploadUrlHandler = profileGetImageUploadUrlHandler;
	}
}