import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ClusterProvider } from './context/ClusterContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClusterProvider>
      <App />
    </ClusterProvider>
  </React.StrictMode>
);
