require('dotenv').config()
const AWS = require('aws-sdk')
const http = require('axios')
const fs = require('fs')

jest.setTimeout(8000)

const userTable = process.env.USER_TABLE

const user_exists_in_UserTable = async (id: String) => {
    const DynamoDB = new AWS.DynamoDB.DocumentClient()

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

const user_can_upload_image_to_url = async (url: string, filepath: string, contentType: string) => {
    const data = fs.readFileSync(filepath)
    await http({
        method: 'put',
        url,
        headers: {
            'Content-Type': contentType
        },
        data
    })

    console.log('uploaded image to', url)
}

const user_can_download_image_from = async (url:string) => {
    const resp = await http(url)

    console.log('downloaded image from', url)

    return resp.data
}

module.exports = {
    user_exists_in_UserTable,
    user_can_upload_image_to_url,
    user_can_download_image_from,
}