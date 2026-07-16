import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Token layer first, then consumers — later files depend on these variables.
import './styles/theme.css';
import './styles/app.css';
import './styles/nodes.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
