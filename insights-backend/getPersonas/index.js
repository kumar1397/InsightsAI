import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-south-1" }); // Asia Pacific (Mumbai)
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const allItems = [];
    let lastEvaluatedKey = undefined;

    // Paginate through all results
    do {
      const params = {
        TableName: "Personas",
        ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey }),
      };

      const response = await docClient.send(new ScanCommand(params));
      allItems.push(...(response.Items || []));
      lastEvaluatedKey = response.LastEvaluatedKey;

    } while (lastEvaluatedKey);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        count: allItems.length,
        personas: allItems,
      }),
    };

  } catch (error) {
    console.error("Error fetching personas:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Failed to fetch personas",
        error: error.message,
      }),
    };
  }
};