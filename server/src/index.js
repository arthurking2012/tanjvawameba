import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import apiRouter from './routes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CloudDrop File Sharing Service'
  });
});

// Serve frontend build if available
const clientDistPath = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`[Server] Serving production frontend from ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  // SPA fallback
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'შიდა სერვერის შეცდომა.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ======================================================
  🚀 CloudDrop სერვერი წარმატებით გაეშვა!
  📡 პორტი: ${PORT}
  🔗 API: http://localhost:${PORT}/api
  📁 საცავი: ${process.env.STORAGE_TYPE === 'supabase' ? 'Supabase Storage' : 'ლოკალური დისკი (server/uploads)'}
  ======================================================
  `);
});
