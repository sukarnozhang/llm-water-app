import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';
import OpenAI from 'openai';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const PDF_FOLDER = './data';

let fullText = '';

async function loadPDFs() {
  console.log('Loading PDFs...');
  const files = await fs.readdir(PDF_FOLDER);

  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const filePath = path.join(PDF_FOLDER, file);
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer);
      fullText += pdfData.text + '\n';
    }
  }
  console.log('PDF text loaded.');
}

app.post('/api/llm', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
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
      temperature: 0.2
    });

    res.json({ response: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error calling OpenAI API' });
  }
});

loadPDFs().then(() => {
  app.listen(5050, () => console.log('Server running on port 5050'));
});
