import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post('/api/llm', { prompt });
      setResponse(res.data.response);
    } catch (err) {
      console.error(err);
      setResponse('Error connecting to backend.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '50px auto', textAlign: 'center' }}>
      <h1>PDF Q&A System</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
          style={{ width: '80%', padding: 10, fontSize: 16 }}
        />
        <button type="submit" disabled={loading} style={{ padding: 10, marginLeft: 10 }}>
          {loading ? 'Asking...' : 'Ask'}
        </button>
      </form>

      {response && (
        <div style={{ marginTop: 20, textAlign: 'left' }}>
          <h3>Answer:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}

export default App;
