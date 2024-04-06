import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';

export class FovusStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // const queue = new sqs.Queue(this, 'FovusQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });

    // const topic = new sns.Topic(this, 'FovusTopic');

    // topic.addSubscription(new subs.SqsSubscription(queue));

    // ...
    const bucket = new s3.Bucket(this, 'FovusBucket', {
      bucketName: 'fovusbucket-2',
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      // blockPublicAccess: s3.BlockPublicAccess.BLOC,
      // publicReadAccess: false,

      cors: [
        {
          allowedMethods:[s3.HttpMethods.PUT],
          allowedOrigins: ['http://localhost:*'],
          allowedHeaders: ['*'],
        }
      ]
    });
    console.log(bucket.bucketName);
    
    // bucket.grantPublicAccess('*');
  }
}
