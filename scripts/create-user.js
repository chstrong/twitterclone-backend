const AWS = require('aws-sdk');
require('dotenv').config()

const csp = new AWS.CognitoIdentityServiceProvider({ 
    region: process.env.AWS_REGION 
});

function createCognitoUser(username, password) {
    const params = {
        UserPoolId: process.env.COGNITO_USERPOOL_ID,
        Username: username,
        TemporaryPassword: password,
        DesiredDeliveryMediums: ["EMAIL"],
        ForceAliasCreation: true,
        UserAttributes: [
            {
                Name: "email",
                Value: username,
            }
        ]
    };

    csp.adminCreateUser(params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
        } else {
            console.log(data);

            const uname = data.User.Username
            
            const setPasswordParams = {
                UserPoolId: process.env.COGNITO_USERPOOL_ID,
                Username: uname,
                Password: password,
                Permanent: true,
            };

            csp.adminSetUserPassword(setPasswordParams, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                } else {
                    console.log("User confirmed");
                }
            });
        }
    });
}

function deleteCognitoUser(username) {
    csp.adminDeleteUser({
        UserPoolId: process.env.COGNITO_USERPOOL_ID,
        Username: username,
    }).promise();
}

const send_tweet = async (username, text) => {
    const handler = require('../lib/lambda/appsync/tweet').handler

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

if(process.argv[2] === "add") {
    createCognitoUser("test@test.com", "123456")
} else if(process.argv[2] == "delete") {
    deleteCognitoUser('test@test.com')
} else if(process.argv[2] == "send-tweet") {
    const reply = send_tweet("test@test.com", "this is my tweet")
    console.log(reply)
} else {
    console.log("Use add or delete")
}