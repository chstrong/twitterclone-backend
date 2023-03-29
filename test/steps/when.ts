import { Integer } from "aws-sdk/clients/dynamodb"

require('dotenv').config()
const AWS = require('aws-sdk')

const fs = require('fs')
const velocityMapper = require('amplify-appsync-simulator/lib/velocity/value-mapper/mapper')
const velocityTemplate = require('amplify-velocity-template')
const { GraphQL, registerFragment } = require('../lib/graphql')

const awsRegion = process.env.AWS_REGION
const userPoolId = process.env.COGNITO_USERPOOL_ID
const userPoolClientId = process.env.COGNITO_USERPOOL_CLIENT_ID
const appsyncApiUrl = process.env.GRAPHQL_API_URL

const myProfileFragment = `
fragment myProfileFields on MyProfile {
    backgroundImageUrl
    bio
    birthdate
    createdAt
    followersCount
    followingCount
    id
    email
    imageUrl
    likesCount
    location
    name
    screenName
    tweetsCount
    website
}
`

const otherProfileFragment = `
fragment otherProfileFields on OtherProfile {
  id
  name
  screenName
  imageUrl
  backgroundImageUrl
  bio
  location
  website
  birthdate
  createdAt
  followersCount
  followingCount
  tweetsCount
  likesCount
}
`

const iProfileFragment = `
fragment iProfileFields on IProfile {
  ... on MyProfile {
    ... myProfileFields
  }
  ... on OtherProfile {
    ... otherProfileFields
  }
}
`

const tweetFragment = `
fragment tweetFields on Tweet {
  id
  profile {
    ... iProfileFields
  }
  createdAt
  text
  replies
  likes
  retweets
  liked
}
`

const iTweetFragment = `
fragment iTweetFields on ITweet {
  ... on Tweet {
    ... tweetFields
  }
}
`

registerFragment('myProfileFields', myProfileFragment)
registerFragment('otherProfileFields', otherProfileFragment)
registerFragment('iProfileFields', iProfileFragment)
registerFragment('tweetFields', tweetFragment)
registerFragment('iTweetFields', iTweetFragment)

const we_invoke_confirmUserSignup = async (email: String, name: String) => {

    const handler = require('../../lib/lambda/cognito/confirm-user-signup.ts').handler

    const context = {}
    const event = {
        "version": "1",
        "region": awsRegion,
        "userPoolId": userPoolId,
        "userName": email,
        "triggerSource": "PostConfirmation_ConfirmSignUp",
        "request": {
            "userAttributes": {
                "sub": email,
                "cognito:email_alias": email,
                "cognito:user_status": "CONFIRMED",
                "email_verified": "false",
                "name": name,
                "email": email
            }
        },
        "response": {}
    }

    await handler(event, context)
}

const a_user_signs_up = async (name: String, email: String, password: String) => {
    const cognito = new AWS.CognitoIdentityServiceProvider()

    const signUpResp = await cognito.signUp({
        ClientId: userPoolClientId,
        Username: email,
        Password: password,
        UserAttributes: [
            { Name: 'name', Value: name }
        ]
    }).promise()

    const username = signUpResp.UserSub
    console.log(`[${email}] - user has signed up [${username}]`)

    await cognito.adminConfirmSignUp({
        UserPoolId: userPoolId,
        Username: username,
    }).promise()

    console.log(`${username} - confirmed sign up`)

    return {
        username,
        name,
        email
    }
}

const we_invoke_an_appsync_template = (templatePath: any, context: any) => {
    const template = fs.readFileSync(templatePath, 'utf8')
    const ast = velocityTemplate.parse(template)
    const compiler = new velocityTemplate.Compile(ast, {
        valueMapper: velocityMapper.map,
        escape: false
    })
    return JSON.parse(compiler.render(context))
}

const a_user_calls_getMyProfile = async (user: any) => {
    const getMyProfile = `query getMyProfile {
      getMyProfile {
        ... myProfileFields

        tweets {
            nextToken
            tweets {
                ... iTweetFields
            }
        }
      }
    }`

    const data = await GraphQL(appsyncApiUrl, getMyProfile, {}, user.accessToken)
    const profile = data.getMyProfile

    console.log(`[${user.username}] - fetched the profile for [${user.email}]`)

    return profile
}

const a_user_calls_editMyProfile = async (user: any, input: any) => {
    const editMyProfile = `mutation editMyProfile($input: ProfileInput!) {
        editMyProfile(newProfile: $input) {
            ... myProfileFields

            tweets {
                nextToken
                tweets {
                    ... iTweetFields
                }
            }
        }
      }`

    const variables = {
        input
    }

    const data = await GraphQL(appsyncApiUrl, editMyProfile, variables, user.accessToken)
    const profile = data.editMyProfile

    console.log(`[${user.username}] - edited the profile for [${user.email}]`)

    return profile
}

const we_invoke_getImageUploadUrl = async (username: any, extension: any, contentType: any) => {
    const handler = require('../../lib/lambda/appsync/profile-get-image-upload-url').handler

    const context = {}
    const event = {
        identity: {
            username
        },
        arguments: {
            extension,
            contentType
        },
    }

    return await handler(event, context)
}

