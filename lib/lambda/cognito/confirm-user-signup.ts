import { Handler } from 'aws-lambda'
import DynamoDB from 'aws-sdk/clients/dynamodb'

const dynamo = new DynamoDB.DocumentClient()
const userTable: string = process.env.USER_TABLE!

const generateRandomString = function () {
    return Math.random().toString(20).substring(2, 6)
}

interface User {
    id: String,
    name: String,
    screenName: String,
    createdAt: String,
    followersCount: Number,
    followingCount: Number,
    tweetsCount: Number,
    likesCount: Number
}

export const handler: Handler = async (event) => {
    console.log(event);

    return await create(event);
}

async function create(event: any) {
    const name: string = event.request.userAttributes['name']
    const suffix: string = generateRandomString()
    const screenName: string = `${name.replace(/[^a-zA-Z0-9]/g, "")}${suffix}`
    const username: string = event.request.userAttributes['email']

    const user: User = {
        id: username,
        name: name,
        screenName: screenName,
        createdAt: new Date().toJSON(),
        followersCount: 0,
        followingCount: 0,
        tweetsCount: 0,
        likesCount: 0
    }

    if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
        const params: DynamoDB.DocumentClient.PutItemInput = {
            TableName: userTable,
            Item: user,
            ConditionExpression: 'attribute_not_exists(id)',
        };

        await dynamo.put(params).promise()

        return event
    } else {
        return event
    }
}