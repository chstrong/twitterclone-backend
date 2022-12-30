require('dotenv').config()

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

module.exports = {
    we_invoke_confirmUserSignup
}