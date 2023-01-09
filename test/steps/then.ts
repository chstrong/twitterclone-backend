require('dotenv').config()
const ENV = require("../../cdk-env.json")
const AWS = require('aws-sdk')

const user_exists_in_UserTable = async (id: String) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    const userTable = ENV.DynamoDbTableStack.UserTableName

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

module.exports = {
    user_exists_in_UserTable
}