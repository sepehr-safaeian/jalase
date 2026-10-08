import { createRoot } from 'react-dom/client';

import { applyDocumentLocale } from '@/lib/i18n/ui-locale';

import App from './App';

import '@/styles/popup.css';



applyDocumentLocale();



const root = document.getElementById('root');

if (root) {

  createRoot(root).render(<App />);

}

