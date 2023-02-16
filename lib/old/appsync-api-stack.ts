import { Construct } from 'constructs';
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import * as path from 'path'
import {
	GraphqlApi,
	SchemaFile,
	AuthorizationType,
	FieldLogLevel,
} from '@aws-cdk/aws-appsync-alpha'
import { UserPool } from 'aws-cdk-lib/aws-cognito'
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Config } from '../shared/stack-helper';

interface AppsyncApiStackProps extends StackProps {
  config: Config,
  userPool: UserPool,
  userTable: Table,
  tweetTable: Table,
  timelineTable: Table
}

export class AppsyncApiStack extends Stack {
  public readonly api: GraphqlApi
  
  constructor(scope: Construct, id: string, props: AppsyncApiStackProps) {
    super(scope, id, props);

    const api = new GraphqlApi(this, 'GraphqlAPI', {
      name: `${props.config.appName.toLowerCase()}-${props.config.stage.toLowerCase()}`,
      schema: SchemaFile.fromAsset(path.join(__dirname, 'graphql/schema.graphql')),
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

    new CfnOutput(this, 'GraphQLAPIURL', {
			value: api.graphqlUrl,
		});

		new CfnOutput(this, 'GraphQLAPIID', {
			value: api.apiId,
		});
  }
}