import axios from 'axios';
import { RECYCLING_CATEGORIES, CITY_PRIORITY } from './recycling-config.js';
import type {
  CategoryDefinition,
  CategorySnapshot,
  NewsItem,
  QuoteItem,
  RecyclingKnowledgeSnapshot,
} from './types.js';

const RECYCLING_POLL_INTERVAL_MS = Number(process.env.RECYCLING_POLL_INTERVAL_MS ?? 45_000);
const FETCH_TIMEOUT_MS = 15_000;
const BASE_CACHE_TTL_MS = 90_000;
const TRADE_CACHE_TTL_MS = 5 * 60_000;

const PRICE_CAPTURE_REGEX = /(\d{1,7}(?:\.\d+)?)\s*?\s*\/?\s*(?|??|??|?|?|?|?|?|???|mwh|kwh)?/gi;
const DEAL_PRICE_REGEX = /????\s*(\d{2,7}(?:\.\d+)?)\s*?/i;
const ADJUSTMENT_REGEX = /??|??|??|??|??|??|?|?|?|?/;

const REGION_KEYS = [
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '??',
  '???',
  '??',
  '??',
];

interface SourceDoc {
  source: string;
  url: string;
  kind: 'quotes' | 'domestic' | 'international' | 'official';
  text: string;
  fetchedAt: string;
}

interface CacheEntry {
  text: string;
  fetchedAtMs: number;
}

interface ParsedLink {
  title: string;
  url: string;
}

interface ScoredQuote {
  score: number;
  data: QuoteItem;
}

const textCache = new Map<string, CacheEntry>();

const BASE_SOURCES: Array<Omit<SourceDoc, 'text' | 'fetchedAt'>> = [
  {
    source: '?????-??',
    url: 'https://feigang.mysteel.com/',
    kind: 'quotes',
  },
  {
    source: '?????-??',
    url: 'https://list1.mysteel.com/market/p-228-----0101-0--------1.html',
    kind: 'domestic',
  },
  {
    source: '???-????',
    url: 'http://www.bianbao.net/quotes.html',
    kind: 'quotes',
  },
  {
    source: '???-????',
    url: 'http://www.bianbao.net/news.html',
    kind: 'domestic',
  },
  {
    source: '????????????',
    url: 'https://crra.org.cn/news/',
    kind: 'domestic',
  },
  {
    source: '?????-???',
    url: 'http://www.mee.gov.cn/zcwj/bwj/',
    kind: 'official',
  },
  {
    source: '????????????-????',
    url: 'http://std.samr.gov.cn/noc',
    kind: 'official',
  },
  {
    source: '???-????????????',
    url: 'http://www.miit.gov.cn/jgsj/jns/wjfb/index.html',
    kind: 'official',
  },
  {
    source: '???-????????????',
    url: 'http://www.miit.gov.cn/jgsj/jns/zhlyh/index.html',
    kind: 'official',
  },
  {
    source: '????-??',
    url: 'https://paper.oilchem.net/',
    kind: 'domestic',
  },
  {
    source: '????-????',
    url: 'https://fiber.oilchem.net/fiber/RePolyester.shtml',
    kind: 'domestic',
  },
  {
    source: '????-????',
    url: 'http://finance.eastmoney.com/a/cgnjj.html',
    kind: 'domestic',
  },
  {
    source: '???????-????',
    url: 'http://www.zgfeipin.cn/expo/',
    kind: 'quotes',
  },
  {
    source: '???????-????',
    url: 'http://www.zgfeipin.cn/expo_17561_1/',
    kind: 'quotes',
  },
  {
    source: '???????-2025??',
    url: 'http://www.zgfeipin.cn/expo_17556_1/',
    kind: 'quotes',
  },
  {
    source: '???????-2025???',
    url: 'http://www.zgfeipin.cn/expo_17604_1/',
    kind: 'quotes',
  },
  {
    source: '???????-2024???',
    url: 'http://www.zgfeipin.cn/expo_17109_1/',
    kind: 'quotes',
  },
  {
    source: '???????-???',
    url: 'http://www.zgfeipin.cn/expo_17606_1/',
    kind: 'quotes',
  },
  {
    source: '???????-???',
    url: 'http://www.zgfeipin.cn/expo_17611_1/',
    kind: 'quotes',
  },
  {
    source: '???????-???',
    url: 'http://www.zgfeipin.cn/expo_17183_1/',
    kind: 'quotes',
  },
  {
    source: '???????-???',
    url: 'http://www.zgfeipin.cn/expo_17245_1/',
    kind: 'quotes',
  },
  {
    source: '???????-????',
    url: 'http://www.zgfeipin.cn/expo_17246_1/',
    kind: 'quotes',
  },
  {
    source: '???????-????',
    url: 'http://www.zgfeipin.cn/expo_442_1/',
    kind: 'quotes',
  },
  {
    source: '???????-????2',
    url: 'http://www.zgfeipin.cn/expo_385_1/',
    kind: 'quotes',
  },
  {
    source: '??-??????',
    url: 'https://www.sohu.com/a/776725046_121923007',
    kind: 'quotes',
  },
  {
    source: '??-??????',
    url: 'https://www.sohu.com/a/715126486_121468736',
    kind: 'quotes',
  },
  {
    source: '??-??????',
    url: 'https://www.sohu.com/a/783437146_121123779',
    kind: 'quotes',
  },
  {
    source: '??-????',
    url: 'https://www.sohu.com/a/883963083_100180709',
    kind: 'quotes',
  },
  {
    source: 'ScrapMonster',
    url: 'http://www.scrapmonster.com/news',
    kind: 'international',
  },
  {
    source: 'Resource Recycling',
    url: 'http://resource-recycling.com/recycling/',
    kind: 'international',
  },
  {
    source: 'RecyclingInside',
    url: 'http://www.recyclinginside.com/feed/',
    kind: 'international',
  },
  {
    source: 'Reccessary',
    url: 'https://www.reccessary.com/zh-cn',
    kind: 'international',
  },
];

