import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';
import OpenAI from 'openai';

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors());           // Enable Cross-Origin Resource Sharing
app.use(express.json());   // Parse incoming JSON requests

// Initialize OpenAI API client with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Folder containing PDF files
const PDF_FOLDER = './data';

// Variable to store combined text from all PDFs
let fullText = '';

/**
 * Load and extract text from all PDFs in the PDF_FOLDER
 */
async function loadPDFs() {
  console.log('Loading PDFs...');
  const files = await fs.readdir(PDF_FOLDER);

  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const filePath = path.join(PDF_FOLDER, file);
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer); // Extract text from PDF
      fullText += pdfData.text + '\n'; // Append text to global variable
    }
  }
  console.log('PDF text loaded.');
}

/**
 * API endpoint for handling user queries
 * - Receives a prompt from the client
 * - Sends a request to OpenAI API with the combined PDF text + user question
 */
app.post('/api/llm', async (req, res) => {
  const { prompt } = req.body;

  // Validate request
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    // Call OpenAI Chat Completion API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Lightweight GPT-4 variant
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant answering based on the provided PDF content.'
        },
        {
          role: 'user',
          content: `PDF Content:\n${fullText}\n\nQuestion:\n${prompt}`
        }
      ],
      max_tokens: 500,
      temperature: 0.2 // Lower temperature for factual answers
    });

    // Send the first choice back to the client
    res.json({ response: response.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ error: 'Error calling OpenAI API' });
  }
});

/**
 * Load PDFs and start the server
 */
loadPDFs().then(() => {
  app.listen(5050, () => console.log('✅ Server running on http://localhost:5050'));
});
