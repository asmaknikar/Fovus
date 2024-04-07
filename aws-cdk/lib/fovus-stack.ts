import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import * as amplify from 'aws-cdk-lib/aws-amplify';

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

    const amplifyApp = new cdk.aws_amplify.CfnApp(this, 'FovusAmplifyApp', {
      name: 'FovusAmplifyApp',
      repository: 'https://github.com/asmaknikar/Fovus-Frontend',
      oauthToken: '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',//TODO:move it out of here
      platform: 'WEB',
    });
    const repoBranch = new amplify.CfnBranch(this, 'MasterBranch', {
      appId: amplifyApp.attrAppId,
      branchName: 'main',
    });

    // console.log(bucket.bucketName);
    
      // bucket.grantPublicAccess('*');
    }
}
