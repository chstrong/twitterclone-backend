import { Handler } from 'aws-lambda'
import { DynamoDBClient, TransactWriteItemsCommand, GetItemCommand, QueryCommand, QueryCommandOutput } from "@aws-sdk/client-dynamodb";

const { USER_TABLE, TIMELINE_TABLE, TWEET_TABLE, RETWEET_TABLE } = process.env

const DynamoClient = new DynamoDBClient({ region: "us-east-1" });

export const handler: Handler = async (event: any) => {
    console.log(event);

    return await create(event);
}

async function create(event: any) {
    const { tweetId } = event.arguments
    const { username } = event.identity

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

    // Get the retweet
    const queryParams = {
        TableName: TWEET_TABLE,
        IndexName: 'retweetsByCreator',
        KeyConditionExpression: 'creator = :creator AND retweetOf = :tweetId',
        ExpressionAttributeValues: {
            ':creator': { S: username },
            ':tweetId': { S: tweetId }
        },
        Limit: 1
    }

    const queryResp: QueryCommandOutput = await DynamoClient.send(new QueryCommand(queryParams));

    const retweet = queryResp.Items ? queryResp.Items[0] : null;
    if (!retweet) {
        throw new Error('Retweet is not found')
    }

    console.log("RETWEET IS: " + retweet.id.S)

    // Create transactItems array
    const transactItems = []

    // Delete the retweet from the TWEET table
    transactItems.push({
        Delete: {
            TableName: TWEET_TABLE,
            Key: {
                id: { S: retweet.id.S },
            },
            ConditionExpression: 'attribute_exists(id)'
        }
    });

    // Delete the tweet from the RETWEET table
    transactItems.push({
        Delete: {
            TableName: RETWEET_TABLE,
            Key: {
                userId: { S: username },
                tweetId: { S: tweetId },
            },
            ConditionExpression: 'attribute_exists(tweetId)'
        }
    });

    // Update the retweets count of the tweet in the tweets table
    transactItems.push({
        Update: {
            TableName: TWEET_TABLE,
            Key: {
                id: { S: tweetId },
            },
            UpdateExpression: 'ADD retweets :minusOne',
            ExpressionAttributeValues: {
                ':minusOne': { N: '-1' }
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
            UpdateExpression: 'ADD tweetsCount :minusOne',
            ExpressionAttributeValues: {
                ':minusOne': { N: '-1' }
            },
            ConditionExpression: 'attribute_exists(id)'
        }
    });

    console.log(`creator: [${tweet.creator.S}]; username: [${username}]`)

    // If the tweet that is retweeted is from another user
    if (tweet.creator.S !== username) {
        console.log(`tweet.creator: [${tweet.creator.S}], doesn't match username: [${username}]`)

        transactItems.push({
            Delete: {
                TableName: TIMELINE_TABLE,
                Key: {
                    userId: { S: username },
                    tweetId: { S: retweet.id.S },
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
    } catch (error: any) {
        console.error(error);
    }

    return true
}