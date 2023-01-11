import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib'
import * as path from 'path'
import {
    GraphqlApi,
    MappingTemplate,
} from '@aws-cdk/aws-appsync-alpha'
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

interface AppsyncProfileResolverStackProps extends StackProps {
    appName: String,
    stage: String,
    api: GraphqlApi,
    userTable: Table,
    profileGetImageUploadUrlHandler: NodejsFunction
}

export class AppsyncProfileResolverStack extends Stack {
    constructor(scope: Construct, id: string, props: AppsyncProfileResolverStackProps) {
        super(scope, id, props);

        const UserTableDs = props.api.addDynamoDbDataSource('UserTableDs', props.userTable);
        const ProfileGetImageUploadUrlDs = props.api.addLambdaDataSource('ProfileGetImageUploadUrlDs', props.profileGetImageUploadUrlHandler);


        // Get My Profile
        UserTableDs.createResolver('GetMyProfile', {
            typeName: 'Query',
            fieldName: 'getMyProfile',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Query.getMyProfile.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Query.getMyProfile.response.vtl')
            ),
        });

        // Edit My Profile
        UserTableDs.createResolver('EditMyProfile', {
            typeName: 'Mutation',
            fieldName: 'editMyProfile',
            requestMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Mutation.editMyProfile.request.vtl')
            ),
            responseMappingTemplate: MappingTemplate.fromFile(
                path.join(__dirname, 'graphql/mapping-templates/Mutation.editMyProfile.response.vtl')
            ),
        });

        ProfileGetImageUploadUrlDs.createResolver('ProfileGetImageUploadUrl', {
            typeName: 'Query',
            fieldName: 'getImageUploadUrl',
        });
    }
}