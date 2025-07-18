import React, { useState } from 'react';
import axios from 'axios';

function App() {
  // State variables for user input, API response, and loading status
  const [prompt, setPrompt] = useState('');      // Stores user question
  const [response, setResponse] = useState('');  // Stores LLM answer
  const [loading, setLoading] = useState(false); // Tracks loading state

  /**
   * Handles form submission to send the prompt to the backend API
   */
  const handleSubmit = async (e) => {
    if (!prompt.trim()) return; // Ignore empty input

    setLoading(true); // Show loading state
    try {
      // Send POST request to backend with user prompt
      const res = await axios.post('/api/llm', { prompt });
      setResponse(res.data.response); // Update response from API
    } catch (err) {
      console.error('Error fetching response:', err);
      setResponse('Error connecting to backend.');
    }
    setLoading(false); // Hide loading state
  };

  return (
    <div style={{ maxWidth: 600, margin: '50px auto', textAlign: 'center' }}>
      <h1>PDF Q&A System</h1>

      {/* Input form */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)} // Update prompt as user types
          placeholder="Ask a question..."
          disabled={loading} // Disable while loading
          style={{ width: '80%', padding: 10, fontSize: 16 }}
        />
        <button
          type="submit"
          disabled={loading} // Disable while loading
          style={{ padding: 10, marginLeft: 10 }}
        >
          {loading ? 'Asking...' : 'Ask'}
        </button>
      </form>

      {/* Show response if available */}
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
