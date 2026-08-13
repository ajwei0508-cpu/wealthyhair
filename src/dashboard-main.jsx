import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import DashboardApp from './DashboardApp.jsx';
import './index.css'; // Use existing base styles
import './DashboardApp.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DashboardApp />
  </StrictMode>,
);
