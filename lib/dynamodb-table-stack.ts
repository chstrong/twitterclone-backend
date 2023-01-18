import { CfnOutput, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib'
import { AttributeType, ProjectionType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb'
import { Construct } from 'constructs';

interface DynamoDbTableStackProps extends StackProps {
    appName:string,
    stage:string,
}

export class DynamoDbTableStack extends Stack {
	public readonly userTable: Table
    public readonly tweetTable: Table
    public readonly timelineTable: Table

	constructor(scope: Construct, id: string, props: DynamoDbTableStackProps) {
		super(scope, id, props)

        // USER TABLE
        const userTableName = `${props.appName.toLowerCase()}-user-${props.stage.toLowerCase()}`
		const userTable = new Table(this, 'UserTable', {
            tableName: userTableName,
			removalPolicy: RemovalPolicy.DESTROY,
			billingMode: BillingMode.PAY_PER_REQUEST,
			partitionKey: { name: 'id', type: AttributeType.STRING },
		})
        
        // Define tags to be able to filter for billing
        Tags.of(userTable).add('Environment', `${props.stage}`);
        Tags.of(userTable).add('TableName', userTableName);
        Tags.of(userTable).add('Application', `${props.appName}`)

		this.userTable = userTable


        // TWEET TABLE
        const tweetTableName = `${props.appName.toLowerCase()}-tweet-${props.stage.toLowerCase()}`
        const tweetTable = new Table(this, 'TweetTable', {
            tableName: tweetTableName,
			removalPolicy: RemovalPolicy.DESTROY,
			billingMode: BillingMode.PAY_PER_REQUEST,
			partitionKey: { name: 'id', type: AttributeType.STRING },
            sortKey: { name: 'creator', type: AttributeType.STRING },
        })

        tweetTable.addGlobalSecondaryIndex({
            indexName: `byCreator`,
            partitionKey: { name: 'creator', type: AttributeType.STRING },
            sortKey: { name: 'id', type: AttributeType.STRING},
            projectionType: ProjectionType.ALL,
        })

        // Define tags to be able to filter for billing
        Tags.of(tweetTable).add('Environment', `${props.stage}`);
        Tags.of(tweetTable).add('TableName', tweetTableName);
        Tags.of(tweetTable).add('Application', `${props.appName}`)        

        this.tweetTable = tweetTable


        // TIMELINE TABLE
        const timelineTableName = `${props.appName.toLowerCase()}-timeline-${props.stage.toLowerCase()}`
        const timelineTable = new Table(this, 'TimelineTable', {
            tableName: timelineTableName,
			removalPolicy: RemovalPolicy.DESTROY,
			billingMode: BillingMode.PAY_PER_REQUEST,
			partitionKey: { name: 'userId', type: AttributeType.STRING },
            sortKey: { name: 'tweetId', type: AttributeType.STRING },
        })

        // Define tags to be able to filter for billing
        Tags.of(timelineTable).add('Environment', `${props.stage}`);
        Tags.of(timelineTable).add('TableName', timelineTableName);
        Tags.of(timelineTable).add('Application', `${props.appName}`)  

        this.timelineTable = timelineTable


        // OUTPUTS
        new CfnOutput(this, 'UserTableName', {
			value: userTable.tableName,
		})

        new CfnOutput(this, 'TweetTableName', {
			value: tweetTable.tableName,
		})

        new CfnOutput(this, 'TimelineTableName', {
			value: timelineTable.tableName,
		})
	}
}