import { Handler } from 'aws-lambda'
import { DynamoDBClient, TransactWriteItemsCommand, GetItemCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from '@aws-sdk/util-dynamodb';
const ulid = require('ulid')
const { TweetTypes } = require('../../shared/constants')

const { USER_TABLE, TIMELINE_TABLE, TWEET_TABLE, RETWEET_TABLE } = process.env

const DynamoClient = new DynamoDBClient({ region: "us-east-1" });

export const handler: Handler = async (event: any) => {
    console.log(event);

    return await create(event);
}

async function create(event: any) {
    const { tweetId } = event.arguments
    const { username } = event.identity
    const id = ulid.ulid()
    const timestamp = new Date().toJSON()

    // In order to retweet a tweet, the tweet must exist
    const getQueryCmd = new GetItemCommand({
        TableName: TWEET_TABLE,
        Key: {
            id: { S: tweetId }
        }
    })

    const getTweetResp = await DynamoClient.send(getQueryCmd)

    const tweet = getTweetResp.Item
    if (!tweet) {
        throw new Error('Tweet is not found')
    }

    // Create new Tweet of type retweet
    // Creator will always be the logged in user
    const newTweet = {
        __typename: { S: TweetTypes.RETWEET },
        id: { S: id },
        creator: { S: username },
        createdAt: { S: timestamp },
        retweetOf: { S: tweetId }
    }

    // Create transactItems array
    const transactItems = []

    // Add the new tweet to the tweets table
    transactItems.push({
        Put: {
            TableName: TWEET_TABLE,
            Item: newTweet
        }
    });

    // Add the tweet to the retweets table
    transactItems.push({
        Put: {
            TableName: RETWEET_TABLE,
            Item: {
                userId: { S: username },
                tweetId: { S: tweetId },
                createdAt: { S: timestamp },
            },
            ConditionExpression: 'attribute_not_exists(tweetId)'
        }
    });

    // Update the retweets count of the tweet in the tweets table
    transactItems.push({
        Update: {
            TableName: TWEET_TABLE,
            Key: {
                id: { S: tweetId },
            },
            UpdateExpression: 'ADD retweets :one',
            ExpressionAttributeValues: {
                ':one': { N: '1' }
            },
            ConditionExpression: 'attribute_exists(id)'
        }
    });

    // Add the tweets count in the user table
    transactItems.push({
        Update: {
            TableName: USER_TABLE,
            Key: {
                id: { S: username }
            },
            UpdateExpression: 'ADD tweetsCount :one',
            ExpressionAttributeValues: {
                ':one': { N: '1' }
            },
            ConditionExpression: 'attribute_exists(id)'
        }
    });

    console.log(`creator: [${tweet.creator.S}]; username: [${username}]`)

    // If the tweet that is retweeted is from another user
    if (tweet.creator.S !== username) {
        console.log(`tweet.creator: [${tweet.creator.S}], doesn't match username: [${username}]`)

        transactItems.push({
            Put: {
                TableName: TIMELINE_TABLE,
                Item: {
                    userId: { S: username },
                    tweetId: { S: id },
                    retweetOf: { S: tweetId },
                    timestamp: { S: timestamp },
                }
            }
        });
    }

    const params: any = {
        TransactItems: transactItems
    }

    const command: any = new TransactWriteItemsCommand(params);

    try {
        const result: any = await DynamoClient.send(command);
    } catch (error: any) {
        console.error(error);
    }

    // Remove the "S:" types, turn from DynamoDB object to plain Javascript object
    return unmarshall(newTweet)
}