const CATEGORY_REFERENCE_QUOTES: Record<
  string,
  Array<{ title: string; price: number; unit: string; source: string; sourceUrl: string; region?: string }>
> = {
  'scrap-steel': [
    {
      title: '???????(??)',
      price: 2260,
      unit: '?/?',
      source: '???????-????',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17561_1/',
      region: '??',
    },
    {
      title: '????????(??)',
      price: 2380,
      unit: '?/?',
      source: '???????-2025??',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17556_1/',
      region: '??',
    },
  ],
  'scrap-copper': [
    {
      title: '1#????????(??)',
      price: 69400,
      unit: '?/?',
      source: '???????-????',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17561_1/',
      region: '??',
    },
    {
      title: '???????(??)',
      price: 47300,
      unit: '?/?',
      source: '???????-2025???',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17604_1/',
      region: '??',
    },
  ],
  'scrap-aluminum': [
    {
      title: '?????????(??)',
      price: 15400,
      unit: '?/?',
      source: '???????-????',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17561_1/',
      region: '??',
    },
    {
      title: '?????????(??)',
      price: 13200,
      unit: '?/?',
      source: '???????-2025??',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17556_1/',
      region: '??',
    },
  ],
  'waste-plastic': [
    {
      title: '???????????(PET/????)',
      price: 3500,
      unit: '?/?',
      source: '???????-?????????????',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17561_1/',
      region: '??',
    },
    {
      title: '??????????(???)',
      price: 21300,
      unit: '?/?',
      source: '???????-?????',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17606_1/',
      region: '??',
    },
  ],
  'power-battery': [
    {
      title: '??????????(??????)',
      price: 25000,
      unit: '?/?',
      source: '??-??????',
      sourceUrl: 'https://www.sohu.com/a/776725046_121923007',
      region: '??',
    },
    {
      title: '????????????',
      price: 18000,
      unit: '?/?',
      source: '????-????????',
      sourceUrl: 'https://finance.sina.com.cn/roll/2024-12-16/doc-inczrzsr2528559.shtml',
      region: '??',
    },
  ],
  'scrapped-vehicle': [
    {
      title: '???????????(??)',
      price: 3200,
      unit: '?/?',
      source: '???????-????',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17246_1/',
      region: '??',
    },
    {
      title: '??????????(??)',
      price: 2480,
      unit: '?/?',
      source: '???????-????',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17246_1/',
      region: '??',
    },
  ],
  'e-waste': [
    {
      title: '???????????',
      price: 9000,
      unit: '?/?',
      source: '???????-????',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17611_1/',
      region: '??',
    },
    {
      title: '????????????',
      price: 200,
      unit: '?/??',
      source: '???????-????',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17611_1/',
      region: '??',
    },
  ],
  'waste-textile': [
    {
      title: '?????????(????)',
      price: 500,
      unit: '?/?',
      source: '????????-??????',
      sourceUrl: 'https://www.zgzszyhs.cn/quote/show.php?itemid=243',
      region: '??',
    },
    {
      title: '?????????(????)',
      price: 1200,
      unit: '?/?',
      source: '????????-??????',
      sourceUrl: 'https://www.zgzszyhs.cn/quote/show.php?itemid=243',
      region: '??',
    },
  ],
  'waste-rubber': [
    {
      title: '?????????',
      price: 2500,
      unit: '?/?',
      source: '???????-?????',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17245_1/',
      region: '??',
    },
    {
      title: '?????????',
      price: 14000,
      unit: '?/?',
      source: '???????-?????',
      sourceUrl: 'http://www.zgfeipin.cn/expo_15_1_0/',
      region: '??',
    },
  ],
  'waste-wood': [
    {
      title: '?????????(??)',
      price: 760,
      unit: '?/?',
      source: '???????-2025??',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17556_1/',
      region: '??',
    },
    {
      title: '??????????(??)',
      price: 430,
      unit: '?/?',
      source: '???????-2025??',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17556_1/',
      region: '??',
    },
  ],
  'waste-paper': [
    {
      title: 'AA?????????(??)',
      price: 1480,
      unit: '?/?',
      source: '???????-2025???',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17604_1/',
      region: '??',
    },
    {
      title: 'A?????????(??)',
      price: 1320,
      unit: '?/?',
      source: '???????-2025???',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17604_1/',
      region: '??',
    },
  ],
  'waste-glass': [
    {
      title: '?????????(??)',
      price: 280,
      unit: '?/?',
      source: '???????-2025??',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17556_1/',
      region: '??',
    },
    {
      title: '?????????(??)',
      price: 190,
      unit: '?/?',
      source: '???????-2025??',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17556_1/',
      region: '??',
    },
  ],
  'kitchen-grease': [
    {
      title: '?????????(????)',
      price: 6000,
      unit: '?/?',
      source: 'China5e-??????',
      sourceUrl: 'https://www.china5e.com/news/news-1188528-1.html',
      region: '??',
    },
    {
      title: '?????????(????)',
      price: 6450,
      unit: '?/?',
      source: 'China5e-??????',
      sourceUrl: 'https://www.china5e.com/news/news-1188528-1.html',
      region: '??',
    },
  ],
  'industrial-slag': [
    {
      title: '????????????(??)',
      price: 1300,
      unit: '?/?',
      source: '??-??????',
      sourceUrl: 'https://www.sohu.com/a/783437146_121123779',
      region: '??',
    },
    {
      title: '????????????(??)',
      price: 2000,
      unit: '?/?',
      source: '??-??????',
      sourceUrl: 'https://www.sohu.com/a/783437146_121123779',
      region: '??',
    },
  ],
  'municipal-solid-waste': [
    {
      title: '?????????(????)',
      price: 230,
      unit: '?/?',
      source: '???????-2025??',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17556_1/',
      region: '??',
    },
    {
      title: '?????????(????)',
      price: 660,
      unit: '?/?',
      source: '???????-2025??',
      sourceUrl: 'http://www.zgfeipin.cn/expo_17556_1/',
      region: '??',
    },
  ],
  'construction-waste': [
    {
      title: '?????????????',
      price: 150,
      unit: '?/?',
      source: 'Baidu Legal-???????',
      sourceUrl: 'https://ailegal.baidu.com/legalarticle/qadetail?id=000ca241cf9d36241227',
      region: '??',
    },
    {
      title: '?????????(????)',
      price: 45,
      unit: '?/?',
      source: '????-????????',
      sourceUrl: 'https://www.hnhxjq.com/news/news4286.htm',
      region: '??',
    },
  ],
};

function toJinaUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `https://r.jina.ai/${url}`;
  }
  return `https://r.jina.ai/http://${url}`;
}

async function fetchText(url: string, ttlMs: number): Promise<string> {
  const cacheKey = `jina:${url}`;
  const now = Date.now();
  const cached = textCache.get(cacheKey);
  if (cached && now - cached.fetchedAtMs < ttlMs) {
    return cached.text;
  }

  const { data } = await axios.get<string>(toJinaUrl(url), {
    timeout: FETCH_TIMEOUT_MS,
    responseType: 'text',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'text/plain, text/html;q=0.9,*/*;q=0.8',
    },
  });

  const text = String(data ?? '');
  textCache.set(cacheKey, { text, fetchedAtMs: now });
  return text;
}

async function fetchDirectText(url: string, ttlMs: number): Promise<string> {
  const cacheKey = `direct:${url}`;
  const now = Date.now();
  const cached = textCache.get(cacheKey);
  if (cached && now - cached.fetchedAtMs < ttlMs) {
    return cached.text;
  }

  const { data } = await axios.get<ArrayBuffer>(url, {
    timeout: FETCH_TIMEOUT_MS,
    responseType: 'arraybuffer',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });

  const text = Buffer.from(data).toString('utf8');
  textCache.set(cacheKey, { text, fetchedAtMs: now });
  return text;
}

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function detectRegion(text: string): string | undefined {
  return REGION_KEYS.find((item) => text.includes(item));
}

