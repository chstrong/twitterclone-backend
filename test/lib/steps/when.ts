require('dotenv').config()
const ENV = require("../../../cdk-env.json")
const AWS = require('aws-sdk')

const awsRegion = ENV.GlobalConfigStack.AWSRegion
const userPoolId = ENV.CognitoUserPoolStack.UserPoolId
const userPoolClientId = ENV.CognitoUserPoolStack.UserPoolClientId

const we_invoke_confirmUserSignup = async (email: String, name: String) => {

    const handler = require('../../../lib/lambda/cognito/confirm-user-signup.ts').handler

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