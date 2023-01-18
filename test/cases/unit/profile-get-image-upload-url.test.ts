require('dotenv').config()
const when = require('../../steps/when')
const chance = require('chance').Chance()

const bucketName = process.env.TRANSFER_BUCKET

describe('When getImageUploadUrl runs', () => {
  it.each([
    [ '.png', 'image/png' ],
    [ '.jpeg', 'image/jpeg' ],
    [ '.png', null ],
    [ null, 'image/png' ],
    [ null, null ],
  ])('Returns a signed S3 url for extension %s and content type %s', async (extension, contentType) => {
    const username = chance.guid()
    const signedUrl = await when.we_invoke_getImageUploadUrl(username, extension, contentType)

    const regex = new RegExp(`https://${bucketName}.s3-accelerate.amazonaws.com/${username}/.*${extension || ''}\?.*Content-Type=${contentType ? contentType.replace('/', '%2F') : 'image%2Fjpeg'}.*`)
    expect(signedUrl).toMatch(regex)
  })
})

export {}