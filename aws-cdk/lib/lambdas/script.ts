import {EC2, RunInstancesCommand, RunInstancesCommandInput, RunInstancesCommandOutput} from '@aws-sdk/client-ec2';

const ec2 = new EC2({region: 'us-west-2'});
const instanceParams : RunInstancesCommandInput  = {
    ImageId : 'fovus-ami',
    InstanceType: 't2.micro',
    KeyName: 'test',
    MinCount: 1,
    MaxCount: 1
};


export const handler = async (event: any = {}): Promise<any> => {
    const instancePromise: Promise<RunInstancesCommandOutput> = ec2.runInstances(instanceParams);
    instancePromise.then((data: RunInstancesCommandOutput) => {
        const instanceId = data.Instances![0].InstanceId;
        console.log("Created instance", instanceId);
        if(instanceId){
            const TerminatedInstancePromise = ec2.terminateInstances({InstanceIds: [instanceId]});
            TerminatedInstancePromise.then((data: RunInstancesCommandOutput) => {
                console.log("Terminated instance", instanceId);
            }).catch((err: Error) => {
                console.log("Error terminating instance",err)
            });
        }
        


    }).catch((err: Error) => {
        console.log(err)
    }
    );
    
    return { statusCode: 200, body: 'Hello from Lambda!' };
};