const a_user_calls_getImageUploadUrl = async (user: any, extension: string, contentType: string) => {
    const getImageUploadUrl = `query getImageUploadUrl($extension: String, $contentType: String) {
        getImageUploadUrl(extension: $extension, contentType: $contentType)
      }`
    const variables = {
        extension,
        contentType
    }

    const data = await GraphQL(process.env.GRAPHQL_API_URL, getImageUploadUrl, variables, user.accessToken)
    const url = data.getImageUploadUrl

    console.log(`[${user.username}] - got image upload url`)

    return url
}

const we_invoke_tweet = async (username: any, text: string) => {
    const handler = require('../../lib/lambda/appsync/tweet').handler

    const context = {}
    const event = {
        identity: {
            username
        },
        arguments: {
            text
        }
    }

    return await handler(event, context)
}

const we_invoke_retweet = async (username: any, tweetId: any) => {
    const handler = require('../../lib/lambda/appsync/retweet').handler

    const context = {}
    const event = {
        identity: {
            username
        },
        arguments: {
            tweetId
        }
    }

    return await handler(event, context)
}

const a_user_calls_tweet = async (user: any, text: any) => {
    const tweet = `mutation tweet($text: String!) {
        tweet(text: $text) {
            ... tweetFields
        }
      }`

    const variables = {
        text
    }

    console.log(text)

    const data = await GraphQL(process.env.GRAPHQL_API_URL, tweet, variables, user.accessToken)
    const newTweet = data.tweet

    console.log(`[${user.username}] - posted new tweet`)

    return newTweet
}

const a_user_calls_getTweets = async (user: any, userId: string, limit: Integer, nextToken: string) => {
    const getTweets = `query getTweets($userId: ID!, $limit: Int!, $nextToken: String) {
      getTweets(userId: $userId, limit: $limit, nextToken: $nextToken) {
        nextToken
        tweets {
            ... iTweetFields
        }
      }
    }`

    const variables = {
        userId,
        limit,
        nextToken
    }

    const data = await GraphQL(process.env.GRAPHQL_API_URL, getTweets, variables, user.accessToken)
    const result = data.getTweets

    console.log(`[${user.username}] - posted new tweet`)

    return result
}

const a_user_calls_getMyTimeline = async (user: any, limit: number, nextToken: string) => {
    const getMyTimeline = `query getMyTimeline($limit: Int!, $nextToken: String) {
        getMyTimeline(limit: $limit, nextToken: $nextToken) {
          nextToken
          tweets {
            ... iTweetFields
          }
        }
      }`

    const variables = {
        limit,
        nextToken
    }

    const data = await GraphQL(process.env.GRAPHQL_API_URL, getMyTimeline, variables, user.accessToken)
    const result = data.getMyTimeline

    console.log(`[${user.username}] - fetched timeline`)

    return result
}

const a_user_calls_like = async (user: any, tweetId: any) => {
    const like = `mutation like($tweetId: ID!) {
      like(tweetId: $tweetId)
    }`

    const variables = {
        tweetId
    }

    const data = await GraphQL(process.env.GRAPHQL_API_URL, like, variables, user.accessToken)
    const result = data.like

    console.log(`[${user.username}] - liked tweet [${tweetId}]`)

    return result
}

const a_user_calls_unlike = async (user: any, tweetId: any) => {
    const unlike = `mutation unlike($tweetId: ID!) {
      unlike(tweetId: $tweetId)
    }`

    const variables = {
        tweetId
    }

    const data = await GraphQL(process.env.GRAPHQL_API_URL, unlike, variables, user.accessToken)
    const result = data.unlike

    console.log(`[${user.username}] - unliked tweet [${tweetId}]`)

    return result
}

const a_user_calls_getLikes = async (user: any, userId: any, limit: any, nextToken: any) => {
    const getLikes = `query getLikes($userId: ID!, $limit: Int!, $nextToken: String) {
      getLikes(userId: $userId, limit: $limit, nextToken: $nextToken) {
        nextToken
        tweets {
          ... iTweetFields
        }
      }
    }`

    const variables = {
        userId,
        limit,
        nextToken
    }

    const data = await GraphQL(process.env.GRAPHQL_API_URL, getLikes, variables, user.accessToken)
    const result = data.getLikes

    console.log(`[${user.username}] - fetched likes`)

    return result
}


module.exports = {
    we_invoke_confirmUserSignup,
    a_user_signs_up,
    we_invoke_an_appsync_template,
    a_user_calls_getMyProfile,
    a_user_calls_editMyProfile,
    we_invoke_getImageUploadUrl,
    a_user_calls_getImageUploadUrl,
    we_invoke_tweet,
    we_invoke_retweet,
    a_user_calls_tweet,
    a_user_calls_getTweets,
    a_user_calls_getMyTimeline,
    a_user_calls_like,
    a_user_calls_unlike,
    a_user_calls_getLikes,
}

export { }