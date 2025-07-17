import React, { useState } from 'react';

function App() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const askQuestion = async () => {
    const res = await fetch('http://localhost:3001/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    const data = await res.json();
    setAnswer(data.answer);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>PDF Q&A LLM</h1>
      <textarea value={question} onChange={e => setQuestion(e.target.value)} rows="3" cols="50" />
      <br />
      <button onClick={askQuestion}>Ask</button>
      <div style={{ marginTop: '20px' }}>
        <h3>Answer:</h3>
        <p>{answer}</p>
      </div>
    </div>
  );
}

export default App;
