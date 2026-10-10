import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/inter';
import './index.css';
import App from './App';
import { ProveedorAuth } from './lib/auth';
import { ProveedorAvisos } from './lib/toast';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ProveedorAvisos>
        <ProveedorAuth>
          <App />
        </ProveedorAuth>
      </ProveedorAvisos>
    </BrowserRouter>
  </StrictMode>,
);
