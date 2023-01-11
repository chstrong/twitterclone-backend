import { Handler } from 'aws-lambda'
const S3 = require('aws-sdk/clients/s3')
const s3 = new S3({ useAccelerateEndpoint: true })
const ulid = require('ulid')

const bucketName:string = process.env.BUCKET_NAME!

export const handler: Handler = async (event) => {
    console.log(event);

    return await create(event);
}

async function create(event: any) {
    const id = ulid.ulid()
    let key = `${event.identity.username}/${id}`
  
    const extension = event.arguments.extension
    if (extension) {
      if (extension.startsWith('.')) {
        key += extension
      } else {
        key += `.${extension}`
      }
    }
  
    const contentType = event.arguments.contentType || 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      throw new Error('content type should be an image')
    }
  
    const params = {
      Bucket: bucketName,
      Key: key,
      ACL: 'public-read',
      ContentType: contentType
    }
    const signedUrl = s3.getSignedUrl('putObject', params) // or getPresignedPostUrl for more params
    return signedUrl
}