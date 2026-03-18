import { useEffect, useMemo, useRef, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import rewind from '@turf/rewind';
import {
  Bell,
  BookOpen,
  Factory,
  Globe2,
  Landmark,
  Layers,
  MapPinned,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useRecyclingDashboard } from './useRecyclingDashboard';

const numberFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });
const CHINA_GEOJSON_PATH = '/china.geo.json';
const MAP_MIN_LAT = 17;
const innerPieColors = ['#66b7ff', '#74ffd1', '#ffd166', '#ff9f9f', '#b9a3ff', '#89d8ff'];
const outerPieColors = ['#2f99ff', '#2ccf9f', '#ffb445', '#ff6f7b', '#8f7aff', '#47d1ff'];
const CATEGORY_ALERT_NEWS_RE =
  /大跌|下跌|暴跌|跳水|上涨|飙升|涨价|调价|停产|减产|复产|检修|关停|限产|禁令|关税|政策|补贴|库存|供需|扰动|预警|震荡|回落|反弹|price drop|price surge|plunge|slump|rally|shutdown|policy|tariff|inventory/i;

type Position = [number, number];
type PolygonCoords = Position[][];
type MultiPolygonCoords = PolygonCoords[];
type DetailSection = 'market' | 'news' | 'knowledge';

interface GeoFeature {
  properties?: Record<string, unknown>;
  geometry: { type?: string; coordinates?: unknown };
}

interface GeoJsonFeatureCollection {
  type?: string;
  features: GeoFeature[];
}

interface MapPoint {
  region: string;
  quotes: number;
  news: number;
  heat: number;
  x: number;
  y: number;
  radius: number;
}

const REGION_COORDINATES: Record<string, [number, number]> = {
  beijing: [116.4, 39.9],
  tianjin: [117.2, 39.12],
  shanghai: [121.47, 31.23],
  chongqing: [106.55, 29.56],
  hebei: [114.52, 38.05],
  shanxi: [112.56, 37.87],
  neimenggu: [111.67, 40.82],
  liaoning: [123.43, 41.8],
  jilin: [125.32, 43.9],
  heilongjiang: [126.63, 45.75],
  jiangsu: [118.78, 32.04],
  zhejiang: [120.15, 30.28],
  anhui: [117.27, 31.86],
  fujian: [119.3, 26.08],
  jiangxi: [115.89, 28.68],
  shandong: [117.0, 36.67],
  henan: [113.62, 34.75],
  hubei: [114.3, 30.6],
  hunan: [112.94, 28.23],
  guangdong: [113.27, 23.13],
  guangxi: [108.37, 22.82],
  hainan: [110.35, 20.02],
  sichuan: [104.06, 30.67],
  guizhou: [106.71, 26.57],
  yunnan: [102.71, 25.04],
  shaanxi: [108.95, 34.27],
  gansu: [103.82, 36.07],
  qinghai: [101.78, 36.62],
  ningxia: [106.27, 38.47],
  xinjiang: [87.62, 43.82],
  xizang: [91.11, 29.65],
  hongkong: [114.17, 22.3],
  macau: [113.54, 22.19],
  taiwan: [121.52, 25.04],
};

const REGION_LABELS: Record<string, string> = {
  beijing: '北京',
  tianjin: '天津',
  shanghai: '上海',
  chongqing: '重庆',
  hebei: '河北',
  shanxi: '山西',
  neimenggu: '内蒙古',
  liaoning: '辽宁',
  jilin: '吉林',
  heilongjiang: '黑龙江',
  jiangsu: '江苏',
  zhejiang: '浙江',
  anhui: '安徽',
  fujian: '福建',
  jiangxi: '江西',
  shandong: '山东',
  henan: '河南',
  hubei: '湖北',
  hunan: '湖南',
  guangdong: '广东',
  guangxi: '广西',
  hainan: '海南',
  sichuan: '四川',
  guizhou: '贵州',
  yunnan: '云南',
  shaanxi: '陕西',
  gansu: '甘肃',
  qinghai: '青海',
  ningxia: '宁夏',
  xinjiang: '新疆',
  xizang: '西藏',
  hongkong: '香港',
  macau: '澳门',
  taiwan: '台湾',
};

const REGION_ALIASES: Record<string, string[]> = {
  beijing: ['北京', '北京市', 'beijing'],
  tianjin: ['天津', '天津市', 'tianjin'],
  shanghai: ['上海', '上海市', 'shanghai'],
  chongqing: ['重庆', '重庆市', 'chongqing'],
  hebei: ['河北', 'hebei'],
  shanxi: ['山西', 'shanxi'],
  neimenggu: ['内蒙古', '内蒙', 'neimenggu'],
  liaoning: ['辽宁', 'liaoning'],
  jilin: ['吉林', 'jilin'],
  heilongjiang: ['黑龙江', 'heilongjiang'],
  jiangsu: ['江苏', 'jiangsu'],
  zhejiang: ['浙江', 'zhejiang'],
  anhui: ['安徽', 'anhui'],
  fujian: ['福建', 'fujian'],
  jiangxi: ['江西', 'jiangxi'],
  shandong: ['山东', 'shandong'],
  henan: ['河南', 'henan'],
  hubei: ['湖北', 'hubei'],
  hunan: ['湖南', 'hunan'],
  guangdong: ['广东', 'guangdong'],
  guangxi: ['广西', 'guangxi'],
  hainan: ['海南', 'hainan'],
  sichuan: ['四川', 'sichuan'],
  guizhou: ['贵州', 'guizhou'],
  yunnan: ['云南', 'yunnan'],
  shaanxi: ['陕西', 'shaanxi'],
  gansu: ['甘肃', 'gansu'],
  qinghai: ['青海', 'qinghai'],
  ningxia: ['宁夏', 'ningxia'],
  xinjiang: ['新疆', 'xinjiang'],
  xizang: ['西藏', 'xizang', 'tibet'],
  hongkong: ['香港', 'hongkong', 'hong kong'],
  macau: ['澳门', 'macau'],
  taiwan: ['台湾', 'taiwan'],
};
function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString('zh-CN', { hour12: false });
}

function normalizeRegion(text?: string): string | undefined {
  if (!text) return undefined;
  const normalized = text.toLowerCase();
  for (const [region, aliases] of Object.entries(REGION_ALIASES)) {
    if (aliases.some((alias) => normalized.includes(alias.toLowerCase()))) return region;
  }
  return undefined;
}

function polygonMaxLat(polygon: PolygonCoords): number {
  let maxLat = -Infinity;
  polygon.forEach((ring) => ring.forEach((point) => {
    maxLat = Math.max(maxLat, point[1]);
  }));
  return maxLat;
}