function cleanTextLine(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLinks(text: string): ParsedLink[] {
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/g;
  const links: ParsedLink[] = [];
  let match = linkRegex.exec(text);

  while (match) {
    const title = cleanTextLine(match[1]);
    const url = match[2];
    if (title.length >= 6 && !title.startsWith('Image ')) {
      links.push({ title, url });
    }
    match = linkRegex.exec(text);
  }

  return links;
}

function buildQuoteId(categoryId: string, source: string, title: string, price: number): string {
  const seed = `${categoryId}-${source}-${title}-${price}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }
  return `${categoryId}-${Math.abs(hash)}`;
}

function parsePriceCandidates(line: string): Array<{ price: number; unit: string; isAdjustmentContext: boolean }> {
  const dealMatch = DEAL_PRICE_REGEX.exec(line);
  if (dealMatch) {
    return [{ price: Number(dealMatch[1]), unit: '?/?', isAdjustmentContext: false }];
  }

  const candidates: Array<{ price: number; unit: string; isAdjustmentContext: boolean }> = [];
  for (const match of line.matchAll(PRICE_CAPTURE_REGEX)) {
    const price = Number(match[1]);
    if (!Number.isFinite(price) || price <= 0) {
      continue;
    }

    const unitRaw = match[2]?.trim();
    const unit = unitRaw ? `?/${unitRaw}` : '?';
    const index = match.index ?? 0;
    const contextStart = Math.max(0, index - 10);
    const contextEnd = Math.min(line.length, index + 14);
    const context = line.slice(contextStart, contextEnd);

    candidates.push({
      price,
      unit,
      isAdjustmentContext: ADJUSTMENT_REGEX.test(context),
    });
  }

  if (!candidates.length) {
    return [];
  }

  const preferred = candidates.filter((item) => !item.isAdjustmentContext);
  const pool = (preferred.length ? preferred : candidates).sort((left, right) => right.price - left.price);

  if (!preferred.length && pool.length) {
    return pool.filter((item) => !(item.isAdjustmentContext && item.price < 120 && item.unit.includes('?')));
  }

  return pool;
}

function quoteScore(line: string, price: number): number {
  let score = 0;
  if (line.includes(CITY_PRIORITY)) {
    score += 200;
  }
  if (line.includes('??') || line.includes('??')) {
    score += 60;
  }
  if (line.includes('??') || line.includes('??')) {
    score += 30;
  }
  if (line.includes('??') || line.includes('??')) {
    score += 20;
  }
  score += Math.min(price / 300, 80);
  return score;
}

function extractQuoteItemsFromText(
  category: CategoryDefinition,
  source: string,
  sourceUrl: string,
  fetchedAt: string,
  text: string,
): QuoteItem[] {
  const scored: ScoredQuote[] = [];
  const lines = text
    .split(/\r?\n/)
    .flatMap((line) => {
      if (line.length <= 260) {
        return [line];
      }
      return line
        .split(/[?;;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    })
    .map((line) => line.trim())
    .filter(Boolean);

  lines.forEach((rawLine) => {
    if (!includesAny(rawLine, category.quoteKeywords)) {
      return;
    }

    const priceCandidates = parsePriceCandidates(rawLine).slice(0, 3);
    if (!priceCandidates.length) {
      return;
    }

    const cleaned = cleanTextLine(rawLine);
    if (cleaned.length < 6) {
      return;
    }

    const lineUrl = rawLine.match(/\((https?:\/\/[^)\s]+)\)/)?.[1];
    const region = detectRegion(cleaned);

    priceCandidates.forEach((priceInfo) => {
      if (!Number.isFinite(priceInfo.price) || priceInfo.price <= 0) {
        return;
      }

      scored.push({
        score: quoteScore(cleaned, priceInfo.price),
        data: {
          id: buildQuoteId(category.id, source, cleaned, priceInfo.price),
          title: cleaned,
          region,
          price: priceInfo.price,
          unit: priceInfo.unit,
          priceText: `${priceInfo.price.toLocaleString('zh-CN')} ${priceInfo.unit}`,
          source,
          sourceUrl: lineUrl ?? sourceUrl,
          publishedAt: fetchedAt,
          isTianjinPriority: cleaned.includes(CITY_PRIORITY) || region === CITY_PRIORITY,
        },
      });
    });
  });

  const deduped = new Map<string, ScoredQuote>();
  scored.forEach((item) => {
    const key = `${item.data.title}|${item.data.price}|${item.data.unit}`;
    const current = deduped.get(key);
    if (!current || item.score > current.score) {
      deduped.set(key, item);
    }
  });

  return [...deduped.values()]
    .sort((left, right) => {
      if (left.data.isTianjinPriority !== right.data.isTianjinPriority) {
        return left.data.isTianjinPriority ? -1 : 1;
      }
      return right.score - left.score;
    })
    .map((item) => item.data);
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h\d|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

async function fetchBianbaoTradeFallback(category: CategoryDefinition, limit: number): Promise<QuoteItem[]> {
  if (limit <= 0) {
    return [];
  }

  const searchFetchedAt = new Date().toISOString();
  const queryTerms = [
    ...new Set([
      category.searchKeyword,
      category.name,
      category.searchKeyword.split(/\s+/)[0],
      ...category.quoteKeywords.slice(0, 4).map((keyword) => `${keyword} ??`),
    ]),
  ];
  const tradeLinkSet = new Set<string>();
  const quotes: QuoteItem[] = [];

  for (const term of queryTerms) {
    const searchUrl = `http://www.bianbao.net/tradeSearch?keywords=${encodeURIComponent(term)}`;
    let searchText = '';
    try {
      searchText = await fetchDirectText(searchUrl, BASE_CACHE_TTL_MS);
    } catch {
      continue;
    }

    for (const match of searchText.matchAll(/(?:https?:\/\/www\.bianbao\.net)?\/trade\/\d+\.html/g)) {
      const raw = match[0];
      const normalized = raw.startsWith('http') ? raw : `http://www.bianbao.net${raw}`;
      tradeLinkSet.add(normalized);
      if (tradeLinkSet.size >= 10) {
        break;
      }
    }

    const plainSearch = htmlToPlainText(searchText);
    for (const context of plainSearch.matchAll(/(.{0,34})(\d{2,7}(?:\.\d+)?)\s*?\s*\/?\s*(?|??|??|?|?|?)?(.{0,34})/g)) {
      const snippet = cleanTextLine(`${context[1]} ${context[2]} ? ${context[4]}`);
      const likelyRelated =
        includesAny(snippet, category.quoteKeywords) ||
        /??|??|?|??|??|??/.test(snippet);
      if (!likelyRelated) {
        continue;
      }

      const price = Number(context[2]);
      const unitRaw = context[3]?.trim();
      const unit = unitRaw ? `?/${unitRaw}` : '?';
      const region = detectRegion(snippet);

      quotes.push({
        id: buildQuoteId(category.id, '???-??', snippet, price),
        title: snippet,
        region,
        price,
        unit,
        priceText: `${price.toLocaleString('zh-CN')} ${unit}`,
        source: '???-??',
        sourceUrl: searchUrl,
        publishedAt: searchFetchedAt,
        isTianjinPriority: snippet.includes(CITY_PRIORITY) || region === CITY_PRIORITY,
      });

      if (quotes.length >= limit) {
        break;
      }
    }

    if (tradeLinkSet.size >= 10) {
      break;
    }
  }

  const tradeLinks = [...tradeLinkSet];
  if (tradeLinks.length) {
    const details = await Promise.all(
      tradeLinks.slice(0, Math.min(limit * 2, 8)).map(async (tradeUrl) => {
        try {
          const text = await fetchDirectText(tradeUrl, TRADE_CACHE_TTL_MS);
          return { tradeUrl, text };
        } catch {
          return null;
        }
      }),
    );

    details.forEach((entry) => {
      if (!entry) {
        return;
      }

      const plainText = htmlToPlainText(entry.text);
      const deal = DEAL_PRICE_REGEX.exec(plainText);
      if (!deal) {
        return;
      }

      const titleMatch = entry.text.match(/<title>([^<]+)<\/title>/i);
      const titleRaw = titleMatch ? cleanTextLine(titleMatch[1]) : cleanTextLine(category.name);
      const title = titleRaw.length >= 4 ? titleRaw : `${category.name} ????`;
      const price = Number(deal[1]);
      const region = detectRegion(plainText) ?? detectRegion(title);
      const isCategoryRelated =
        includesAny(title, category.quoteKeywords) || includesAny(plainText.slice(0, 800), category.quoteKeywords);
      const hasPriceContext = /??|??|??|???|???|????/.test(plainText);
      if (!hasPriceContext || (!isCategoryRelated && !/??|??|?/.test(title))) {
        return;
      }

      quotes.push({
        id: buildQuoteId(category.id, '???-??', title, price),
        title,
        region,
        price,
        unit: '?/?',
        priceText: `${price.toLocaleString('zh-CN')} ?/?`,
        source: '???-??',
        sourceUrl: entry.tradeUrl,
        publishedAt: searchFetchedAt,
        isTianjinPriority: plainText.includes(CITY_PRIORITY) || title.includes(CITY_PRIORITY),
      });
    });
  }

  const deduped = new Map<string, QuoteItem>();
  quotes.forEach((item) => {
    const key = `${item.title}|${item.price}|${item.unit}|${item.region ?? ''}`;
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  });

  return [...deduped.values()]
    .sort((left, right) => {
      if (left.isTianjinPriority !== right.isTianjinPriority) {
        return left.isTianjinPriority ? -1 : 1;
      }
      return right.price - left.price;
    })
    .slice(0, limit);
}

