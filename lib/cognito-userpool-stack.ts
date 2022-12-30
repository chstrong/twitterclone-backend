import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import {
	AccountRecovery,
	UserPool,
	UserPoolClient,
	VerificationEmailStyle,
} from 'aws-cdk-lib/aws-cognito'
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

import { Construct } from 'constructs'

interface CognitoUserPoolStackProps extends StackProps {
	appName: String,
	stage: String,
	confirmUserSignupHandler: NodejsFunction,
}

export class CognitoUserPoolStack extends Stack {
	public readonly userPool: UserPool
	public readonly userPoolClient: UserPoolClient

	constructor(scope: Construct, id: string, props: CognitoUserPoolStackProps) {
		super(scope, id, props)

		const userPool = new UserPool(this, `Userpool`, {
			userPoolName: `${props.appName.toLowerCase()}-userpool-${props.stage.toLowerCase()} `,
			selfSignUpEnabled: true,
			accountRecovery: AccountRecovery.EMAIL_ONLY,
			signInAliases: { email: true }, // I want email only as username
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
				postConfirmation: props.confirmUserSignupHandler,
			},
			removalPolicy: RemovalPolicy.DESTROY,
		})

		const userPoolClient = new UserPoolClient(this, `UserpoolClient`, {
			userPoolClientName: `${props.appName.toLowerCase()}-userpoolclient-web-${props.stage.toLowerCase()} `,
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

		new CfnOutput(this, 'UserPoolId', {
			value: userPool.userPoolId,
		})

		new CfnOutput(this, 'UserPoolClientId', {
			value: userPoolClient.userPoolClientId,
		})
	}
}