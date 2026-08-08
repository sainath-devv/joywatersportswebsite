import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence console logs, warnings, and errors in browser DevTools for privacy & security
if (typeof window !== 'undefined') {
  const noop = () => {};
  window.console.log = noop;
  window.console.info = noop;
  window.console.warn = noop;
  window.console.error = noop;
  window.console.debug = noop;
  window.console.trace = noop;
  window.console.table = noop;
  window.console.dir = noop;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

