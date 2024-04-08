import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { nanoid as uuid } from 'nanoid';

const TABLE_NAME = process.env.TABLE_NAME || '';
const PRIMARY_KEY = process.env.PRIMARY_KEY || '';

const db = DynamoDBDocument.from(new DynamoDB());

const RESERVED_RESPONSE = `Error: You're using AWS reserved keywords as attributes`,
  DYNAMODB_EXECUTION_ERROR = `Error: Execution update, caused a Dynamodb error, please take a look at your CloudWatch Logs.`;

export const handler = async (event: any = {}): Promise<any> => {
  // console.log('EVENT: \n' + JSON.stringify(event, null, 2));
  // return { statusCode: 200, body: 'Hello from Lambda!' };


  if (!event.body) {
    return { statusCode: 400, body: 'invalid request, you are missing the parameter body' };
  }
  const item = typeof event.body == 'object' ? event.body : JSON.parse(event.body);
  item[PRIMARY_KEY] = uuid();
  const params = {
    TableName: TABLE_NAME,
    Item: item
  };

  try {
    await db.put(params);
    return { statusCode: 201, body: 'Successfuly inserted' };
  } catch (dbError) {
    // const errorResponse = dbError.code === 'ValidationException' && dbError.message.includes('reserved keyword') ?
    //   RESERVED_RESPONSE : DYNAMODB_EXECUTION_ERROR;
    return { statusCode: 500, body: dbError };
  }
};