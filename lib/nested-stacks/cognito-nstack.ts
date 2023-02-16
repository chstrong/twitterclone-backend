import { RemovalPolicy, NestedStack, StackProps } from 'aws-cdk-lib'
import {
	AccountRecovery,
	UserPool,
	UserPoolClient,
	VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito'
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from 'constructs'
import path from 'path';
import { Config } from '../shared/stack-helper';

interface CognitoStackProps extends StackProps {
    config:Config
    userTable:Table
}

export class CognitoStack extends NestedStack {
	public readonly userPool: UserPool
	public readonly userPoolClient: UserPoolClient

	constructor(scope: Construct, id: string, props: CognitoStackProps) {
		super(scope, id, props)

        // LAMBDA FUNCTIONS
        const confirmUserSignupHandler = new NodejsFunction(this, "ConfirmUserSignupHandler", {
            functionName: `${props.config.appName.toLowerCase()}-confirm-user-signup-${props.config.stage.toLowerCase()}`,
            description: 'Confirm User Signup Handler',
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, `../lambda/cognito/confirm-user-signup.ts`),
            handler: "handler",
            environment: {
                USER_TABLE: props.userTable.tableName,
            },
        });

        props.userTable.grantWriteData(confirmUserSignupHandler);

		const userPool = new UserPool(this, `Userpool`, {
			userPoolName: `${props.config.appName.toLowerCase()}-userpool-${props.config.stage.toLowerCase()} `,
			selfSignUpEnabled: true,
			accountRecovery: AccountRecovery.EMAIL_ONLY,
			signInAliases: { email: true },
			userVerification: { emailStyle: VerificationEmailStyle.CODE },
			autoVerify: { email: true },
			passwordPolicy: { // change this for production!!!
				minLength: 6,
				requireLowercase: false,
				requireDigits: false,
				requireUppercase: false,
				requireSymbols: false,
			},
			standardAttributes: {
				email: {
					required: true,
					mutable: true,
				},
				fullname: {
					required: false,
					mutable: true,
				}
			},
			lambdaTriggers: {
				postConfirmation: confirmUserSignupHandler,
			},
			removalPolicy: RemovalPolicy.DESTROY,
		})

		const userPoolClient = new UserPoolClient(this, `UserpoolClient`, {
			userPoolClientName: `${props.config.appName.toLowerCase()}-userpoolclient-web-${props.config.stage.toLowerCase()} `,
			userPool,
			authFlows: {
				userPassword: true, // Should be disabled for production!
				userSrp: true, // This is the most secure default auth flow.
				// Refresh Token Auth is enabled by default!
				// PreventUserExistenceErrors are set to true by default!
			},
		})

		this.userPool = userPool
		this.userPoolClient = userPoolClient
	}
}