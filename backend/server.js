import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PDF_FOLDER = './data';

// In-memory vector store: [{ embedding: [float], text: string }]
const vectorStore = [];

// ✅ Utility: Cosine Similarity
function cosineSimilarity(a, b) {
  if (!a || !b) return 0;
  const dot = a.reduce((sum, x, i) => sum + x * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
  const magB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
  return dot / (magA * magB);
}

// ✅ Get embedding from Ollama
async function getEmbedding(text) {
  const response = await fetch('http://localhost:11434/api/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mxbai-embed-large', // Change to your embedding model
      prompt: text
    })
  });

  const data = await response.json();
  return data.embedding;
}

// ✅ Load PDFs and create embeddings
async function loadPDFs() {
  console.log('Loading PDFs...');
  const files = await fs.readdir(PDF_FOLDER);
  let totalChunks = 0;

  for (const file of files) {
    if (file.endsWith('.pdf')) {
      const filePath = path.join(PDF_FOLDER, file);
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer);

      const text = pdfData.text;
      const chunks = text.match(/(.|[\r\n]){1,500}/g) || [];

      for (const chunk of chunks) {
        const embedding = await getEmbedding(chunk);
        vectorStore.push({ embedding, text: chunk });
      }
      totalChunks += chunks.length;
    }
  }

  console.log(`Loaded ${totalChunks} text chunks.`);
}

// ✅ Search similar chunks
function searchSimilarChunks(queryEmbedding, topK = 3) {
  const scored = vectorStore.map(({ embedding, text }) => ({
    text,
    score: cosineSimilarity(queryEmbedding, embedding)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// ✅ Generate answer from Ollama (non-streaming for now)
async function generateAnswer(prompt, contextText) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3', // Ollama model (download with `ollama pull llama3`)
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that answers questions using the provided context.'
        },
        {
          role: 'user',
          content: `Context:\n${contextText}\n\nQuestion:\n${prompt}`
        }
      ],
      stream: false
    })
  });

  const json = await response.json();
  return json.message?.content || 'No response generated.';
}

// ✅ API endpoint
app.post('/api/llm', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const queryEmbedding = await getEmbedding(prompt);
    const relevantChunks = searchSimilarChunks(queryEmbedding);
    const contextText = relevantChunks.map(c => c.text).join('\n---\n');

    const answer = await generateAnswer(prompt, contextText);
    res.json({ response: answer });
  } catch (error) {
    console.error('Error in /api/llm:', error);
    res.status(500).json({ error: 'Failed to process your request.' });
  }
});

// ✅ Start server after loading PDFs
loadPDFs()
  .then(() => {
    app.listen(5050, () => {
      console.log('Backend running on port 5050 (Ollama)');
    });
  })
  .catch(err => {
    console.error('Failed to start server:', err);
  });
