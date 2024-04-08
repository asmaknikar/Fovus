import { DynamoEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import {EC2, RunInstancesCommand, RunInstancesCommandInput, RunInstancesCommandOutput} from '@aws-sdk/client-ec2';
import { SendCommandRequest, SSM } from '@aws-sdk/client-ssm';
import { DynamoDBDocument, GetCommandInput } from '@aws-sdk/lib-dynamodb';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { nanoid as uuid } from 'nanoid';


const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';
const KEY_PAIR_NAME = process.env.KEY_PAIR_NAME || '';



const ec2 = new EC2({region: 'us-east-2'});
const ssm = new SSM({region: 'us-east-2'});
const db = DynamoDBDocument.from(new DynamoDB());
const s3Url = "https://fovusbucket-2.s3.us-east-2.amazonaws.com/";


export const handler = async (event: DynamoDBStreamEvent): Promise<any> => {
    console.log("We are inside the handler for running script and creating VM");
    console.log(event.Records[0].dynamodb);
    console.log(event.Records[0].dynamodb?.Keys?.Id?.S);
    const requestedItemId = event.Records[0].dynamodb?.Keys?.Id?.S;
    if (!requestedItemId) {
      return { statusCode: 400, body: `Error: You are missing the path parameter id` };
    }

    // const keyPair = await ec2.importKeyPair({
    //     KeyName: KEY_PAIR_NAME,
    //     PublicKeyMaterial: new Uint8Array([0])})
    const instanceParams : RunInstancesCommandInput  = {
        ImageId : 'ami-084259a90ab18495c',
        InstanceType: 't2.micro',
        KeyName: KEY_PAIR_NAME,
        MinCount: 1,
        MaxCount: 1,
    };

    // const vpc = await ec2.createVpc();
    // const securityGroup = await ec2.createSecurityGroup({
    //     Description: 'Security Group for Fovus',
    //     GroupName: 'FovusSecurityGroup',
    //     VpcId: vpc.Vpc?.VpcId
    // });
    
    const instancePromise: Promise<RunInstancesCommandOutput> = ec2.runInstances(instanceParams);
    await instancePromise.then(async (data: RunInstancesCommandOutput) => {
        const instanceId = data.Instances![0].InstanceId;
        console.log("Created instance", instanceId);


          


        const getParams: GetCommandInput = {
            TableName: TABLE_NAME,
            Key: {
                [PRIMARY_KEY]: requestedItemId
            }

        }
        
        
        try {
            const response = await db.get(getParams);
            if (response.Item) {
                const putItem = response.Item;
                const scriptParamas: SendCommandRequest = {
                    DocumentName: 'EC2-bash-script',
                    InstanceIds: [instanceId?instanceId:''],
                    Parameters: {
                      'commands': [
                        `aws s3 cp s3://${putItem.input_file_path} ./temp.txt`,
                        `echo "${putItem.input_text}" >> ./temp.txt`,
                        `aws s3 cp ./temp.txt s3://${putItem.input_file_path} `,
                      ]
                    }
                  };
                  ssm.sendCommand(scriptParamas).then((data) => {
                    console.log("Command executed successfully on EC2 VM",data);
                  } ).catch((err: Error) => {
                    console.log("Error executing command on EC2 instance", err);
                  });
        
                // putItem[PRIMARY_KEY] = uuid();
                // const putParams = {
                //     TableName: TABLE_NAME,
                //     Item: putItem
                // }
                // db.put(putParams);
                console.log("Added item in DynamoDB", putItem);
                
              } else {
                console.log("No resposne Item");
              }
            } catch (dbError) {
            // const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
            //   RESERVED_RESPONSE : DYNAMODB_EXECUTION_ERROR;
            console.log("Error adding item in DynamoDB", dbError);
          }
        console.log("Instance Id is", instanceId);
        if(instanceId){
            const TerminatedInstancePromise = ec2.terminateInstances({InstanceIds: [instanceId]});
            await TerminatedInstancePromise.then((data: RunInstancesCommandOutput) => {
                console.log("Terminated instance", instanceId);
            }).catch((err: Error) => {
                console.log("Error terminating instance",err)
            });
        }

        


    }).catch((err: Error) => {
        console.log("Error creating instance", err)
    }
    );
    
    return { statusCode: 200, body: 'Hello from Lambda!' };
};