import { DynamoEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import {EC2, RunInstancesCommand, RunInstancesCommandInput, RunInstancesCommandOutput} from '@aws-sdk/client-ec2';
import { DynamoDBDocument, GetCommandInput } from '@aws-sdk/lib-dynamodb';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { nanoid as uuid } from 'nanoid';


const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';
const KEY_PAIR_NAME = process.env.KEY_PAIR_NAME || '';



const ec2 = new EC2({region: 'us-west-2'});
const db = DynamoDBDocument.from(new DynamoDB());


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
        ImageId : 'ami-07fe743f8d6d95a40',
        InstanceType: 't2.micro',
        // KeyName: KEY_PAIR_NAME,
        MinCount: 1,
        MaxCount: 1
    };
    
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
                putItem[PRIMARY_KEY] = uuid();
                const putParams = {
                    TableName: TABLE_NAME,
                    Item: putItem
                }
                db.put(putParams);
                
              } else {
                return { statusCode: 404 };
              }
            } catch (dbError) {
            // const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
            //   RESERVED_RESPONSE : DYNAMODB_EXECUTION_ERROR;
            console.log("Error adding item in DynamoDB", dbError);
            return { statusCode: 500, body: dbError };
          }





        if(instanceId){
            const TerminatedInstancePromise = ec2.terminateInstances({InstanceIds: [instanceId]});
            TerminatedInstancePromise.then((data: RunInstancesCommandOutput) => {
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