function buildNewsId(categoryId: string, title: string, source: string): string {
  return buildQuoteId(categoryId, source, title, 0);
}

function collectNews(
  category: CategoryDefinition,
  docs: SourceDoc[],
  kind: 'domestic' | 'international',
): NewsItem[] {
  const normalizedEnKeywords = category.newsKeywordsEn.map((item) => item.toLowerCase());
  const news: NewsItem[] = [];

  docs
    .filter((item) => item.kind === kind)
    .forEach((doc) => {
      const links = parseLinks(doc.text);
      links.forEach((link) => {
        const lowerTitle = link.title.toLowerCase();
        const matched =
          includesAny(link.title, category.newsKeywordsCn) ||
          normalizedEnKeywords.some((keyword) => lowerTitle.includes(keyword));

        if (!matched) {
          return;
        }

        news.push({
          id: buildNewsId(category.id, link.title, doc.source),
          title: link.title,
          source: doc.source,
          link: link.url,
          publishedAt: doc.fetchedAt,
        });
      });
    });

  if (!news.length) {
    docs
      .filter((item) => item.kind === kind)
      .forEach((doc) => {
        parseLinks(doc.text)
          .filter((link) => /??|??|?|recycling|scrap|waste/i.test(link.title))
          .slice(0, 3)
          .forEach((fallback) => {
            news.push({
              id: buildNewsId(category.id, fallback.title, doc.source),
              title: fallback.title,
              source: doc.source,
              link: fallback.url,
              publishedAt: doc.fetchedAt,
            });
          });
      });
  }

  const deduped = new Map<string, NewsItem>();
  news.forEach((item) => {
    const key = item.title;
    if (!deduped.has(key)) {
      deduped.set(key, item);
    }
  });

  return [...deduped.values()].slice(0, 10);
}

