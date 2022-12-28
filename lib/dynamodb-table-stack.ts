import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib'
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs'

interface DynamoDbTableStackProps extends StackProps {
    appName: String,
    stage: String,
}

export class DynamoDbTableStack extends Stack {
	public readonly noteTable: Table
    public readonly categoryTable: Table
    
	constructor(scope: Construct, id: string, props: DynamoDbTableStackProps) {
		super(scope, id, props)

		const noteTable = new Table(this, 'NoteTable', {
            tableName: `${props.appName.toLowerCase()}-note-${props.stage.toLowerCase()}`,
			removalPolicy: RemovalPolicy.DESTROY,
			billingMode: BillingMode.PAY_PER_REQUEST,
			partitionKey: { name: 'ID', type: AttributeType.STRING },
		})

		const categoryTable = new Table(this, 'CategoryTable', {
            tableName: `${props.appName.toLowerCase()}-category-${props.stage.toLowerCase()}`,
			removalPolicy: RemovalPolicy.DESTROY,
			billingMode: BillingMode.PAY_PER_REQUEST,
			partitionKey: { name: 'ID', type: AttributeType.STRING },
		})        

		this.noteTable = noteTable
        this.categoryTable = categoryTable
	}
}