function cleanSouthSeaGeometry(feature: GeoFeature): GeoFeature | null {
  const geometry = feature.geometry;
  if (!geometry.coordinates) return feature;
  if (geometry.type === 'Polygon') {
    const polygon = geometry.coordinates as PolygonCoords;
    return polygonMaxLat(polygon) >= MAP_MIN_LAT ? feature : null;
  }
  if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates as MultiPolygonCoords;
    const filtered = polygons.filter((polygon) => polygonMaxLat(polygon) >= MAP_MIN_LAT);
    if (!filtered.length) return null;
    return { ...feature, geometry: { ...geometry, coordinates: filtered } };
  }
  return feature;
}

function splitQuoteTitle(title: string): { primary: string; secondary: string } {
  const normalized = title.replace(/\s+/g, ' ').trim();
  const majorParts = normalized
    .split(/[。；;]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const first = majorParts[0] ?? normalized;
  const second = majorParts[1] ?? '';
  const primarySource = first
    .replace(/^(东北地区|华北地区|华东地区|华中地区|华南地区|西南地区|西北地区)\s*[:：]\s*/g, '')
    .replace(/\s+/g, ' ');
  const secondarySource = second.replace(/\s+/g, ' ');

  return { primary: primarySource, secondary: secondarySource };
}

function compactSourceLabel(source: string): string {
  return source
    .replace(/[-_].*$/, '')
    .replace(/资讯|新闻|行情|价格总览|价格明细|参考价?/g, '')
    .trim();
}

function inferQuoteTag(title: string, subcategories: string[]): string {
  const matched = subcategories.find((item) => title.includes(item));
  if (matched) return matched;
  if (/上调|上涨/.test(title)) return '上调';
  if (/下调|下跌/.test(title)) return '下调';
  return subcategories[0] ?? '参考';
}

function inferMomentum(title: string): { label: string; tone: 'up' | 'down' | 'steady' } {
  if (/上调|上涨|反弹|飙升|走强|偏强|紧张/i.test(title)) {
    return { label: '偏强', tone: 'up' };
  }
  if (/下调|下跌|回落|跳水|走低|偏弱|承压/i.test(title)) {
    return { label: '偏弱', tone: 'down' };
  }
  return { label: '平稳', tone: 'steady' };
}

function inferQuoteDelta(title: string, price: number) {
  const amountMatch = title.match(/(上调|上涨|反弹|下调|下跌|回落)[^0-9]{0,10}(\d+(?:\.\d+)?)\s*元(?:\/吨)?/);
  const fallbackMatch = title.match(/(\d+(?:\.\d+)?)\s*元(?:\/吨)?/);
  const rawAmount = amountMatch ? Number(amountMatch[2]) : 0;
  const direction = /上调|上涨|反弹/.test(title) ? 'up' : /下调|下跌|回落/.test(title) ? 'down' : 'steady';
  const amount = direction === 'steady' ? 0 : direction === 'up' ? rawAmount : -rawAmount;
  const basePrice = rawAmount > 0 ? Math.max(direction === 'up' ? price - rawAmount : price + rawAmount, 1) : price;
  const percent = rawAmount > 0 ? Math.abs((amount / basePrice) * 100) : 0;

  return {
    direction,
    amount,
    percent,
    amountLabel:
      rawAmount > 0
        ? `${direction === 'up' ? '+' : '-'}${numberFormatter.format(rawAmount)}元${/元\/吨|吨/.test(title) ? '/吨' : ''}`
        : null,
    percentLabel: rawAmount > 0 ? `${direction === 'up' ? '+' : '-'}${percent.toFixed(percent >= 10 ? 0 : 1)}%` : null,
    fallbackLabel: fallbackMatch ? fallbackMatch[0] : null,
  };
}

function getProcessStepVisual(title: string, description: string, index: number) {
  const text = `${title} ${description}`;
  if (/回收|登记|核验|投放|来源/.test(text)) {
    return { Icon: Search, tone: 'cyan', label: '前端识别' };
  }
  if (/预处理|分选|去杂|拆解|破碎|分级|贮存|固液分离/.test(text)) {
    return { Icon: Layers, tone: 'blue', label: '处理中段' };
  }
  if (/物流|进厂|转运|中转|过磅|运输/.test(text)) {
    return { Icon: MapPinned, tone: 'teal', label: '流转节点' };
  }
  if (/利用|再生|熔炼|终端|闭环|资源化|建材/.test(text)) {
    return { Icon: Factory, tone: 'amber', label: '终端利用' };
  }

  const fallback = [
    { Icon: Search, tone: 'cyan', label: '前端识别' },
    { Icon: Layers, tone: 'blue', label: '处理中段' },
    { Icon: MapPinned, tone: 'teal', label: '流转节点' },
    { Icon: Factory, tone: 'amber', label: '终端利用' },
  ];

  return fallback[index % fallback.length];
}

function App() {
  const { snapshot, connection, error } = useRecyclingDashboard();
  const [manualCategoryId, setManualCategoryId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'quotes' | 'regulations' | 'tianjin'>('all');
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [chinaGeo, setChinaGeo] = useState<GeoJsonFeatureCollection | null>(null);
  const [activeMapRegion, setActiveMapRegion] = useState<string | null>(null);
  const [activeDetailSection, setActiveDetailSection] = useState<DetailSection>('market');
  const marketSectionRef = useRef<HTMLElement | null>(null);
  const newsSectionRef = useRef<HTMLElement | null>(null);
  const knowledgeSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(CHINA_GEOJSON_PATH);
        if (!res.ok) throw new Error(String(res.status));
        const geo = (await res.json()) as GeoJsonFeatureCollection;
        const fixed = rewind(geo as never, { reverse: true }) as GeoJsonFeatureCollection;
        if (alive) setChinaGeo(fixed);
      } catch {
        if (alive) setChinaGeo(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filteredCategories = useMemo(() => {
    const categories = snapshot?.categories ?? [];
    if (categoryFilter === 'all') return categories;
    if (categoryFilter === 'quotes') return categories.filter((item) => item.quotes.length > 0);
    if (categoryFilter === 'regulations') return categories.filter((item) => item.detail.regulationUpdates.length > 0);
    return categories.filter((item) => item.quotes.some((quote) => quote.isTianjinPriority));
  }, [categoryFilter, snapshot]);

  const activeCategoryId = useMemo(() => {
    const categories = filteredCategories.length ? filteredCategories : snapshot?.categories ?? [];
    if (!categories.length) return '';
    return categories.some((item) => item.id === manualCategoryId) ? manualCategoryId : categories[0].id;
  }, [filteredCategories, manualCategoryId, snapshot]);

  const activeCategory = useMemo(
    () => snapshot?.categories.find((item) => item.id === activeCategoryId) ?? null,
    [activeCategoryId, snapshot],
  );
  const quoteRows = useMemo(() => activeCategory?.quotes ?? [], [activeCategory]);
  const latestRegulationUpdate = useMemo(
    () => activeCategory?.detail.regulationUpdates[0] ?? null,
    [activeCategory],
  );
  const categoryAlertNews = useMemo(() => {
    if (!activeCategory) return [];
    const merged = [...activeCategory.domesticNews, ...activeCategory.internationalNews];
    const deduped = new Map<string, (typeof merged)[number]>();
    merged.forEach((item) => {
      if (!CATEGORY_ALERT_NEWS_RE.test(item.title)) return;
      if (!deduped.has(item.title)) deduped.set(item.title, item);
    });
    return [...deduped.values()].slice(0, 10);
  }, [activeCategory]);

  const categoryAlertNewsSet = useMemo(
    () => new Set(categoryAlertNews.map((item) => item.title)),
    [categoryAlertNews],
  );
  const categoryDomesticGeneralNews = useMemo(
    () =>
      (activeCategory?.domesticNews ?? [])
        .filter((item) => !categoryAlertNewsSet.has(item.title))
        .slice(0, 8),
    [activeCategory, categoryAlertNewsSet],
  );
  const categoryInternationalGeneralNews = useMemo(
    () =>
      (activeCategory?.internationalNews ?? [])
        .filter((item) => !categoryAlertNewsSet.has(item.title))
        .slice(0, 8),
    [activeCategory, categoryAlertNewsSet],
  );

  const historyTrendData = useMemo(() => {
    const base = activeCategory?.analytics.history ?? [];
    return base.map((item, index) => {
      const from = Math.max(0, index - 2);
      const windowed = base.slice(from, index + 1);
      const avg3 = windowed.reduce((sum, x) => sum + x.price, 0) / Math.max(windowed.length, 1);
      return { month: item.month, price: item.price, avg3: Number(avg3.toFixed(2)) };
    });
  }, [activeCategory]);

  const regionCompositeData = useMemo(() => {
    if (!activeCategory) return [];
    const countMap = new Map<string, number>();
    activeCategory.quotes.forEach((quote) => {
      const region = normalizeRegion(quote.region ?? quote.title) ?? quote.region ?? '全国';
      countMap.set(region, (countMap.get(region) ?? 0) + 1);
    });
    return activeCategory.analytics.regionBars.slice(0, 8).map((item) => ({
      region: item.region,
      avgPrice: item.avgPrice,
      quoteCount: countMap.get(item.region) ?? 0,
    }));
  }, [activeCategory]);

  const subcategoryRingData = useMemo(
    () =>
      activeCategory?.analytics.subcategoryShares.length
        ? activeCategory.analytics.subcategoryShares.slice(0, 6)
        : [{ name: '综合', value: 1 }],
    [activeCategory],
  );
  const sourceRingData = useMemo(() => {
    const grouped = new Map<string, number>();
    quoteRows.forEach((quote) => grouped.set(quote.source, (grouped.get(quote.source) ?? 0) + 1));
    return [...grouped.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [quoteRows]);

  const quoteDisplayRows = useMemo(
    () =>
      quoteRows.map((quote) => ({
        ...quote,
        ...splitQuoteTitle(quote.title),
        sourceLabel: compactSourceLabel(quote.source),
        tag: inferQuoteTag(quote.title, activeCategory?.detail.subcategories ?? []),
        momentum: inferMomentum(quote.title),
        delta: inferQuoteDelta(quote.title, quote.price),
      })),
    [activeCategory, quoteRows],
  );

  const darkTooltipProps = useMemo(
    () => ({
      contentStyle: {
        background: 'rgba(6, 16, 28, 0.96)',
        border: '1px solid rgba(118, 176, 235, 0.24)',
        borderRadius: 14,
        boxShadow: '0 18px 36px rgba(0, 0, 0, 0.35)',
        color: '#dcecff',
      },
      itemStyle: {
        color: '#dcecff',
        fontSize: 12,
      },
      labelStyle: {
        color: '#8fb0d0',
        fontSize: 11,
        marginBottom: 6,
      },
      cursor: {
        stroke: 'rgba(102, 183, 255, 0.24)',
        strokeDasharray: '4 6',
      },
    }),
    [],
  );

  const moverCategories = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.categories
      .map((category) => {
        const latestQuote = category.quotes[0];
        const mergedNews = [...category.domesticNews, ...category.internationalNews];
        const alertCount = mergedNews.filter((item) => CATEGORY_ALERT_NEWS_RE.test(item.title)).length;
        const history = category.analytics.history;
        const momentum = history.length >= 2 ? history[history.length - 1].price - history[history.length - 2].price : 0;
        const score =
          category.quotes.length * 1.4 +
          alertCount * 3 +
          category.detail.regulationUpdates.length * 2 +
          category.quotes.filter((quote) => quote.isTianjinPriority).length * 1.5 +
          Math.min(Math.abs(momentum) / 25, 5);

        return {
          id: category.id,
          name: category.name,
          score: Number(score.toFixed(1)),
          latestPrice: latestQuote ? `${numberFormatter.format(latestQuote.price)} ${latestQuote.unit}` : '--',
          latestRegion: latestQuote?.region ?? (latestQuote?.isTianjinPriority ? '天津优先' : '全国'),
          alertCount,
          regulationCount: category.detail.regulationUpdates.length,
          reason:
            mergedNews.find((item) => CATEGORY_ALERT_NEWS_RE.test(item.title))?.title ??
            category.detail.regulationUpdates[0]?.title ??
            category.detail.painPoints[0] ??
            '等待新的异动或政策信号。',
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [snapshot]);

  const activeCoreCards = useMemo(() => quoteDisplayRows.slice(0, 4), [quoteDisplayRows]);

  const focusReasons = useMemo(
    () =>
      [
        categoryAlertNews[0]
          ? { key: 'alert', label: '异动原因', text: categoryAlertNews[0].title, link: categoryAlertNews[0].link }
          : null,
        latestRegulationUpdate
          ? { key: 'regulation', label: '法规动态', text: latestRegulationUpdate.title, link: latestRegulationUpdate.link }
          : null,
        activeCategory?.detail.painPoints[0]
          ? { key: 'pain', label: '行业痛点', text: activeCategory.detail.painPoints[0] }
          : null,
      ].filter(Boolean) as Array<{ key: string; label: string; text: string; link?: string }>,
    [activeCategory, categoryAlertNews, latestRegulationUpdate],
  );
  const mapView = useMemo(() => {
    if (!chinaGeo?.features?.length || !snapshot) return null;
    const drawableFeatures = chinaGeo.features
      .filter(
        (feature) => String((feature.properties?.adcode as string | number | undefined) ?? '') !== '100000_JD',
      )
      .map(cleanSouthSeaGeometry)
      .filter((feature): feature is GeoFeature => Boolean(feature));
    const collection: GeoJsonFeatureCollection = { type: 'FeatureCollection', features: drawableFeatures };
    const projection = geoMercator().fitExtent([[14, 12], [946, 462]], collection as never);
    const generator = geoPath(projection);
    const areas = drawableFeatures
      .map((feature, index) => {
        const path = generator(feature as never);
        if (!path) return null;
        const name = String(feature.properties?.name ?? `区域${index + 1}`);
        return { id: `${name}-${index}`, name, path };
      })
      .filter((item): item is { id: string; name: string; path: string } => Boolean(item));

    const regionCounter = new Map<string, { quotes: number; news: number }>();
    snapshot.categories.forEach((category) => {
      category.quotes.forEach((quote) => {
        const region = normalizeRegion(quote.region ?? quote.title);
        if (!region) return;
        const current = regionCounter.get(region) ?? { quotes: 0, news: 0 };
        current.quotes += 1;
        regionCounter.set(region, current);
      });
    });

    const allNews = [
      ...snapshot.globalNews.domesticNews,
      ...snapshot.globalNews.internationalNews,
      ...snapshot.categories.flatMap((category) => [...category.domesticNews, ...category.internationalNews]),
    ];

    allNews.forEach((item) => {
      const region = normalizeRegion(item.title);
      if (!region) return;
      const current = regionCounter.get(region) ?? { quotes: 0, news: 0 };
      current.news += 1;
      regionCounter.set(region, current);
    });

    const points: MapPoint[] = [...regionCounter.entries()]
      .map(([region, value]) => {
        const coordinate = REGION_COORDINATES[region];
        if (!coordinate) return null;
        const projected = projection(coordinate);
        if (!projected) return null;
        const heat = value.quotes * 2 + value.news;
        return {
          region,
          quotes: value.quotes,
          news: value.news,
          heat,
          x: projected[0],
          y: projected[1],
          radius: Math.max(4, Math.min(12, 4 + heat * 0.4)),
        };
      })
      .filter((item): item is MapPoint => Boolean(item))
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 25);

    const bounds = generator.bounds(collection as never);
    const padding = 18;
    const viewBounds = {
      x: bounds[0][0] - padding,
      y: bounds[0][1] - padding,
      width: bounds[1][0] - bounds[0][0] + padding * 2,
      height: bounds[1][1] - bounds[0][1] + padding * 2,
    };
    const viewBox = `${viewBounds.x} ${viewBounds.y} ${viewBounds.width} ${viewBounds.height}`;
    return { areas, points, viewBox, viewBounds };
  }, [chinaGeo, snapshot]);

  const selectedMapPoint = useMemo(
    () => mapView?.points.find((point) => point.region === activeMapRegion) ?? null,
    [mapView, activeMapRegion],
  );
  const selectedMapLabel = useMemo(() => {
    if (!mapView || !selectedMapPoint) return null;
    const placeRight = selectedMapPoint.x < mapView.viewBounds.x + mapView.viewBounds.width * 0.62;
    const rawX = selectedMapPoint.x + (placeRight ? 20 : -196);
    const rawY = selectedMapPoint.y - 74;
    const x = Math.max(
      mapView.viewBounds.x + 8,
      Math.min(rawX, mapView.viewBounds.x + mapView.viewBounds.width - 190),
    );
    const y = Math.max(
      mapView.viewBounds.y + 8,
      Math.min(rawY, mapView.viewBounds.y + mapView.viewBounds.height - 82),
    );
    const anchorX = placeRight ? x + 10 : x + 176;
    const anchorY = y + 66;
    return { x, y, anchorX, anchorY };
  }, [mapView, selectedMapPoint]);

  const totalQuotes =
    snapshot?.categories.reduce((sum, category) => sum + category.quotes.length, 0) ?? 0;
  const tianjinQuotes =
    snapshot?.categories.reduce(
      (sum, category) => sum + category.quotes.filter((quote) => quote.isTianjinPriority).length,
      0,
    ) ?? 0;
  const totalGlobalNews = snapshot
    ? snapshot.globalNews.domesticNews.length + snapshot.globalNews.internationalNews.length
    : 0;

  const tickerQuotes = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.categories
      .map((category) => {
        const quote = category.quotes[0];
        if (!quote) return null;
        const { primary } = splitQuoteTitle(quote.title);
        return {
          id: `${category.id}-${quote.id}`,
          categoryName: category.name,
          primary,
          region: quote.region ?? (quote.isTianjinPriority ? '天津优先' : '全国'),
          price: `${numberFormatter.format(quote.price)} ${quote.unit}`,
          publishedAt: quote.publishedAt,
          sourceUrl: quote.sourceUrl,
          isTianjinPriority: quote.isTianjinPriority,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [snapshot]);

  useEffect(() => {
    setActiveDetailSection('market');
  }, [activeCategoryId]);

  useEffect(() => {
    const sections = [marketSectionRef.current, newsSectionRef.current, knowledgeSectionRef.current].filter(
      (section): section is HTMLElement => Boolean(section),
    );
    if (!sections.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = visible.target.getAttribute('data-detail-section') as DetailSection | null;
        if (id) setActiveDetailSection(id);
      },
      { threshold: [0.2, 0.35, 0.55], rootMargin: '-110px 0px -48% 0px' },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [activeCategoryId]);

  const scrollToDetailSection = (section: DetailSection) => {
    setActiveDetailSection(section);
    const sectionMap = {
      market: marketSectionRef,
      news: newsSectionRef,
      knowledge: knowledgeSectionRef,
    };
    sectionMap[section].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="kb-shell">
      <div className="glow glow-a" />
      <div className="glow glow-b" />

      <header className="top-header glass">
        <div>
          <div className="brand-line">
            <img src="/logo.png" alt="再生资源智慧看板 Logo" className="brand-logo" />
            <div className="brand-meta">
              <strong>实时智慧看板</strong>
              <small>人工智能观星策划，摘星制作</small>
            </div>
          </div>
          <h1>
            再生资源智慧看板
            <span>Smart Recycling Intelligence Dashboard</span>
          </h1>
          <p>分类展示回收价、新闻、技术流程与法规标准，支持实时刷新与快速查阅。</p>
        </div>
        <div className="header-actions">
          <span className={`status ${connection}`}>{connection === 'online' ? '实时更新中' : '连接中断'}</span>
          <span className="status muted"><RefreshCw size={14} /> 数据更新 {snapshot ? formatTime(snapshot.fetchedAt) : '--:--:--'}</span>
          <span className="status muted"><Sparkles size={14} /> 系统时间 {formatTime(new Date(nowTick).toISOString())}</span>
          <span className="status muted">最近刷新 {snapshot ? Math.max(0, Math.floor((nowTick - new Date(snapshot.fetchedAt).getTime()) / 1000)) : 0} 秒前</span>
        </div>
      </header>
      {tickerQuotes.length ? (
        <section className="news-ribbon glass">
          <div className="news-ribbon-head"><span className="ribbon-live-dot" /> 报价行情流</div>
          <div className="news-ribbon-window">
            <div className="news-ribbon-track">
              {[...tickerQuotes, ...tickerQuotes].map((item, index) => (
                <a key={`${item.id}-${index}`} href={item.sourceUrl} target="_blank" rel="noreferrer" className="ticker-chip price-ticker-chip">
                  <div className="ticker-chip-top">
                    <em className={item.isTianjinPriority ? 'ticker-badge tianjin' : 'ticker-badge domestic'}>{item.categoryName}</em>
                    <span className="ticker-region">{item.region}</span>
                  </div>
                  <strong className="ticker-price">{item.price}</strong>
                  <span className="ticker-copy">{item.primary}</span>
                  <i className="ticker-time">{formatTime(item.publishedAt)} 更新</i>
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="kpi-row">
        <article className="kpi-card glass"><div className="kpi-head"><Layers size={16} /> 分类</div><strong>{snapshot?.categories.length ?? 16}</strong><small>固定 16 个大类</small></article>
        <article className="kpi-card glass"><div className="kpi-head"><Factory size={16} /> 报价条目</div><strong>{totalQuotes}</strong><small>每类最多 10 条</small></article>
        <article className="kpi-card glass"><div className="kpi-head"><TrendingUp size={16} /> 天津优先</div><strong>{tianjinQuotes}</strong><small>天津标记优先展示</small></article>
        <article className="kpi-card glass"><div className="kpi-head"><Bell size={16} /> 新闻总量</div><strong>{totalGlobalNews}</strong><small>全局新闻持续更新</small></article>
      </section>

      <section className="focus-stage">
        <article className="glass section-card focus-panel movers-panel">
          <div className="section-head compact"><h3><TrendingUp size={15} /> 今日异动榜</h3><span>先看哪一类最活跃</span></div>
          <div className="movers-list">
            {moverCategories.map((category, index) => (
              <button type="button" key={category.id} className={category.id === activeCategoryId ? 'mover-item active' : 'mover-item'} onClick={() => setManualCategoryId(category.id)}>
                <span className="mover-rank">0{index + 1}</span>
                <div className="mover-copy">
                  <div className="mover-topline"><strong>{category.name}</strong><em>{category.latestPrice}</em></div>
                  <div className="mover-meta"><span>{category.latestRegion}</span><span>异动 {category.alertCount}</span><span>法规 {category.regulationCount}</span></div>
                  <p>{category.reason}</p>
                </div>
              </button>
            ))}
          </div>
        </article>

        <article className="glass section-card focus-panel core-panel">
          {activeCategory ? (
            <>
              <div className="focus-core-top">
                <div className="focus-core-copy">
                  <span className="focus-label">当前主品类</span>
                  <h2>{activeCategory.name}</h2>
                  <p>{focusReasons[0]?.text ?? `${activeCategory.name} 当前暂无显著异动，重点看报价和法规层更新。`}</p>
                </div>
                <div className="focus-core-metrics">
                  <div><small>有效报价</small><strong>{activeCategory.quotes.length}</strong></div>
                  <div><small>异动新闻</small><strong>{categoryAlertNews.length}</strong></div>
                  <div><small>官方动态</small><strong>{activeCategory.detail.regulationUpdates.length}</strong></div>
                  <div><small>天津优先</small><strong>{activeCategory.quotes.filter((quote) => quote.isTianjinPriority).length}</strong></div>
                </div>
              </div>

              <div className="focus-price-grid">
                {activeCoreCards.map((quote) => (
                  <a key={quote.id} href={quote.sourceUrl} target="_blank" rel="noreferrer" className="focus-price-card">
                    <div className="focus-price-top"><em className={`momentum-badge ${quote.momentum.tone}`}>{quote.momentum.label}</em><span>{quote.region ?? (quote.isTianjinPriority ? '天津优先' : '全国')}</span></div>
                    <strong>{numberFormatter.format(quote.price)} {quote.unit}</strong>
                    {quote.delta.amountLabel ? <div className={`quote-delta-line ${quote.delta.direction}`}><span>{quote.delta.amountLabel}</span><em>{quote.delta.percentLabel}</em></div> : <div className="quote-delta-line steady"><span>暂无显式涨跌额</span><em>{quote.delta.fallbackLabel ?? '参考价'}</em></div>}
                    <span className="focus-price-title">{quote.primary}</span>
                    <i>{formatTime(quote.publishedAt)} · {quote.sourceLabel}</i>
                  </a>
                ))}
              </div>

              <div className="focus-context-grid">
                <article className="focus-context-card">
                  <span className="focus-card-label">为什么在动</span>
                  <ul>
                    {focusReasons.length ? focusReasons.map((item) => (
                      <li key={item.key}>
                        <strong>{item.label}</strong>
                        {item.link ? <a href={item.link} target="_blank" rel="noreferrer">{item.text}</a> : <p>{item.text}</p>}
                      </li>
                    )) : <li><strong>提示</strong><p>当前未抓到强异动信号，建议先看价格结构和官方动态。</p></li>}
                  </ul>
                </article>
                <article className="focus-context-card">
                  <span className="focus-card-label">细分重点</span>
                  <div className="focus-chip-row">{activeCategory.detail.subcategories.slice(0, 6).map((item) => <span key={item} className="subcat-chip">{item}</span>)}</div>
                  <p>{activeCategory.detail.painPoints[0] ?? '暂无行业痛点摘要。'}</p>
                </article>
              </div>
            </>
          ) : <div className="empty-screen">正在加载核心价格卡组...</div>}
        </article>

        <article className="glass section-card focus-panel focus-map-panel">
          <div className="section-head compact"><h3><MapPinned size={15} /> 区域热度地图</h3><span>地图只保留信号，不再抢主舞台</span></div>
          {mapView ? (
            <div className="china-map-wrap compact-map-wrap">
              <svg className="china-map-svg compact-map-svg" viewBox={mapView.viewBox} onClick={() => setActiveMapRegion(null)}>
                <g className="map-areas">{mapView.areas.map((area) => <path key={area.id} d={area.path} className="map-area" fill="rgba(20,44,70,0.88)" strokeWidth={0.9} />)}</g>
                <g className="map-markers">{mapView.points.map((point, index) => (
                  <g key={point.region} className="map-marker" onClick={(event) => { event.stopPropagation(); setActiveMapRegion((current) => (current === point.region ? null : point.region)); }}>
                    <circle cx={point.x} cy={point.y} r={point.radius * 2.2} className={point.region === 'tianjin' ? 'marker-pulse marker-tianjin' : 'marker-pulse'} style={{ animationDelay: `${index * 0.08}s` }} />
                    <circle cx={point.x} cy={point.y} r={point.radius} className={point.region === 'tianjin' ? `marker-core marker-tianjin ${activeMapRegion === point.region ? 'marker-active' : ''}` : `marker-core ${activeMapRegion === point.region ? 'marker-active' : ''}`} />
                  </g>
                ))}</g>
                {selectedMapPoint && selectedMapLabel ? <g className="map-float-label"><line className="map-link-line" x1={selectedMapPoint.x} y1={selectedMapPoint.y} x2={selectedMapLabel.anchorX} y2={selectedMapLabel.anchorY} /><rect className="map-float-label-card" x={selectedMapLabel.x} y={selectedMapLabel.y} width={182} height={74} rx={10} ry={10} /><text className="map-float-title" x={selectedMapLabel.x + 12} y={selectedMapLabel.y + 22}>{REGION_LABELS[selectedMapPoint.region] ?? selectedMapPoint.region}</text><text className="map-float-meta" x={selectedMapLabel.x + 12} y={selectedMapLabel.y + 42}>报价 {selectedMapPoint.quotes} / 新闻 {selectedMapPoint.news}</text><text className="map-float-meta" x={selectedMapLabel.x + 12} y={selectedMapLabel.y + 61}>热度 {selectedMapPoint.heat}</text></g> : null}
              </svg>
              <aside className="map-side-panel compact-map-side-panel"><h4>区域热度 Top</h4><ul>{mapView.points.slice(0, 6).map((point) => <li key={point.region} className={activeMapRegion === point.region ? 'active' : ''} onClick={() => setActiveMapRegion((current) => (current === point.region ? null : point.region))}><strong>{REGION_LABELS[point.region] ?? point.region}</strong><span>报价 {point.quotes} / 新闻 {point.news}</span></li>)}</ul></aside>
            </div>
          ) : <div className="empty-screen">地图加载中...</div>}
        </article>
      </section>

      <section className="global-news-wide">
        <article className="glass section-card"><div className="section-head compact"><h3><BookOpen size={15} /> 全局新闻（国内）</h3></div><ul className="news-list news-list-wide">{(snapshot?.globalNews.domesticNews ?? []).slice(0, 10).map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>)}</ul></article>
        <article className="glass section-card"><div className="section-head compact"><h3><Globe2 size={15} /> 全局新闻（国际）</h3></div><ul className="news-list news-list-wide">{(snapshot?.globalNews.internationalNews ?? []).slice(0, 10).map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>)}</ul></article>
      </section>
      <section className="main-layout">
        <aside className="category-panel glass">
          <div className="panel-title"><Search size={15} /> 分类导航</div>
          <div className="category-filter-row">
            {[
              { id: 'all' as const, label: '全部' },
              { id: 'quotes' as const, label: '有报价' },
              { id: 'tianjin' as const, label: '天津优先' },
              { id: 'regulations' as const, label: '法规更新' },
            ].map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={categoryFilter === filter.id ? 'category-filter-chip active' : 'category-filter-chip'}
                onClick={() => setCategoryFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="category-list">
            {filteredCategories.length ? filteredCategories.map((category) => (
              <button type="button" key={category.id} className={category.id === activeCategoryId ? 'category-item active' : 'category-item'} onClick={() => setManualCategoryId(category.id)}>
                <div><strong>{category.name}</strong><small>{category.quotes.length}/10</small></div>
                <em>天津 {category.quotes.filter((quote) => quote.isTianjinPriority).length}</em>
              </button>
            )) : <div className="empty-news category-empty">当前筛选下暂无匹配品类。</div>}
          </div>
          {activeCategory ? <div className="category-brief-card"><div className="category-brief-head"><strong>{activeCategory.name}速览</strong><span>补足导航下方信息层</span></div><div className="category-brief-stats"><div><small>细分品类</small><strong>{activeCategory.detail.subcategories.length}</strong></div><div><small>有效报价</small><strong>{activeCategory.quotes.length}</strong></div><div><small>专属法规</small><strong>{activeCategory.detail.categoryRegulations.length}</strong></div><div><small>标准资料</small><strong>{activeCategory.detail.supportMaterials.length}</strong></div></div><div className="category-brief-note"><span>当前重点</span><p>{activeCategory.detail.painPoints[0] ?? '当前未生成行业痛点摘要。'}</p></div>{latestRegulationUpdate ? <div className="category-brief-note"><span>最新官方动态</span><a href={latestRegulationUpdate.link} target="_blank" rel="noreferrer">{latestRegulationUpdate.title}</a></div> : null}</div> : null}
        </aside>

        <main className="detail-panel">
          {activeCategory ? <>
            <section className="glass section-card detail-overview-card">
              <div className="section-head compact"><div><h3>{activeCategory.name}情报分层</h3><span>把报价、资讯、工艺与法规拆成不同阅读任务</span></div><span>最新更新 {activeCategory.quotes[0] ? formatTime(activeCategory.quotes[0].publishedAt) : '--:--:--'}</span></div>
              <div className="detail-overview-grid">
                <div className="detail-overview-summary"><strong>{activeCategory.name}</strong><p>{focusReasons[0]?.text ?? `${activeCategory.name} 当前以报价监测为主，资讯和法规动态将同步更新。`}</p><div className="subcat-chips">{activeCategory.detail.subcategories.map((item) => <span key={item} className="subcat-chip">{item}</span>)}</div></div>
                <div className="detail-overview-stats"><div><small>报价条数</small><strong>{activeCategory.quotes.length}</strong></div><div><small>异动新闻</small><strong>{categoryAlertNews.length}</strong></div><div><small>标准资料</small><strong>{activeCategory.detail.supportMaterials.length}</strong></div><div><small>细分品类</small><strong>{activeCategory.detail.subcategories.length}</strong></div></div>
              </div>
            </section>

            <nav className="glass detail-subnav">
              {[{ id: 'market' as const, label: '报价', hint: '走势、价格表、区域对比' }, { id: 'news' as const, label: '资讯', hint: '异动、国内、国际' }, { id: 'knowledge' as const, label: '工艺与法规', hint: '痛点、流程、标准' }].map((item) => (
                <button key={item.id} type="button" className={activeDetailSection === item.id ? 'detail-tab active' : 'detail-tab'} onClick={() => scrollToDetailSection(item.id)}><strong>{item.label}</strong><span>{item.hint}</span></button>
              ))}
            </nav>

            <section ref={marketSectionRef} data-detail-section="market" className="detail-section-stack">
              <div className="section-group-head"><span className="section-group-kicker">报价层</span><h2>{activeCategory.name}价格与结构</h2><p>先看走势和区域价量，再看完整回收价表。</p></div>
              <section className="charts-board"><article className="glass section-card chart-card"><div className="section-head compact"><h3>{activeCategory.name}走势 + 平滑线</h3></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><LineChart data={historyTrendData}><CartesianGrid stroke="#1f3449" strokeDasharray="4 6" /><XAxis dataKey="month" tick={{ fill: '#9db4d2', fontSize: 12 }} /><YAxis tick={{ fill: '#9db4d2', fontSize: 12 }} width={80} /><Tooltip {...darkTooltipProps} formatter={(value, key) => [`${numberFormatter.format(Number(value))} 元/吨`, key === 'avg3' ? '3期均线' : '参考价']} /><Line type="monotone" dataKey="price" stroke="#69c1ff" strokeWidth={2.6} dot={false} /><Line type="monotone" dataKey="avg3" stroke="#7bffd4" strokeWidth={1.8} strokeDasharray="6 6" dot={false} /></LineChart></ResponsiveContainer></div></article><article className="glass section-card chart-card"><div className="section-head compact"><h3>{activeCategory.name}区域价量复合图</h3></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={regionCompositeData}><CartesianGrid stroke="#1f3449" strokeDasharray="4 6" /><XAxis dataKey="region" tick={{ fill: '#9db4d2', fontSize: 12 }} /><YAxis yAxisId="price" tick={{ fill: '#9db4d2', fontSize: 12 }} width={72} /><YAxis yAxisId="count" orientation="right" tick={{ fill: '#a9c6e7', fontSize: 12 }} width={44} allowDecimals={false} /><Tooltip {...darkTooltipProps} formatter={(value, key) => key === 'avgPrice' ? [`${numberFormatter.format(Number(value))} 元/吨`, '均价'] : [`${value} 条`, '条目数']} /><Bar yAxisId="price" dataKey="avgPrice" fill="#5ec8ff" radius={[8, 8, 0, 0]} /><Line yAxisId="count" type="monotone" dataKey="quoteCount" stroke="#74ffd1" strokeWidth={2.2} /></ComposedChart></ResponsiveContainer></div></article><article className="glass section-card chart-card"><div className="section-head compact"><h3>{activeCategory.name}双环结构图</h3><span>内环细分 / 外环来源</span></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sourceRingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={90} paddingAngle={1.5}>{sourceRingData.map((item, index) => <Cell key={`outer-${item.name}`} fill={outerPieColors[index % outerPieColors.length]} />)}</Pie><Pie data={subcategoryRingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={34} outerRadius={56} paddingAngle={2}>{subcategoryRingData.map((item, index) => <Cell key={`inner-${item.name}`} fill={innerPieColors[index % innerPieColors.length]} />)}</Pie><Tooltip {...darkTooltipProps} formatter={(value, name) => [`${value} 条`, String(name)]} /></PieChart></ResponsiveContainer></div></article></section>
              <section className="glass section-card quote-panel"><div className="section-head"><h2>{activeCategory.name}回收价</h2><span>前 10 条有效报价</span></div><div className="quote-table-wrap"><table className="quote-table"><colgroup><col className="quote-col-region" /><col className="quote-col-price" /><col className="quote-col-source" /><col className="quote-col-time" /><col className="quote-col-main" /></colgroup><thead><tr><th>地区</th><th>价格</th><th>来源</th><th>时间</th><th>摘要</th></tr></thead><tbody>{quoteDisplayRows.length ? quoteDisplayRows.map((quote) => <tr key={quote.id} className="quote-row"><td className="quote-region-cell">{quote.region ?? (quote.isTianjinPriority ? '天津优先' : '全国')}</td><td className="price-cell"><strong>{numberFormatter.format(quote.price)} {quote.unit}</strong>{quote.delta.amountLabel ? <div className={`price-delta ${quote.delta.direction}`}><span>{quote.delta.amountLabel}</span><em>{quote.delta.percentLabel}</em></div> : <div className="price-delta steady"><span>无显式涨跌</span></div>}</td><td className="quote-source-cell"><span className="source-badge">{quote.sourceLabel}</span></td><td className="quote-time-cell">{formatTime(quote.publishedAt)}</td><td className="quote-summary-cell"><div className="quote-meta-line"><em className="quote-tag">{quote.tag}</em><em className={`momentum-badge inline ${quote.momentum.tone}`}>{quote.momentum.label}</em>{quote.isTianjinPriority ? <em className="quote-flag">天津优先</em> : null}</div><a href={quote.sourceUrl} target="_blank" rel="noreferrer" className="quote-primary">{quote.primary}</a>{quote.secondary ? <span className="quote-secondary">{quote.secondary}</span> : null}</td></tr>) : <tr><td colSpan={5} className="empty-cell">当前未解析到可用回收价。</td></tr>}</tbody></table></div></section>
            </section>
            <section ref={newsSectionRef} data-detail-section="news" className="detail-section-stack">
              <div className="section-group-head"><span className="section-group-kicker">资讯层</span><h2>{activeCategory.name}异动与背景新闻</h2><p>把直接影响价格的异动和背景新闻分开，先读原因，再读背景。</p></div>
              <section className="glass section-card"><div className="section-head compact"><h3><Bell size={15} /> {activeCategory.name}异动新闻</h3><span>价格波动 / 政策 / 供需事件</span></div>{categoryAlertNews.length ? <ul className="news-list compact-list compact-grid-list">{categoryAlertNews.map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>)}</ul> : <div className="empty-news">暂无品类异动新闻，系统会持续追新。</div>}</section>
              <section className="news-grid"><article className="glass section-card"><div className="section-head compact"><h3><BookOpen size={15} /> {activeCategory.name}相关新闻（国内）</h3></div><ul className="news-list compact-list compact-grid-list">{categoryDomesticGeneralNews.length ? categoryDomesticGeneralNews.map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>) : <li className="empty-news">暂无更多国内新闻。</li>}</ul></article><article className="glass section-card"><div className="section-head compact"><h3><Globe2 size={15} /> {activeCategory.name}相关新闻（国际）</h3></div><ul className="news-list compact-list compact-grid-list">{categoryInternationalGeneralNews.length ? categoryInternationalGeneralNews.map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>) : <li className="empty-news">暂无更多国际新闻。</li>}</ul></article></section>
            </section>

            <section ref={knowledgeSectionRef} data-detail-section="knowledge" className="detail-section-stack">
              <div className="section-group-head"><span className="section-group-kicker">知识层</span><h2>{activeCategory.name}工艺、痛点与法规</h2><p>把行业痛点、成本结构、技术流程和法规动态收在知识层，不和价格抢第一视线。</p></div>
              <section className="glass section-card pain-points-panel"><div className="section-head compact"><h3><TrendingUp size={15} /> {activeCategory.name}行业痛点</h3><span>优先看最影响回收价、成交率和现金流的环节</span></div><div className="pain-point-list">{activeCategory.detail.painPoints.map((item, index) => <article key={item} className="pain-point-card"><span className="pain-point-index">0{index + 1}</span><p>{item}</p></article>)}</div></section>
              <section className="knowledge-grid"><article className="glass section-card"><div className="section-head compact"><h3><Factory size={15} /> 报价成本架构</h3></div><div className="cost-bars">{activeCategory.detail.costStructure.map((part) => <div key={part.label} className="cost-row"><span>{part.label}</span><strong>{part.percent}%</strong><div className="bar-track"><div className="bar-fill" style={{ width: `${part.percent}%` }} /></div></div>)}</div></article><article className="glass section-card"><div className="section-head compact"><h3><Layers size={15} /> 技术流程</h3><span>改成图标时间线，避免中文横排被挤压</span></div><div className="process-flow-vertical">{activeCategory.detail.processFlow.map((step, index) => { const visual = getProcessStepVisual(step.title, step.description, index); return <div key={step.step} className={`process-timeline-item ${visual.tone}`}><div className="process-timeline-rail"><span className="process-step-index">0{step.step}</span><span className={`process-step-icon ${visual.tone}`}><visual.Icon size={18} /></span>{index < activeCategory.detail.processFlow.length - 1 ? <span className="process-step-line" aria-hidden="true" /> : null}</div><div className="process-step-card vertical"><div className="process-step-head"><strong>{step.title}</strong><em>{visual.label}</em></div><p>{step.description}</p></div></div>; })}</div></article><article className="glass section-card regulation-panel"><div className="section-head compact"><h3><Landmark size={15} /> 法规标准</h3><span>共性法规前置，专属资料与最新动态分层</span></div><div className="regulation-card-grid"><section className="regulation-card tier-common"><div className="regulation-card-head"><div><strong>共性法规</strong><span>适用于多数再生资源经营与处置场景</span></div><em>{activeCategory.detail.commonRegulations.length} 条</em></div><ul className="rule-list regulation-list">{activeCategory.detail.commonRegulations.map((rule) => <li key={rule.title}><a href={rule.referenceUrl} target="_blank" rel="noreferrer">{rule.title}</a><span>{rule.authority}</span></li>)}</ul></section><section className="regulation-card tier-category"><div className="regulation-card-head"><div><strong>品类专属法规</strong><span>{activeCategory.name} 经营、回收、拆解或利用直接相关</span></div><em>{activeCategory.detail.categoryRegulations.length} 条</em></div>{activeCategory.detail.categoryRegulations.length ? <ul className="rule-list regulation-list">{activeCategory.detail.categoryRegulations.map((rule) => <li key={rule.title}><a href={rule.referenceUrl} target="_blank" rel="noreferrer">{rule.title}</a><span>{rule.authority}</span></li>)}</ul> : <div className="empty-news">当前品类暂未沉淀静态专属法规条目，继续看右侧标准资料。</div>}</section><section className="regulation-card tier-support"><div className="regulation-card-head"><div><strong>标准资料</strong><span>技术规范、行业解读和实施指南</span></div><em>{activeCategory.detail.supportMaterials.length} 条</em></div>{activeCategory.detail.supportMaterials.length ? <ul className="rule-list rule-list-compact regulation-list">{activeCategory.detail.supportMaterials.map((rule) => <li key={rule.id}><a href={rule.link} target="_blank" rel="noreferrer">{rule.title}</a><span>{rule.source}</span></li>)}</ul> : <div className="empty-news">当前未抓到更贴近该品类的官方标准资料，后续会继续补充官方源。</div>}</section><section className="regulation-card tier-update"><div className="regulation-card-head"><div><strong>官方最新动态</strong><span>国标、公告、通知与最新政策变更</span></div><em>{activeCategory.detail.regulationUpdates.length} 条</em></div>{activeCategory.detail.regulationUpdates.length ? <ul className="rule-list rule-list-compact regulation-list">{activeCategory.detail.regulationUpdates.map((rule) => <li key={rule.id}><a href={rule.link} target="_blank" rel="noreferrer">{rule.title}</a><span>{rule.source}</span></li>)}</ul> : <div className="empty-news">当前未抓到该品类最新官方法规/国标动态。</div>}</section></div></article></section>
            </section>
          </> : <section className="glass section-card empty-screen">正在加载分类数据...</section>}
          {error && <div className="error-tip">{error}</div>}
        </main>
      </section>

      <footer className="footer-meta-grid">
        <article className="glass section-card footer-meta-card"><div className="section-head compact"><h3>数据来源</h3><span>公开行业站点 + 官方法规源</span></div><ul className="footer-meta-list"><li>报价优先抓取我的钢铁网、变宝网、中国废品回收网等公开页面。</li><li>国内新闻优先接入中国再生资源回收利用协会等行业来源。</li><li>法规动态优先接入生态环境部、国家标准信息公共服务平台、工信部官方页面。</li></ul></article>
        <article className="glass section-card footer-meta-card"><div className="section-head compact"><h3>更新机制</h3><span>后端抓取 + 前端轮询 + 官方法规分层</span></div><ul className="footer-meta-list"><li>服务端约每 45 秒刷新一次公开报价、行业新闻和法规快照。</li><li>前端约每 45 秒重新拉取数据，页面时间会持续跳动。</li><li>法规区默认先展示共性法规，再展示品类专属法规和最新官方动态。</li></ul></article>
        <article className="glass section-card footer-meta-card"><div className="section-head compact"><h3>使用说明与免责声明</h3><span>适合个人研判，不替代成交与合规审查</span></div><ul className="footer-meta-list"><li>页面展示的是公开信息整理结果，存在站点延迟、口径差异和抓取误差。</li><li>回收价仅作趋势和参考，实际成交应以当日合同、到厂价和地区条件为准。</li><li>法规标准为快速索引，涉及经营资质、危废和跨省转运时仍应核对原文。</li></ul></article>
      </footer>
    </div>
  );
}

export default App;
