require('dotenv').config()
const AWS = require('aws-sdk')
const chance = require('chance').Chance()
const DocumentClient = new AWS.DynamoDB.DocumentClient()
const velocityUtil = require('amplify-appsync-simulator/lib/velocity/util')

const userPoolId = process.env.COGNITO_USERPOOL_ID
const userPoolClientId = process.env.COGNITO_USERPOOL_CLIENT_ID
const relationshipTable = process.env.RELATIONSHIP_TABLE

const a_random_user = () => {
    const firstName = chance.first({ nationality: 'en' })
    const lastName = chance.last({ nationality: 'en' })
    const suffix = chance.string({ length: 4, pool: 'abcdefghijklmnopqrstuvwxyz' })

    const name = `${firstName} ${lastName} ${suffix}`
    const password = chance.string({ length: 6 })
    const email = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${suffix}@test.com`

    return { name, password, email }
}

const an_appsync_context = (identity: any, args: any, result: any, source: any, info: any, prev: any) => {
    const util = velocityUtil.create([], new Date(), Object())
    const context = {
        identity: identity,
        args: args,
        arguments: args,
        result,
        source,
        info,
        prev
    }
    return {
        context: context,
        ctx: context,
        util: util,
        utils: util
    }
}

const an_authenticated_user = async () => {
    const { name, email, password } = a_random_user()

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
        Username: username
    }).promise()

    console.log(`[${email}] - confirmed sign up`)

    const auth = await cognito.initiateAuth({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: userPoolClientId,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password
        }
    }).promise()

    console.log(`[${email}] - signed in`)

    return {
        username,
        name,
        email,
        password,
        idToken: auth.AuthenticationResult.IdToken,
        accessToken: auth.AuthenticationResult.AccessToken
    }
}

const a_user_follows_another = async (userId: any, otherUserId: any) => {
    await DocumentClient.put({
        TableName: relationshipTable,
        Item: {
            userId,
            sk: `FOLLOWS_${otherUserId}`,
            otherUserId,
            createdAt: new Date().toJSON()
        }
    }).promise()
}

module.exports = {
    a_random_user,
    an_appsync_context,
    an_authenticated_user,
    a_user_follows_another,
}

export { }