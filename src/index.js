import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Aquí debe estar Tailwind
import App from './App'; // 👈 Esto importa App.js
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
