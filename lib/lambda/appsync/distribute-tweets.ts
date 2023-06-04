import { Handler } from 'aws-lambda'
const _ = require('lodash')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()
const Constants = require('../../shared/constants')

const timelineTable: string = process.env.TIMELINE_TABLE!
const relationshipTable: string = process.env.RELATIONSHIP_TABLE!

export const handler: Handler = async (event: any) => {
    console.log(event);

    return await create(event);
}

async function create(event: any) {
    for (const record of event.Records) {
        if (record.eventName === 'INSERT') {
            const tweet = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
            const followers = await getFollowers(tweet.creator)
            await distribute(tweet, followers)
        } else if (record.eventName === 'REMOVE') {
            const tweet = DynamoDB.Converter.unmarshall(record.dynamodb.OldImage)
            const followers = await getFollowers(tweet.creator)
            await undistribute(tweet, followers)
        }
    }
}

async function getFollowers(userId: any) {
    const loop: any = async (acc: any, exclusiveStartKey: any) => {
        const resp = await DocumentClient.query({
            TableName: relationshipTable,
            KeyConditionExpression: 'otherUserId = :otherUserId and begins_with(sk, :follows)',
            ExpressionAttributeValues: {
                ':otherUserId': userId,
                ':follows': 'FOLLOWS_'
            },
            IndexName: 'byOtherUser',
            ExclusiveStartKey: exclusiveStartKey
        }).promise()

        const userIds = (resp.Items || []).map((x: any) => x.userId)

        if (resp.LastEvaluatedKey) {
            return await loop(acc.concat(userIds), resp.LastEvaluatedKey)
        } else {
            return acc.concat(userIds)
        }
    }

    return await loop([])
}

async function distribute(tweet: any, followers: any) {
    const timelineEntries: any = followers.map((userId: any) => ({
        PutRequest: {
            Item: {
                userId,
                tweetId: tweet.id,
                timestamp: tweet.createdAt,
                retweetOf: tweet.retweetOf,
                inReplyToTweetId: tweet.inReplyToTweetId,
                inReplyToUserIds: tweet.inReplyToUserIds
            }
        }
    }))

    const chunks = _.chunk(timelineEntries, Constants.DynamoDB.MAX_BATCH_SIZE)

    const promises = await chunks.map(async (chunk: any) => {
        await DocumentClient.batchWrite({
            RequestItems: {
                [timelineTable]: chunk
            }
        }).promise()
    })

    await Promise.all(promises)
}

async function undistribute(tweet: any, followers: any) {
    const timelineEntries = followers.map((userId: any) => ({
        DeleteRequest: {
            Key: {
                userId,
                tweetId: tweet.id
            }
        }
    }))

    const chunks = _.chunk(timelineEntries, Constants.DynamoDB.MAX_BATCH_SIZE)

    const promises = chunks.map(async (chunk: any) => {
        await DocumentClient.batchWrite({
            RequestItems: {
                [timelineTable]: chunk
            }
        }).promise()
    })

    await Promise.all(promises)
}