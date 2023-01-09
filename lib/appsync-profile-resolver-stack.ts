import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib'
import * as path from 'path'
import {
    GraphqlApi,
    MappingTemplate,
} from '@aws-cdk/aws-appsync-alpha'
import { Table } from 'aws-cdk-lib/aws-dynamodb';

interface AppsyncProfileResolverStackProps extends StackProps {
    appName: String,
    stage: String,
    api: GraphqlApi,
    userTable: Table,
}

export class AppsyncProfileResolverStack extends Stack {
    constructor(scope: Construct, id: string, props: AppsyncProfileResolverStackProps) {
        super(scope, id, props);

        const UserTableDs = props.api.addDynamoDbDataSource('UserTableDs', props.userTable);

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
    }
}