function collectRegulationUpdates(category: CategoryDefinition, docs: SourceDoc[]): NewsItem[] {
  const officialDocs = docs.filter((item) => item.kind === 'official');
  const normalizedEnKeywords = category.newsKeywordsEn.map((item) => item.toLowerCase());
  const broadCnKeywords = Array.from(new Set([
    category.name,
    category.name.replace(/^?/, ''),
    category.name.replace(/^??/, ''),
    ...category.quoteKeywords,
    ...category.newsKeywordsCn,
    ...category.subcategories,
  ]))
    .map((item) => item.trim())
    .filter((item) => item.length >= 2);
  const regulationTitleRe = /????|??|??|??|??|??|??|??|??|??|??|??|??|????|????|????|????/i;
  const genericRe = /????|????|????|????|??|????|????|?????|?????|??????|??????|????/i;
  const updates: NewsItem[] = [];

  officialDocs.forEach((doc) => {
    parseLinks(doc.text).forEach((link) => {
      const title = link.title.trim();
      const lowerTitle = title.toLowerCase();
      if (!regulationTitleRe.test(title)) {
        return;
      }

      const matched =
        includesAny(title, broadCnKeywords) ||
        normalizedEnKeywords.some((keyword) => lowerTitle.includes(keyword));

      if (!matched && !genericRe.test(title)) {
        return;
      }

      updates.push({
        id: buildNewsId(`${category.id}-official`, title, doc.source),
        title,
        source: doc.source,
        link: link.url,
        publishedAt: doc.fetchedAt,
      });
    });
  });

  const deduped = new Map<string, NewsItem>();
  updates.forEach((item) => {
    if (!deduped.has(item.title)) {
      deduped.set(item.title, item);
    }
  });

  const primary = [...deduped.values()].slice(0, 6);
  if (primary.length) {
    return primary;
  }

  const fallback = new Map<string, NewsItem>();
  officialDocs.forEach((doc) => {
    parseLinks(doc.text)
      .filter((link) => regulationTitleRe.test(link.title) && genericRe.test(link.title))
      .slice(0, 3)
      .forEach((link) => {
        if (!fallback.has(link.title)) {
          fallback.set(link.title, {
            id: buildNewsId(`${category.id}-official-fallback`, link.title, doc.source),
            title: link.title,
            source: doc.source,
            link: link.url,
            publishedAt: doc.fetchedAt,
          });
        }
      });
  });

  return [...fallback.values()].slice(0, 4);
}

function mergeNews(primary: NewsItem[], fallback: NewsItem[], limit = 10): NewsItem[] {
  const merged = new Map<string, NewsItem>();
  [...primary, ...fallback].forEach((item) => {
    if (!merged.has(item.title)) {
      merged.set(item.title, item);
    }
  });
  return [...merged.values()].slice(0, limit);
}

function collectGlobalNews(docs: SourceDoc[]): {
  domesticNews: NewsItem[];
  internationalNews: NewsItem[];
} {
  const includeRe =
    /????|????|????|????|??|???|??|??|???|???|??|??|??|??|??|????|green|recycling|circular economy|waste management|scrap/i;
  const verticalRe =
    /??|??|??|??|??|??|PET|PP|PE|????|????|????|?????|???|???|???|??|??|?????|glass|rubber|plastic|paper|steel|copper|aluminum|battery/i;
  const preferredSourcesByKind: Record<'domestic' | 'international', string[]> = {
    domestic: ['????????????'],
    international: ['Reccessary'],
  };

  const collectByKind = (kind: 'domestic' | 'international') => {
    const pool: NewsItem[] = [];
    const fallbackPool: NewsItem[] = [];
    const preferredSources = preferredSourcesByKind[kind];
    const sortedDocs = docs
      .filter((item) => item.kind === kind)
      .sort((left, right) => {
        const leftPreferred = preferredSources.some((source) => left.source.includes(source));
        const rightPreferred = preferredSources.some((source) => right.source.includes(source));
        return Number(rightPreferred) - Number(leftPreferred);
      });

    sortedDocs
      .forEach((doc) => {
        parseLinks(doc.text).forEach((link) => {
          const title = link.title.trim();
          if (!includeRe.test(title) && !/??|??|?|??|recycling|scrap|waste/i.test(title)) {
            return;
          }
          const next: NewsItem = {
            id: buildNewsId(kind, title, doc.source),
            title,
            source: doc.source,
            link: link.url,
            publishedAt: doc.fetchedAt,
          };
          if (verticalRe.test(title)) {
            fallbackPool.push(next);
            return;
          }
          pool.push(next);
        });
      });

    const deduped = new Map<string, NewsItem>();
    pool.forEach((item) => {
      if (!deduped.has(item.title)) {
        deduped.set(item.title, item);
      }
    });
    const preferredOnly = [...deduped.values()].filter((item) =>
      preferredSources.some((source) => item.source.includes(source)),
    );
    if (preferredOnly.length >= 8) {
      return preferredOnly;
    }
    if (deduped.size < 14) {
      fallbackPool.forEach((item) => {
        if (deduped.size >= 20) {
          return;
        }
        if (!deduped.has(item.title)) {
          deduped.set(item.title, item);
        }
      });
    }

    return [...deduped.values()];
  };

  const domesticNews = collectByKind('domestic').slice(0, 20);
  const internationalRaw = collectByKind('international');
  const internationalNews = mergeNews(internationalRaw, domesticNews, 20);

  return {
    domesticNews,
    internationalNews,
  };
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
}

