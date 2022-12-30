require('dotenv').config()
const AWS = require('aws-sdk')

const user_exists_in_UserTable = async (id: String) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

    console.log(`looking for user ${id} in table ${process.env.USER_TABLE}`)
    const resp = await DynamoDB.get({
        TableName: process.env.USER_TABLE,
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