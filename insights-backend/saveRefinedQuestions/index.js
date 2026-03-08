import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION
});

const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {

  try {

    const body = JSON.parse(event.body || "{}");

    const {
      projectId,
      questions
    } = body;

    if (!projectId || !questions) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "projectId and questions required"
        })
      };
    }

    const command = new PutCommand({

      TableName: process.env.TABLE_NAME,

      Item: {

        PK: `PROJECT#${projectId}`,

        SK: "METADATA",

        projectId: projectId,

        questions: questions,

        updatedAt: new Date().toISOString()

      }

    });

    await docClient.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Questions saved"
      })
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };

  }

};