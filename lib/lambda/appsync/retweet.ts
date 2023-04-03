import { Handler } from 'aws-lambda'
import { DynamoDBClient, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";
const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()
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

    const getTweetResp = await DocumentClient.query({
        TableName: TWEET_TABLE,
        KeyConditionExpression: 'id = :tweetId',
        ExpressionAttributeValues: {
            ':tweetId': tweetId
        },
        Limit: 1
    }).promise()

    // In order to retweet a tweet, the tweet must exist
    const tweet = getTweetResp.Items[0]
    if (!tweet) {
        throw new Error('Tweet is not found')
    }

    // Create new Tweet
    const newTweet = {
        __typename: { S: TweetTypes.RETWEET },
        id: { S: id },
        creator: { S: username },
        createdAt: { S: timestamp },
        retweetOf: { S: tweetId }
    }

    // Create transaction
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

    // If the retweet is not from the same user
    let creator:any = username;
    if(tweet.creator !== username) {
        creator = tweet.creator
    }

    // Update the retweets count of the tweet in the tweets table
    transactItems.push({
        Update: {
            TableName: TWEET_TABLE,
            Key: {
                id: { S: tweetId },
                creator: { S: creator },
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

    console.log(`creator: [${tweet.creator}]; username: [${username}]`)
    
    // If the tweet that is retweeted is from another user
    if (tweet.creator !== username) {
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
        console.log(result);
    } catch (error:any) {
        console.error(error);
    }

    return true
}