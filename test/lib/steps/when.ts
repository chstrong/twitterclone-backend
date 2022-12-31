require('dotenv').config()
const AWS = require('aws-sdk')

const we_invoke_confirmUserSignup = async (email: String, name: String) => {
    const handler = require('../../../lib/lambda/cognito/confirm-user-signup.ts').handler

    const context = {}
    const event = {
        "version": "1",
        "region": process.env.AWS_REGION,
        "userPoolId": process.env.COGNITO_USER_POOL_ID,
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

    const userPoolId = process.env.COGNITO_USER_POOL_ID
    // const clientId = ...

    const signUpResp = await cognito.signUp({
        ClientId: process.env.COGNITO_USER_POOL_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
            { Name: 'name', Value: name }
        ]
    }).promise()

    const username = signUpResp.UserSub
    console.log(`[${email}] - user has signed up [${name}]`)

    await cognito.adminConfirmSignUp({
        UserPoolId: userPoolId,
        Username: username,
    }).promise()

    console.log(`${email} - confirmed sign up`)

    return {
        username,
        name,
        email
    }
}

module.exports = {
    we_invoke_confirmUserSignup,
    a_user_signs_up
}

export {}