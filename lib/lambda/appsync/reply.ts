import { Handler } from 'aws-lambda'

const _ = require('lodash')

const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()
const ulid = require('ulid')
const { TweetTypes } = require('../../shared/constants')
const { getTweetById, extractHashTags } = require('../../shared/tweets')

const { USER_TABLE, TIMELINE_TABLE, TWEET_TABLE } = process.env

export const handler: Handler = async (event: any) => {
    console.log(event);

    return await create(event);
}

async function create(event: any) {
    const { tweetId, text } = event.arguments
    const { username } = event.identity
    const id = ulid.ulid()
    const timestamp = new Date().toJSON()
    const hashTags = extractHashTags(text)

    const tweet = await getTweetById(tweetId)
    if (!tweet) {
        throw new Error('Tweet is not found')
    }

    const inReplyToUserIds = await getUserIdsToReplyTo(tweet)

    const newTweet = {
        __typename: TweetTypes.REPLY,
        id,
        creator: username,
        createdAt: timestamp,
        inReplyToTweetId: tweetId,
        inReplyToUserIds,
        text,
        replies: 0,
        likes: 0,
        retweets: 0,
        hashTags
    }

    // Create transactItems array
    const transactItems = []

    transactItems.push({
        Put: {
            TableName: TWEET_TABLE,
            Item: newTweet
        }
    })

    transactItems.push({
        Update: {
            TableName: TWEET_TABLE,
            Key: {
                id: tweetId
            },
            UpdateExpression: 'ADD replies :one',
            ExpressionAttributeValues: {
                ':one': 1
            },
            ConditionExpression: 'attribute_exists(id)'
        }
    })

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
    })

    transactItems.push({
        Put: {
            TableName: TIMELINE_TABLE,
            Item: {
                userId: username,
                tweetId: id,
                timestamp,
                inReplyToTweetId: tweetId,
                inReplyToUserIds
            }
        }
    })

    await DocumentClient.transactWrite({
        TransactItems: transactItems
    }).promise()

    return newTweet
}

async function getUserIdsToReplyTo(tweet: any) {
    let userIds = [tweet.creator]

    if (tweet.__typename === TweetTypes.REPLY) {
        userIds = userIds.concat(tweet.inReplyToUserIds)
    } else if (tweet.__typename === TweetTypes.RETWEET) {
        const retweetOf = await getTweetById(tweet.retweetOf)
        userIds = userIds.concat(await getUserIdsToReplyTo(retweetOf))
    }

    return _.uniq(userIds)
}