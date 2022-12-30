import { Stack, StackProps } from 'aws-cdk-lib'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from 'path';

interface CognitoLambdaTriggerStackProps extends StackProps {
    appName: String,
    stage: String,
	userTable: Table,
}

export class CognitoLambdaTriggerStack extends Stack {
    public readonly confirmUserSignupHandler: NodejsFunction

	constructor(scope: Construct, id: string, props: CognitoLambdaTriggerStackProps) {
		super(scope, id, props)

		const confirmUserSignupHandler = new NodejsFunction(this, "ConfirmUserSignupHandler", {
            functionName: `${props.appName.toLowerCase()}-confirm-user-signup-${props.stage.toLowerCase()}`,
            description: 'Confirm User Signup Handler',
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, `/lambda/cognito/confirm-user-signup.ts`),
            handler: "handler",
            environment: {
                USER_TABLE: props.userTable.tableName,
            },
        });

        props.userTable.grantWriteData(confirmUserSignupHandler)

        this.confirmUserSignupHandler = confirmUserSignupHandler
	}
}