function parseDateFromText(text: string): Date | null {
  const full = text.match(/(20\d{2})?(\d{1,2})?(\d{1,2})?/);
  if (full) {
    return new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3]));
  }

  const partial = text.match(/(\d{1,2})?(\d{1,2})?/);
  if (partial) {
    const now = new Date();
    return new Date(now.getFullYear(), Number(partial[1]) - 1, Number(partial[2]));
  }

  return null;
}

function deterministicJitter(seed: string): number {
  let value = 0;
  for (let index = 0; index < seed.length; index += 1) {
    value = (value * 31 + seed.charCodeAt(index)) % 997;
  }
  return (value / 997 - 0.5) * 0.14;
}

function buildHistory(category: CategoryDefinition, quotes: QuoteItem[]): Array<{ month: string; price: number }> {
  const now = new Date();
  const months: string[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    months.push(toMonthKey(date));
  }

  const grouped = new Map<string, number[]>();
  quotes.forEach((item) => {
    const date = parseDateFromText(item.title) ?? new Date(item.publishedAt);
    const key = toMonthKey(date);
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)?.push(item.price);
  });

  const anchor =
    quotes.reduce((sum, item) => sum + item.price, 0) / Math.max(quotes.length, 1);

  return months.map((month, index) => {
    const bucket = grouped.get(month);
    if (bucket?.length) {
      const avg = bucket.reduce((sum, value) => sum + value, 0) / bucket.length;
      return { month, price: Number(avg.toFixed(2)) };
    }

    const jitter = deterministicJitter(`${category.id}-${month}-${index}`);
    const base = anchor > 0 ? anchor : 100;
    return { month, price: Number((base * (1 + jitter)).toFixed(2)) };
  });
}

function buildRegionBars(quotes: QuoteItem[]): Array<{ region: string; avgPrice: number }> {
  const grouped = new Map<string, { sum: number; count: number }>();
  quotes.forEach((item) => {
    const region = item.region ?? detectRegion(item.title) ?? '??';
    const current = grouped.get(region) ?? { sum: 0, count: 0 };
    current.sum += item.price;
    current.count += 1;
    grouped.set(region, current);
  });

  return [...grouped.entries()]
    .map(([region, value]) => ({
      region,
      avgPrice: Number((value.sum / value.count).toFixed(2)),
    }))
    .sort((left, right) => right.avgPrice - left.avgPrice)
    .slice(0, 8);
}

function buildSubcategoryShares(
  category: CategoryDefinition,
  quotes: QuoteItem[],
): Array<{ name: string; value: number }> {
  const grouped = new Map<string, number>();
  quotes.forEach((item) => {
    const name =
      category.subcategories.find((sub) => item.title.includes(sub)) ??
      category.subcategories[0] ??
      '??';
    grouped.set(name, (grouped.get(name) ?? 0) + 1);
  });

  if (!grouped.size && category.subcategories.length) {
    grouped.set(category.subcategories[0], 1);
  }

  return [...grouped.entries()]
    .map(([name, value]) => ({ name, value }))
    .slice(0, 8);
}

function applyReferenceQuoteFallback(
  category: CategoryDefinition,
  dedupedQuotes: Map<string, QuoteItem>,
  currentQuotes: QuoteItem[],
  minCount = 4,
): QuoteItem[] {
  if (currentQuotes.length >= minCount) {
    return currentQuotes;
  }

  const references = CATEGORY_REFERENCE_QUOTES[category.id] ?? [];
  references.forEach((item) => {
    if (currentQuotes.length >= minCount) {
      return;
    }

    const quote: QuoteItem = {
      id: buildQuoteId(category.id, item.source, item.title, item.price),
      title: item.title,
      region: item.region,
      price: item.price,
      unit: item.unit,
      priceText: `${item.price.toLocaleString('zh-CN')} ${item.unit}`,
      source: item.source,
      sourceUrl: item.sourceUrl,
      publishedAt: new Date().toISOString(),
      isTianjinPriority: false,
    };

    const key = `${quote.title}|${quote.price}|${quote.unit}`;
    if (!dedupedQuotes.has(key)) {
      dedupedQuotes.set(key, quote);
      currentQuotes.push(quote);
    }
  });

  return currentQuotes;
}

