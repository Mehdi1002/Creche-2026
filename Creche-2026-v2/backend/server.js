import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import childrenRouter from './routes/children.js';
import paymentsRouter from './routes/payments.js';
import settingsRouter from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/children', childrenRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Servir le frontend compilé
app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log('🚀 CrècheManager démarré sur http://localhost:3001');
});