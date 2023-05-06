import { CfnJson, NestedStack, RemovalPolicy, StackProps, } from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { BlockPublicAccess, Bucket, BucketAccessControl } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { Config } from "../shared/stack-helper";
import { AnyPrincipal, Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

interface S3BucketStackProps extends StackProps {
    config: Config
}

export class S3BucketStack extends NestedStack {
    public readonly transferAssetsBucket: Bucket

    constructor(scope: Construct, id: string, props: S3BucketStackProps) {
        super(scope, id, props)

        const transferAssetsBucket = new s3.Bucket(this, 'TransferAssetsBucket', {
            bucketName: `${props.config.appName.toLowerCase()}-transfer-assets-${props.config.stage.toLowerCase()}-${props.config.randomString}`,
            transferAcceleration: true,
            //publicReadAccess: true,
            //blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
            //accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
            //accessControl: BucketAccessControl.PUBLIC_READ,
            blockPublicAccess: {
                blockPublicAcls: false,
                blockPublicPolicy: false,
                ignorePublicAcls: false,
                restrictPublicBuckets: false,
              },
              publicReadAccess: true,
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
            autoDeleteObjects: true,
        });

        this.transferAssetsBucket = transferAssetsBucket
    }
}