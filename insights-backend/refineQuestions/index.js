import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { randomUUID } from "crypto";

const bedrockClient = new BedrockRuntimeClient({
  region: "us-east-1"
});

const dynamoClient = new DynamoDBClient({
  region: "ap-south-1"
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const handler = async (event) => {

  try {

    const body = JSON.parse(event.body || "{}");

    const {
      problemTitle,
      problemStatement,
      target,
      industry
    } = body;

    // Generate projectId
    const projectId = "P_" + randomUUID().slice(0, 6);

    const item = {

      PK: `PROJECT#${projectId}`,

      SK: "METADATA",

      projectId,

      projectName: problemTitle,

      refinedProblemStatement: problemStatement,

      targetConsumer: target,

      industry,

      createdAt: new Date().toISOString()

    };

    const commandDB = new PutCommand({
      TableName: "ResearchData",
      Item: item
    });

    await docClient.send(commandDB);


    const prompt = `
Problem Title:
${problemTitle}

Problem Statement:
${problemStatement}

Target Consumer:
${target}

Industry:
${industry}

Generate 5 refined research questions.

Return JSON array only.
`;

    const commandLLM = new InvokeModelCommand({
      modelId: "amazon.nova-lite-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({

        messages: [
          {
            role: "user",
            content: [
              {
                text: prompt
              }
            ]
          }
        ],

        inferenceConfig: {
          maxTokens: 300,
          temperature: 0.5
        }

      })
    });

    const response = await bedrockClient.send(commandLLM);

    const responseBody = JSON.parse(
      new TextDecoder().decode(response.body)
    );

    const outputText =
      responseBody.output.message.content[0].text;

    return {

      statusCode: 200,

      body: JSON.stringify({

        projectId,

        questions: outputText

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