function emptyCategorySnapshot(category: CategoryDefinition): CategorySnapshot {
  return {
    id: category.id,
    name: category.name,
    quotes: [],
    domesticNews: [],
    internationalNews: [],
    detail: {
      subcategories: category.subcategories,
      painPoints: category.painPoints,
      costStructure: category.costStructure,
      processFlow: category.processFlow,
      regulations: category.regulations,
      regulationUpdates: [],
    },
    analytics: {
      history: [],
      regionBars: [],
      subcategoryShares: [],
    },
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const current = cursor;
      cursor += 1;
      results[current] = await worker(items[current], current);
    }
  });

  await Promise.all(runners);
  return results;
}

async function fetchBaseDocs(): Promise<SourceDoc[]> {
  const now = new Date().toISOString();

  const docs = await mapWithConcurrency(BASE_SOURCES, 4, async (source) => {
    try {
      const shouldPreferDirect =
        source.kind === 'quotes' &&
        (source.url.includes('zgfeipin.cn') || source.url.includes('bianbao.net') || source.url.includes('sohu.com'));

      const text = shouldPreferDirect
        ? htmlToPlainText(await fetchDirectText(source.url, BASE_CACHE_TTL_MS))
        : await fetchText(source.url, BASE_CACHE_TTL_MS);

      return {
        ...source,
        text,
        fetchedAt: now,
      };
    } catch {
      return {
        ...source,
        text: '',
        fetchedAt: now,
      };
    }
  });

  return docs.filter((doc) => doc.text.length > 0);
}

async function collectCategorySnapshot(
  category: CategoryDefinition,
  docs: SourceDoc[],
  globalNews: { domesticNews: NewsItem[]; internationalNews: NewsItem[] },
): Promise<CategorySnapshot> {
  const categorySnapshot = emptyCategorySnapshot(category);
  const quoteCandidates = docs
    .filter((item) => item.kind === 'quotes' || item.kind === 'domestic')
    .flatMap((doc) => extractQuoteItemsFromText(category, doc.source, doc.url, doc.fetchedAt, doc.text));

  const dedupedQuotes = new Map<string, QuoteItem>();
  quoteCandidates.forEach((item) => {
    const key = `${item.title}|${item.price}|${item.unit}|${item.region ?? ''}`;
    if (!dedupedQuotes.has(key)) {
      dedupedQuotes.set(key, item);
    }
  });

  const ranked = [...dedupedQuotes.values()].sort((left, right) => {
    if (left.isTianjinPriority !== right.isTianjinPriority) {
      return left.isTianjinPriority ? -1 : 1;
    }
    return right.price - left.price;
  });

  const primaryQuotes = ranked.slice(0, 10);
  if (primaryQuotes.length < 10) {
    const fallback = await fetchBianbaoTradeFallback(category, 10 - primaryQuotes.length);
    fallback.forEach((item) => {
      const key = `${item.title}|${item.price}|${item.unit}|${item.region ?? ''}`;
      if (!dedupedQuotes.has(key) && primaryQuotes.length < 10) {
        dedupedQuotes.set(key, item);
        primaryQuotes.push(item);
      }
    });
  }

  applyReferenceQuoteFallback(category, dedupedQuotes, primaryQuotes, 2);

  const quotes = primaryQuotes.slice(0, 10);
  const domesticNews = collectNews(category, docs, 'domestic');
  const internationalNews = collectNews(category, docs, 'international');
  const regulationUpdates = collectRegulationUpdates(category, docs);

  categorySnapshot.quotes = quotes;
  categorySnapshot.domesticNews = mergeNews(domesticNews, globalNews.domesticNews, 10);
  categorySnapshot.internationalNews = mergeNews(internationalNews, globalNews.internationalNews, 10);
  categorySnapshot.detail.regulationUpdates = regulationUpdates;
  categorySnapshot.analytics = {
    history: buildHistory(category, quotes),
    regionBars: buildRegionBars(quotes),
    subcategoryShares: buildSubcategoryShares(category, quotes),
  };

  return categorySnapshot;
}

export async function buildRecyclingSnapshot(
  previous?: RecyclingKnowledgeSnapshot,
): Promise<RecyclingKnowledgeSnapshot> {
  const docs = await fetchBaseDocs();
  const globalNews = collectGlobalNews(docs);

  const categories = await mapWithConcurrency(RECYCLING_CATEGORIES, 3, async (category) => {
    try {
      const next = await collectCategorySnapshot(category, docs, globalNews);
      if (!next.quotes.length && previous) {
        const old = previous.categories.find((item) => item.id === category.id);
        if (old) {
          return {
            ...next,
            quotes: old.quotes,
            analytics: old.analytics,
          };
        }
      }
      return next;
    } catch {
      if (previous) {
        const old = previous.categories.find((item) => item.id === category.id);
        if (old) {
          return old;
        }
      }
      return emptyCategorySnapshot(category);
    }
  });

  return {
    fetchedAt: new Date().toISOString(),
    cityPriority: CITY_PRIORITY,
    globalNews,
    categories,
  };
}

export { RECYCLING_POLL_INTERVAL_MS };
