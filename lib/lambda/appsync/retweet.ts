import { Handler } from 'aws-lambda'
const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()
const ulid = require('ulid')
const { TweetTypes } = require('../../shared/constants')

const { USER_TABLE, TIMELINE_TABLE, TWEET_TABLE, RETWEET_TABLE } = process.env

export const handler: Handler = async (event: any) => {
    console.log(event);

    return await create(event);
}

async function create(event: any) {
    const { tweetId } = event.arguments
    const { username } = event.identity
    const id = ulid.ulid()
    const timestamp = new Date().toJSON()

    const getTweetResp = await DocumentClient.get({
        TableName: TWEET_TABLE,
        Key: {
            id: tweetId,
            creator: username
        }
    }).promise()

    const tweet = getTweetResp.Item
    if (!tweet) {
        throw new Error('Tweet is not found')
    }

    // Create new Tweet
    const newTweet = {
        __typename: TweetTypes.RETWEET,
        id: id,
        creator: username,
        createdAt: timestamp,
        retweetOf: tweetId,
    }

    // Create Transaction
    const transactItems = [];

    transactItems.push({
        Put: {
            TableName: TWEET_TABLE,
            Item: newTweet
        }
    });

    transactItems.push({
        Put: {
            TableName: RETWEET_TABLE,
            Item: {
                userId: username,
                tweetId,
                createdAt: timestamp,
            },
            ConditionExpression: 'attribute_not_exists(tweetId)'
        }
    });

    transactItems.push({
        Update: {
            TableName: TWEET_TABLE,
            Key: {
                id: tweetId,
                creator: username,
            },
            UpdateExpression: 'ADD retweets :one',
            ExpressionAttributeValues: {
                ':one': 1
            },
            ConditionExpression: 'attribute_exists(id)'
        }
    });

    transactItems.push({
        Update: {
            TableName: USER_TABLE,
            Key: {
                id: username
            },
            UpdateExpression: 'ADD tweetsCount :one',
            ExpressionAttributeValues: {
                ':one': 1
            },
            ConditionExpression: 'attribute_exists(id)'
        }
    });

    console.log(`creator: [${tweet.creator}]; username: [${username}]`)
    if (tweet.creator !== username) {
        transactItems.push({
            Put: {
                TableName: TIMELINE_TABLE,
                Item: {
                    userId: username,
                    tweetId: id,
                    retweetOf: tweetId,
                    timestamp
                }
            }
        });
    }

    await DocumentClient.transactWrite({
        TransactItems: transactItems
    }).promise()

    return true
}