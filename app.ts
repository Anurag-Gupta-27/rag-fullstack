import path from 'path';
import pdf from 'pdf-parse';
import fs from 'fs';
import { embed } from './embedding';

const filePath: string = path.resolve(path.join(__dirname, 'rand_text.pdf'));
console.log('filepath : ', filePath);

const dataBuffer: Buffer = fs.readFileSync(filePath);

interface PDFResponse {
    text: string;
    // Add other properties from pdf-parse if needed
}

// Define the return type from your embed function
type EmbeddingVector = number[]; // Adjust based on your actual embedding type

pdf(dataBuffer).then((data: PDFResponse) => {
    const fileText: string = data.text;
    const cleanedText: string = fileText.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();

    if (cleanedText.length === 0) {
        throw new Error("Error extracting text");
    }
    
    return embed(cleanedText)
        .then((vectors: EmbeddingVector) => {
            // console.log("vectors: ", vectors);
            return vectors;
        })
        .catch((error: Error) => {
            console.error("Error in embedding:", error);
            throw error;
        });
}).catch((error: Error) => {
    console.error("Error reading PDF:", error);
    throw error;
});