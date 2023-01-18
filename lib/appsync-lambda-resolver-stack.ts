import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib'
import {
    GraphqlApi,
} from '@aws-cdk/aws-appsync-alpha'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface AppsyncLambdaResolverStackProps extends StackProps {
    appName:string,
    stage:string,
    api: GraphqlApi,
    profileGetImageUploadUrlHandler: NodejsFunction,
    tweetHandler: NodejsFunction,
}

export class AppsyncLambdaResolverStack extends Stack {
    constructor(scope: Construct, id: string, props: AppsyncLambdaResolverStackProps) {
        super(scope, id, props);
        
        // CREATE DATASOURCES
        const ProfileGetImageUploadUrlDs = props.api.addLambdaDataSource('ProfileGetImageUploadUrlDs', props.profileGetImageUploadUrlHandler);
        const TweetDs = props.api.addLambdaDataSource('TweetDs', props.tweetHandler);

        // PROFILE GET IMAGE UPLOAD URL RESOLVER
        ProfileGetImageUploadUrlDs.createResolver('ProfileGetImageUploadUrl', {
            typeName: 'Query',
            fieldName: 'getImageUploadUrl',
        });

        // TWEET RESOLVER
        TweetDs.createResolver('Tweet', {
            typeName: 'Mutation',
            fieldName: 'tweet',
        });
    }
}