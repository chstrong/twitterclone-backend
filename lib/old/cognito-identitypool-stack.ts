import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import {
	IdentityPool,
	UserPoolAuthenticationProvider,
} from '@aws-cdk/aws-cognito-identitypool-alpha'
import { IRole } from 'aws-cdk-lib/aws-iam'
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito'

interface CognitoIdentityPoolStackProps extends StackProps {
    appName:string,
    stage:string,
	userpool: UserPool
	userpoolClient: UserPoolClient
}

export class CognitoIdentityPoolStack extends Stack {
	public readonly identityPoolId: CfnOutput
	public readonly identityPool: IdentityPool
	public readonly authenticatedRole: IRole
	public readonly unauthenticatedRole: IRole

	constructor(scope: Construct, id: string, props: CognitoIdentityPoolStackProps) {
		super(scope, id, props)

		const identityPool = new IdentityPool(this, 'IdentityPool', {
			identityPoolName: `${props.appName.toLowerCase()}-identitypool-${props.stage.toLowerCase()}`,
			allowUnauthenticatedIdentities: true,
			authenticationProviders: {
				userPools: [
					new UserPoolAuthenticationProvider({
						userPool: props.userpool,
						userPoolClient: props.userpoolClient,
					}),
				],
			},
		})

		this.authenticatedRole = identityPool.authenticatedRole
		this.unauthenticatedRole = identityPool.unauthenticatedRole
		this.identityPool = identityPool
		this.identityPoolId = new CfnOutput(this, 'IdentityPoolId', {
			value: identityPool.identityPoolId,
		})
	}
}