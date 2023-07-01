import { Handler } from 'aws-lambda'
const _ = require('lodash')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()
const Constants = require('../../shared/constants')

const tweetTable: string = process.env.TWEET_TABLE!
const timelineTable: string = process.env.TIMELINE_TABLE!
const maxTweets: number = +process.env.MAX_TWEETS!

export const handler: Handler = async (event: any) => {
    console.log(event);

    return await create(event);
}

async function create(event: any) {
    for (const record of event.Records) {
        if (record.eventName === 'INSERT') {
            const relationship = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)

            const [relType] = relationship.sk.split('_')
            if (relType === 'FOLLOWS') {
                const tweets = await getTweets(relationship.otherUserId)
                await distribute(tweets, relationship.userId)
            }
        } else if (record.eventName === 'REMOVE') {
            const relationship = DynamoDB.Converter.unmarshall(record.dynamodb.OldImage)
            const [relType] = relationship.sk.split('_')
            if (relType === 'FOLLOWS') {
                const tweets = await getTimelineEntriesBy(relationship.otherUserId, relationship.userId)
                await undistribute(tweets, relationship.userId)
            }
        }
    }
}

async function getTweets(userId: any) {
    const loop: any = async (acc: any, exclusiveStartKey: any) => {
        const resp = await DocumentClient.query({
            TableName: tweetTable,
            KeyConditionExpression: 'creator = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
            IndexName: 'byCreator',
            ExclusiveStartKey: exclusiveStartKey
        }).promise()

        const tweets = resp.Items || []
        const newAcc = acc.concat(tweets)

        if (resp.LastEvaluatedKey && newAcc.length < maxTweets) {
            return await loop(newAcc, resp.LastEvaluatedKey)
        } else {
            return newAcc
        }
    }

    return await loop([])
}

async function getTimelineEntriesBy(distributedFrom: any, userId: any) {
    const loop: any = async (acc: any, exclusiveStartKey: any) => {
        const resp = await DocumentClient.query({
            TableName: timelineTable,
            KeyConditionExpression: 'userId = :userId AND distributedFrom = :distributedFrom',
            ExpressionAttributeValues: {
                ':userId': userId,
                ':distributedFrom': distributedFrom,
            },
            IndexName: 'byDistributedFrom',
            ExclusiveStartKey: exclusiveStartKey
        }).promise()

        const tweets = resp.Items || []
        const newAcc = acc.concat(tweets)

        if (resp.LastEvaluatedKey) {
            return await loop(newAcc, resp.LastEvaluatedKey)
        } else {
            return newAcc
        }
    }

    return await loop([])
}

async function distribute(tweets: any, userId: any) {
    const timelineEntries = tweets.map((tweet: any) => ({
        PutRequest: {
            Item: {
                userId,
                tweetId: tweet.id,
                timestamp: tweet.createdAt,
                distributedFrom: tweet.creator,
                retweetOf: tweet.retweetOf,
                inReplyToTweetId: tweet.inReplyToTweetId,
                inReplyToUserIds: tweet.inReplyToUserIds
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

async function undistribute(tweets:any, userId:any) {
    const timelineEntries = tweets.map((tweet:any) => ({
        DeleteRequest: {
            Key: {
                userId,
                tweetId: tweet.tweetId
            }
        }
    }))

    const chunks = _.chunk(timelineEntries, Constants.DynamoDB.MAX_BATCH_SIZE)

    const promises = chunks.map(async (chunk:any) => {
        await DocumentClient.batchWrite({
            RequestItems: {
                [timelineTable]: chunk
            }
        }).promise()
    })

    await Promise.all(promises)
}