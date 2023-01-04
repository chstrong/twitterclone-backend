import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib'
import * as path from 'path'
import {
    GraphqlApi,
    MappingTemplate,
} from '@aws-cdk/aws-appsync-alpha'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { Table } from 'aws-cdk-lib/aws-dynamodb';

interface AppsyncQueryStackProps extends StackProps {
    appName: String,
    stage: String,
    api: GraphqlApi,
    userTable: Table,
}

export class AppsyncQueryStack extends Stack {
    constructor(scope: Construct, id: string, props: AppsyncQueryStackProps) {
        super(scope, id, props);

        const UserTableDs = props.api.addDynamoDbDataSource('UserTableDs', props.userTable);

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
    }
}