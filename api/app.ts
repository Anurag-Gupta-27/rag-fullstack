import path from 'path';
import pdf from 'pdf-parse';
import fs from 'fs';
import { embed } from './embedding'; // Make sure your embed function is asynchronous
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import mongoose from 'mongoose';
import File from './model/data.module';

const app = express();
const upload = multer({ dest: 'uploads/' });

interface PDFResponse {
    text: string;
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

mongoose.connect('mongodb://localhost:27017/rag-basic');

app.post('/api/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    const text = req.body.text;

    if (!file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
    }

    const downloadPath = path.join(__dirname, 'download');
    if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath);
    }

    const newFilePath = path.join(downloadPath, file.originalname);
    fs.renameSync(file.path, newFilePath);

    // Save file information to database
    const newFile = new File({
        fileName: file.originalname,
        filePath: newFilePath,
        queryString: text,
    });

    try {
        await newFile.save();
        console.log('File information saved to database');
    } catch (error) {
        console.error('Error saving file information to database:', error);
        res.status(500).json({ message: 'Error saving file information to database' });
        return;
    }

    const dataBuffer: Buffer = fs.readFileSync(newFilePath);

    // Function to split text into chunks
    const splitTextIntoChunks = (text: string, chunkSize: number): string[] => {
        const chunks: string[] = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize));
        }
        return chunks;
    };

    const CHUNK_SIZE = 1000; // Adjust chunk size as needed

    try {
        const data = await pdf(dataBuffer);
        const fileText = data.text;
        const cleanedText = fileText.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim();

        if (cleanedText.length === 0) {
            throw new Error('Error extracting text');
        }

        const textChunks = splitTextIntoChunks(cleanedText, CHUNK_SIZE);

        // Process the embeddings for each chunk
        const embeddingsPromises = textChunks.map(chunk => embed(chunk, text)); // Assuming embed is async and takes text as a second parameter

        const vectorsArray = await Promise.all(embeddingsPromises);

        console.log('Embeddings for each chunk: ', vectorsArray);
        // You can now save these vectors to Pinecone or process them further

        // Respond with a success message after processing
        res.status(200).json({ message: 'File and text uploaded successfully', embeddings: vectorsArray });
    } catch (error) {
        console.error('Error processing PDF:', error);
        res.status(500).json({ message: 'Error processing PDF or embeddings' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
