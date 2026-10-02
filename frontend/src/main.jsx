import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { initKeepAlive } from './services/keepAlive.js';

// Pre-warm Render backend and start keep-alive ping loop
initKeepAlive();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
