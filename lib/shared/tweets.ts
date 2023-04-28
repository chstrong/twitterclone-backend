const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()

const { TWEET_TABLE } = process.env

const getTweetById = async (tweetId: string) => {
    const resp = await DocumentClient.get({
        TableName: TWEET_TABLE,
        Key: {
            id: tweetId
        }
    }).promise()

    return resp.Item
}

const extractHashTags = (text: string) => {
    const hashTags = new Set()
    const regex = /(\#[a-zA-Z0-9_]+\b)/gm
    var m: any
    while ((m = regex.exec(text)) !== null) {
        // this is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++
        }

        m.forEach((match: unknown) => hashTags.add(match))
    }

    return Array.from(hashTags)
}

const extractMentions = (text: string) => {
    const mentions = new Set()
    const regex = /@\w+/gm
    var m: any
    while ((m = regex.exec(text)) !== null) {
        // this is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++
        }

        m.forEach((match: unknown) => mentions.add(match))
    }

    return Array.from(mentions)
}

export {
    getTweetById,
    extractHashTags,
    extractMentions
}