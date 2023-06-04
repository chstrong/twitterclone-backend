require('dotenv').config()
const AWS = require('aws-sdk')
const http = require('axios')
const fs = require('fs')

const _ = require('lodash')

jest.setTimeout(20000)

const userTable = process.env.USER_TABLE
const timelineTable = process.env.TIMELINE_TABLE

const user_exists_in_UserTable = async (id: String) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for user ${id} in table ${userTable}`)
    const resp = await DynamoDB.get({
        TableName: userTable,
        Key: {
            id
        }
    }).promise()

    console.log(resp)

    expect(resp.Item).toBeTruthy()

    return resp.Item
}

const user_can_upload_image_to_url = async (url: string, filepath: string, contentType: string) => {
    const data = fs.readFileSync(filepath)

    try {
        await http({
            method: 'put',
            url,
            headers: {
                'Content-Type': contentType
            },
            data
        })
    } catch (err: any) {
        console.log("ERROR IS: ", err)
    }

    console.log('uploaded image to', url)
}

const user_can_download_image_from = async (url: string) => {
    try {
        const resp = await http(url)

        console.log('downloaded image from', url)

        return resp.data
    } catch (err: any) {
        console.log(err)
    }
}

const tweet_exists_in_TweetsTable = async (id: string) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for tweet [${id}] in table [${process.env.TWEET_TABLE}]`)
    const resp = await DynamoDB.get({
        TableName: process.env.TWEET_TABLE,
        Key: {
            id
        }
    }).promise()

    expect(resp.Item).toBeTruthy()

    return resp.Item
}

const retweet_exists_in_TweetsTable = async (userId: any, tweetId: any) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for retweet of [${tweetId}] in table [${process.env.TWEET_TABLE}]`)
    const resp = await DynamoDB.query({
        TableName: process.env.TWEET_TABLE,
        IndexName: 'retweetsByCreator',
        KeyConditionExpression: 'creator = :creator AND retweetOf = :tweetId',
        ExpressionAttributeValues: {
            ':creator': userId,
            ':tweetId': tweetId
        },
        Limit: 1
    }).promise()

    const retweet = _.get(resp, 'Items.0')

    expect(retweet).toBeTruthy()

    return retweet
}

const retweet_exists_in_RetweetsTable = async (userId: any, tweetId: any) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for retweet of [${tweetId}] for user [${userId}] in table [${process.env.RETWEET_TABLE}]`)
    const resp = await DynamoDB.get({
        TableName: process.env.RETWEET_TABLE,
        Key: {
            userId,
            tweetId
        }
    }).promise()

    expect(resp.Item).toBeTruthy()

    return resp.Item
}

const there_are_N_tweets_in_TimelinesTable = async (userId: any, n: any) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for [${n}] tweets for user [${userId}] in table [${process.env.TIMELINE_TABLE}]`)
    const resp = await DynamoDB.query({
        TableName: timelineTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
            ':userId': userId
        },
        ScanIndexForward: false
    }).promise()

    expect(resp.Items).toHaveLength(n)

    return resp.Items
}

const tweet_exists_in_TimelinesTable = async (userId: string, tweetId: string) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for tweet [${tweetId}] for user [${userId}] in table [${process.env.TIMELINE_TABLE}]`)
    const resp = await DynamoDB.get({
        TableName: timelineTable,
        Key: {
            userId,
            tweetId
        }
    }).promise()

    expect(resp.Item).toBeTruthy()

    return resp.Item
}

const tweet_does_not_exist_in_TimelinesTable = async (userId: any, tweetId: any) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for tweet [${tweetId}] for user [${userId}] in table [${timelineTable}]`)
    const resp = await DynamoDB.get({
        TableName: timelineTable,
        Key: {
            userId,
            tweetId
        }
    }).promise()

    expect(resp.Item).not.toBeTruthy()

    return resp.Item
}

const tweetsCount_is_updated_in_UsersTable = async (id: string, newCount: number) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for user [${id}] in table [${process.env.USER_TABLE}]`)
    const resp = await DynamoDB.get({
        TableName: process.env.USER_TABLE,
        Key: {
            id
        }
    }).promise()

    expect(resp.Item).toBeTruthy()
    expect(resp.Item.tweetsCount).toEqual(newCount)

    return resp.Item
}

const retweet_does_not_exist_in_TweetsTable = async (userId: any, tweetId: any) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for retweet of [${tweetId}] in table [${process.env.TWEET_TABLE}]`)
    const resp = await DynamoDB.query({
        TableName: process.env.TWEET_TABLE,
        IndexName: 'retweetsByCreator',
        KeyConditionExpression: 'creator = :creator AND retweetOf = :tweetId',
        ExpressionAttributeValues: {
            ':creator': userId,
            ':tweetId': tweetId
        },
        Limit: 1
    }).promise()

    expect(resp.Items).toHaveLength(0)

    return null
}

const retweet_does_not_exist_in_RetweetsTable = async (userId: any, tweetId: any) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for retweet of [${tweetId}] for user [${userId}] in table [${process.env.RETWEET_TABLE}]`)
    const resp = await DynamoDB.get({
        TableName: process.env.RETWEET_TABLE,
        Key: {
            userId,
            tweetId
        }
    }).promise()

    expect(resp.Item).not.toBeTruthy()

    return resp.Item
}

const reply_exists_in_TweetsTable = async (userId: any, tweetId: any) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for reply by [${userId}] to [${tweetId}] in table [${process.env.TWEET_TABLE}]`)
    const resp = await DynamoDB.query({
        TableName: process.env.TWEET_TABLE,
        IndexName: 'repliesForTweet',
        KeyConditionExpression: 'inReplyToTweetId = :tweetId',
        ExpressionAttributeValues: {
            ':userId': userId,
            ':tweetId': tweetId
        },
        FilterExpression: 'creator = :userId'
    }).promise()

    const reply = _.get(resp, 'Items.0')

    expect(reply).toBeTruthy()

    return reply
}

module.exports = {
    user_exists_in_UserTable,
    user_can_upload_image_to_url,
    user_can_download_image_from,
    tweet_exists_in_TweetsTable,
    retweet_exists_in_TweetsTable,
    retweet_exists_in_RetweetsTable,
    tweet_exists_in_TimelinesTable,
    tweet_does_not_exist_in_TimelinesTable,
    tweetsCount_is_updated_in_UsersTable,
    there_are_N_tweets_in_TimelinesTable,
    retweet_does_not_exist_in_TweetsTable,
    retweet_does_not_exist_in_RetweetsTable,
    reply_exists_in_TweetsTable,
}