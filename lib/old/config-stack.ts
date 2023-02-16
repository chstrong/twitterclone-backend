import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs';
import Chance from 'chance';

interface ConfigStackProps extends StackProps {
}

export class ConfigStack extends Stack {
	public readonly stage:string;
	public readonly appName:string;
	public readonly awsRegion:string;
	public readonly randomString:string;

	constructor(scope: Construct, id: string, props: ConfigStackProps) {
		super(scope, id, props)

		const chance = new Chance();

		this.stage = "Dev";
		this.appName = "TwitterApp";
		this.awsRegion = "us-east-1";
		this.randomString = chance.string({
			length: 6,
			casing: 'lower',
			alpha: true,
		})

        new CfnOutput(this, 'AWSRegion', {
			value: this.awsRegion,
		});

        new CfnOutput(this, 'AppName', {
			value: this.appName,
		});

		new CfnOutput(this, 'Stage', {
			value: this.stage,
		});

		new CfnOutput(this, 'RandomString', {
			value: this.randomString,
		});
	}
}