import { RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

interface DynamoDbTableStackProps extends StackProps {
    appName: String,
    stage: String,
}

export class DynamoDbTableStack extends Stack {
	public readonly userTable: Table

	constructor(scope: Construct, id: string, props: DynamoDbTableStackProps) {
		super(scope, id, props)

		const userTable = new Table(this, 'UserTable', {
            tableName: `${props.appName.toLowerCase()}-user-${props.stage.toLowerCase()}`,
			removalPolicy: RemovalPolicy.DESTROY,
			billingMode: BillingMode.PAY_PER_REQUEST,
			partitionKey: { name: 'id', type: AttributeType.STRING },
		})
        
        // Define tags to be able to filter for billing
        Tags.of(userTable).add('Environment', `${props.stage}`);
        Tags.of(userTable).add('TableName', `${props.appName.toLowerCase()}-user-${props.stage.toLowerCase()}`);
        Tags.of(userTable).add('Application', `${props.appName}`)

		this.userTable = userTable
	}
}