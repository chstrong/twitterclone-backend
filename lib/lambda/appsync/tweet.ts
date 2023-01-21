import { Handler } from 'aws-lambda'
const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()
const ulid = require('ulid')
const { TweetTypes } = require('../../shared/constants')
//const { extractHashTags } = require('../../shared/tweets')

const { USER_TABLE, TIMELINE_TABLE, TWEET_TABLE } = process.env

export const handler: Handler = async (event:any) => {
    console.log(event);

    return await create(event);
}

async function create(event: any) {
  const { text } = event.arguments
  const { username } = event.identity
  const id = ulid.ulid()
  const timestamp = new Date().toJSON()

  const newTweet = {
    __typename: TweetTypes.TWEET,
    id: id,
    creator: username,
    text: text,
    createdAt: timestamp,
    replies: 0,
    likes: 0,
    retweets: 0,
  }

  await DocumentClient.transactWrite({
    TransactItems: [{
      Put: {
        TableName: TWEET_TABLE,
        Item: newTweet
      }
    }, {
      Put: {
        TableName: TIMELINE_TABLE,
        Item: {
          userId: username,
          tweetId: id,
          timestamp
        }
      }
    }, {
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
    }]
  }).promise()

  return newTweet
}