import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cdk from 'aws-cdk-lib';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path';
import { FilterCriteria, Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { IResource, LambdaIntegration, MockIntegration, PassthroughBehavior, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { table } from 'console';
import { CfnKeyPair, KeyPair, KeyPairFormat, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

export class FovusStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

      const dynamoTable  = new dynamodb.TableV2(this,'FovusTable',{
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        tableName: 'FovusTable',
        dynamoStream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        });

        const nodeJsFunctionProps: NodejsFunctionProps = {
          bundling: {
            externalModules: [
              'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
            ],
          },
          depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
          environment: {
            PRIMARY_KEY: 'id',
            TABLE_NAME: dynamoTable.tableName,
          },
          runtime: Runtime.NODEJS_20_X,
        }
  

      const createLambda = new NodejsFunction(this, 'createItemFunction', {
        entry: join(__dirname, 'lambdas', 'create.ts'),
        ...nodeJsFunctionProps,
      });
      dynamoTable.grantReadWriteData(createLambda);
      const createIntegration = new apigateway.LambdaIntegration(createLambda);

      const api = new apigateway.RestApi(this, this.stackName+'RestApi', {
        restApiName: 'FovusApi',
      });
      const items = api.root.addResource('items');
      items.addMethod('POST', createIntegration);
      addCorsOptions(items);
      // there is a cors in the exampkle



      const keyPair = new KeyPair(this, 'FovusKeyPair', {
        keyPairName: 'FovusKeyPair3',
        format : KeyPairFormat.PPK,
      });

    //   const vpc = new Vpc(this, 'MyVpc', {
    //     natGateways: 0,
    //   });
    //   const securityGroup = new SecurityGroup(this, 'sg', {
    //     vpc: vpc
    // });

      const nodeJsScriptFunctionProps: NodejsFunctionProps = {
        bundling: {
          externalModules: [
            'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
          ],
        },
        depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
        environment: {
          PRIMARY_KEY: 'id',
          TABLE_NAME: dynamoTable.tableName,
          KEY_PAIR_NAME: keyPair.keyPairName,
        },
        runtime: Runtime.NODEJS_20_X,
      }

      const scriptLambda = new NodejsFunction(this, 'runScriptFunction', {
        entry: join(__dirname, 'lambdas', 'script.ts'),
        ...nodeJsScriptFunctionProps,
      });
      dynamoTable.grantReadWriteData(scriptLambda);
      scriptLambda.addEventSource(new DynamoEventSource(dynamoTable, {
        startingPosition: StartingPosition.TRIM_HORIZON,
      }));
      scriptLambda.addToRolePolicy(
        new PolicyStatement({
          actions:[
            "ec2:DescribeKeyPairs",
            "ec2:CreateKeyPair",
            "ec2:DeleteKeyPair",
            "ec2:RunInstances",
            "ec2:DestroyInstances",
            "ec2:TerminateInstances",
          ],
          resources: ['*'],
        }),
      );

      
      
      



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
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        }
      ]
    });

    const amplifyApp = new cdk.aws_amplify.CfnApp(this, 'FovusAmplifyApp', {
      name: 'FovusAmplifyApp',
      repository: 'https://github.com/asmaknikar/Fovus-Frontend',
      oauthToken: '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',//TODO:move it out of here
      platform: 'WEB',
      environmentVariables: [
        {
          name: 'BUCKET_NAME',
          value: bucket.bucketName,
        },
        {
          name: 'REGION',
          value: this.region,
        }
      ]

    });
    const repoBranch = new amplify.CfnBranch(this, 'MasterBranch', {
      appId: amplifyApp.attrAppId,
      branchName: 'main',
    });


    // console.log(bucket.bucketName);
    
      // bucket.grantPublicAccess('*');
    }
}
export function addCorsOptions(apiResource: IResource) {
  apiResource.addMethod('OPTIONS', new MockIntegration({
    // In case you want to use binary media types, uncomment the following line
    // contentHandling: ContentHandling.CONVERT_TO_TEXT,
    integrationResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Credentials': "'false'",
        'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
      },
    }],
    // In case you want to use binary media types, comment out the following line
    passthroughBehavior: PassthroughBehavior.NEVER,
    requestTemplates: {
      "application/json": "{\"statusCode\": 200}"
    },
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
        'method.response.header.Access-Control-Allow-Credentials': true,
        'method.response.header.Access-Control-Allow-Origin': true,
      },
    }]
  })
}