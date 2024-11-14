const { fetchResult } = require('./fetchResponse');
const { InvokeModelCommand, BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
const { Pinecone } = require("@pinecone-database/pinecone");
import type { Pinecone as PineconeType } from "@pinecone-database/pinecone";
require('dotenv').config();

const client = new BedrockRuntimeClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY,
    },
});

async function initializePinecone() {
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    return pinecone;
}

async function checkOrCreateIndex(pinecone: PineconeType, indexName: string, dimension: number) {
    const indexList = await pinecone.listIndexes();
    if (!indexList?.indexes?.map(index => index.name).includes(indexName)) {
        await pinecone.createIndex({
            name: indexName,
            dimension,
            metric: 'cosine',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                }
            }
        });
        console.log(`Index ${indexName} created.`);
    } else {
        console.log(`Index ${indexName} already exists.`);
    }
}

export async function embed(text: string) {
    if (!text || text.trim().length === 0) {
        console.error("Text is required.");
        throw new Error("Text is required.");
    }

    try {
        const command = new InvokeModelCommand({
            modelId: "amazon.titan-embed-text-v1",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({ inputText: text })
        });

        const response = await client.send(command);

        // Decode and parse response
        const responseBodyString = new TextDecoder("utf-8").decode(response.body);
        const responseBody = JSON.parse(responseBodyString);

        // Prepare the embedding data
        const embeddingData = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            values: responseBody.embedding,
            metadata: { text }
        };

        // Initialize Pinecone client
        const pinecone = await initializePinecone();
        const indexName = 'rag-basic';
        const dimension = responseBody.embedding.length;

        // Check or create the index
        await checkOrCreateIndex(pinecone, indexName, dimension);
        console.log(`Checked or created index: ${indexName}`);

        await pinecone.index(indexName).upsert([
            {
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                values: embeddingData.values,
                metadata: embeddingData.metadata
            }
        ]);

        // console.log("Embedding successfully stored in Pinecone.");
        // return responseBody.embedding;

        const relevantData = await fetchResult();
        console.log("Fetched relevant data: ", relevantData);
        return relevantData;

    } catch (error) {
        console.error("Error creating embedding:", error);
        throw error;
    }
}
