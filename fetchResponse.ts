const { InvokeModelCommand, BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
const { Pinecone } = require("@pinecone-database/pinecone");
require('dotenv').config();

const client = new BedrockRuntimeClient({
    region: "us-east-1",
    credentials: {
        accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY,
    },
});

// Initialize Pinecone instance
async function initializePinecone() {
    const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    return pinecone;
}

// Create embedding using AWS Bedrock
async function createEmbedding(query: string) {
    if (!query || query.trim().length === 0) {
        console.error("Query is required.");
        throw new Error("Query is required.");
    }

    try {
        const command = new InvokeModelCommand({
            modelId: "amazon.titan-embed-text-v1",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({ inputText: query })
        });

        const response = await client.send(command);

        // Decode and parse response
        const responseBodyString = new TextDecoder("utf-8").decode(response.body);
        const responseBody = JSON.parse(responseBodyString);

        // Ensure embedding is returned correctly
        // console.log("Embedding created successfully:", responseBody.embedding);
        return responseBody.embedding;
    } catch (error) {
        console.error("Error creating embedding:", error);
        throw error;
    }
}

// Function to fetch query result from Pinecone
export async function fetchResult() {
    const query = "lorem ipsum"; // Your query
    const embedding = await createEmbedding(query);
    // console.log("Embedding: ", embedding); // Log the generated embedding

    const pinecone = await initializePinecone();
    const indexName = 'rag-basic';

    // Query Pinecone index
    try {
        const results = await pinecone.index(indexName).query({
            vector: embedding,
            topK: 5,
            includeMetadata: true
        });

        // console.log("Raw match data:", JSON.stringify(results.matches, null, 2));
        
        const matches = results.matches || [];
        // console.log("Pinecone query results: ", results); // Log the full response from Pinecone

        // Extract metadata from matches and handle missing data
        const relevantData = matches.length > 0
            ? matches.map((match: any) => {
                return match.metadata || { message: "No metadata available for this match." }; // Handle missing metadata
            })
            : ['No relevant data found'];

        // console.log("Relevant Data: ", relevantData);
        return relevantData;
    } catch (error) {
        console.error("Error querying Pinecone:", error);
        return ['Error querying Pinecone.'];
    }
}

fetchResult();
