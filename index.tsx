
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e: any) {
  // Last resort error handler for white screens
  console.error("Critical Render Error:", e);
  rootElement.innerHTML = `
    <div style="color:white;text-align:center;padding:50px;font-family:sans-serif;">
      <h1>Application Error</h1>
      <p>Meti failed to start. Please refresh the page.</p>
      <small style="opacity:0.5">${e?.message}</small>
      <br/><br/>
      <button onclick="localStorage.clear();window.location.reload()" style="padding:10px 20px;cursor:pointer;">Reset App Data</button>
    </div>
  `;
}
