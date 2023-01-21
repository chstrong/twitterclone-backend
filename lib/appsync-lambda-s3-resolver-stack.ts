import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib'
import {
    GraphqlApi,
} from '@aws-cdk/aws-appsync-alpha'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface AppsyncLambdaS3ResolverStackProps extends StackProps {
    appName:string,
    stage:string,
    api: GraphqlApi,
    profileGetImageUploadUrlHandler: NodejsFunction,
}

export class AppsyncLambdaS3ResolverStack extends Stack {
    constructor(scope: Construct, id: string, props: AppsyncLambdaS3ResolverStackProps) {
        super(scope, id, props);
        
        // CREATE DATASOURCES
        const ProfileGetImageUploadUrlDs = props.api.addLambdaDataSource('ProfileGetImageUploadUrlDs', props.profileGetImageUploadUrlHandler);

        // PROFILE GET IMAGE UPLOAD URL RESOLVER
        ProfileGetImageUploadUrlDs.createResolver('ProfileGetImageUploadUrl', {
            typeName: 'Query',
            fieldName: 'getImageUploadUrl',
        });
    }
}