import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'

interface GlobalConfigStackProps extends StackProps {
}

export class GlobalConfigStack extends Stack {
	constructor(scope: Construct, id: string, props: GlobalConfigStackProps) {
		super(scope, id, props)

        new CfnOutput(this, 'AWSRegion', {
			value: "us-east-1",
		})
	}
}