// c:\Users\PC\Desktop\Amazon Q CLI\SamriddhiShop\frontend\src\main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // This should now correctly find App.jsx in the same folder
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
