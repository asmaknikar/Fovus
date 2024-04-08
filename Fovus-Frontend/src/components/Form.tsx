import React, { useState } from 'react';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from 'process';
import {post} from 'aws-amplify/api'; 

const client = new S3Client({
    region: 'us-east-2',
    credentials: {
        accessKeyId: 'AKIAU6GDWJQ4HRWF3MFW',
        secretAccessKey: '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',
    }
});
const Form: React.FC = () => {
    const [values, setValues] = useState({
        file_input: File,
        message: '',
    });
    console.log(env.BUCKET_NAME);

    const handleChange = (event : React.ChangeEvent<HTMLInputElement>) => {
        setValues({...values,[event.target.id] : event.target.value});
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.currentTarget.files) {
            setValues({...values,[event.target.id] : event.currentTarget.files[0]});
        }
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log(values);
        const command = new PutObjectCommand({
            Bucket: 'fovusbucket-2',
            Key: values.file_input.name,
            //@ts-ignore
            Body: values.file_input,
        });
        
        client.send(command)
            .then((data) => console.log("Sucessful file sent to S3",data))
            .catch((error) => console.error("Error sending file to S3",error));
        
        try{
            const restOperation  = post({
                apiName: 'fovus',
                path: 'items',
                options: {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: {
                        input_text: values.message,
                        input_file_path: `fovusbucket-2/${values.file_input.name}`,
                    },
                },
            });
            const {body} = await restOperation.response;
            const response = await body.json();
            console.log("Post Call Success", response);
        }catch(e){
            console.log("Post Call Failed", e);
        }


        
    };

    return (
        <form onSubmit={handleSubmit}>
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="name">
                message 
            </label>
            <input onChange={handleChange} className="block text-sm text-gray-900 border border-gray-300 rounded-lg dark:text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" id="message" type="text" />
            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white" htmlFor="file_input">
                Upload file
            </label>
            <input onChange={handleFileChange}
                className="block text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-blue dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                id="file_input"
                type="file"
            />
            <button className="bg-blue-50" type="submit">Submit</button>
        </form>
    );
};

export default Form;