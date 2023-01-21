require('dotenv').config()
const AWS = require('aws-sdk')
const http = require('axios')
const fs = require('fs')

jest.setTimeout(8000)

const userTable = process.env.USER_TABLE

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
    await http({
        method: 'put',
        url,
        headers: {
            'Content-Type': contentType
        },
        data
    })

    console.log('uploaded image to', url)
}

const user_can_download_image_from = async (url: string) => {
    const resp = await http(url)

    console.log('downloaded image from', url)

    return resp.data
}

const tweet_exists_in_TweetsTable = async (id: string, sk: string) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for tweet [${id}] in table [${process.env.TWEET_TABLE}]`)
    const resp = await DynamoDB.get({
        TableName: process.env.TWEET_TABLE,
        Key: {
            id: id,
            creator: sk
        }
    }).promise()

    console.log(`Item is ${resp.Item}`)

    expect(resp.Item).toBeTruthy()

    return resp.Item
}

const tweet_exists_in_TimelinesTable = async (userId: string, tweetId: string) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for tweet [${tweetId}] for user [${userId}] in table [${process.env.TIMELINE_TABLE}]`)
    const resp = await DynamoDB.get({
        TableName: process.env.TIMELINE_TABLE,
        Key: {
            userId,
            tweetId
        }
    }).promise()

    expect(resp.Item).toBeTruthy()

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

module.exports = {
    user_exists_in_UserTable,
    user_can_upload_image_to_url,
    user_can_download_image_from,
    tweet_exists_in_TweetsTable,
    tweet_exists_in_TimelinesTable,
    tweetsCount_is_updated_in_UsersTable,
}