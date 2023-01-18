import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib'
import * as path from 'path'
import {
    GraphqlApi,
    MappingTemplate,
} from '@aws-cdk/aws-appsync-alpha'
import { Table } from 'aws-cdk-lib/aws-dynamodb';

interface AppsyncDynamoDbResolverStackProps extends StackProps {
    appName:string,
    stage:string,
    api: GraphqlApi,
    userTable: Table,
}

export class AppsyncDynamoDbResolverStack extends Stack {
    constructor(scope: Construct, id: string, props: AppsyncDynamoDbResolverStackProps) {
        super(scope, id, props);

        // CREATE DATASOURCES
        const UserTableDs = props.api.addDynamoDbDataSource('UserTableDs', props.userTable);

        // GET MY PROFILE RESOLVER
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

        // EDIT MY PROFILE RESOLVER
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