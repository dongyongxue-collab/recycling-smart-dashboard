import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRecyclingSnapshot, RECYCLING_POLL_INTERVAL_MS } from './recycling-store.js';
import { RECYCLING_CATEGORIES, CITY_PRIORITY } from './recycling-config.js';
import type { RecyclingKnowledgeSnapshot } from './types.js';

const port = Number(process.env.PORT ?? 8787);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const indexHtml = path.join(distDir, 'index.html');

const app = express();
app.use(cors());
app.use(express.json());

let snapshot: RecyclingKnowledgeSnapshot = {
  fetchedAt: new Date().toISOString(),
  cityPriority: CITY_PRIORITY,
  globalNews: {
    domesticNews: [],
    internationalNews: [],
  },
  categories: RECYCLING_CATEGORIES.map((item) => ({
    id: item.id,
    name: item.name,
    quotes: [],
    domesticNews: [],
    internationalNews: [],
    detail: {
      subcategories: item.subcategories,
      costStructure: item.costStructure,
      processFlow: item.processFlow,
      regulations: item.regulations,
    },
    analytics: {
      history: [],
      regionBars: [],
      subcategoryShares: [],
    },
  })),
};

let refreshing = false;

const refreshSnapshot = async () => {
  if (refreshing) {
    return;
  }

  refreshing = true;
  try {
    snapshot = await buildRecyclingSnapshot(snapshot);
  } catch (error) {
    console.error('recycling snapshot refresh failed:', error);
  } finally {
    refreshing = false;
  }
};

app.get('/api/health', (_req, res) => {
  const totalQuotes = snapshot.categories.reduce((sum, item) => sum + item.quotes.length, 0);
  res.json({
    ok: true,
    serverTime: new Date().toISOString(),
    fetchedAt: snapshot.fetchedAt,
    cityPriority: snapshot.cityPriority,
    categoryCount: snapshot.categories.length,
    totalQuotes,
  });
});

app.get('/api/recycling-dashboard', (_req, res) => {
  res.json(snapshot);
});

if (existsSync(indexHtml)) {
  app.use(express.static(distDir));

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(indexHtml);
  });
}

void refreshSnapshot();
setInterval(() => {
  void refreshSnapshot();
}, RECYCLING_POLL_INTERVAL_MS);

app.listen(port, () => {
  console.log(`Recycling server running on http://localhost:${port}`);
});
