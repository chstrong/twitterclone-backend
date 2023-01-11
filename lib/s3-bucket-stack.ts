import { CfnOutput, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs'

interface S3BucketStackProps extends StackProps {
    appName: String,
    stage: String,
}

export class S3BucketStack extends Stack {
    public readonly transferAssetsBucket: Bucket

    constructor(scope: Construct, id: string, props: S3BucketStackProps) {
        super(scope, id, props)

        const transferAssetsBucket = new s3.Bucket(this, 'TransferAssetsBucket', {
            bucketName: `${props.appName.toLowerCase()}-transfer-assets-${props.stage.toLowerCase()}-yd1hdr4x`,
            transferAcceleration: true,
            cors: [
                {
                  allowedMethods: [
                    s3.HttpMethods.GET,
                    s3.HttpMethods.PUT,
                  ],
                  allowedOrigins: ['*'],
                  allowedHeaders: ['*'],
                },
            ],
            removalPolicy: RemovalPolicy.DESTROY,
        });

        this.transferAssetsBucket = transferAssetsBucket

        new CfnOutput(this, 'TransferAssetsBucketName', {
            value: transferAssetsBucket.bucketName,
        })
    }
}