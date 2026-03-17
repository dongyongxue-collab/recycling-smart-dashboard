import { useEffect, useMemo, useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import rewind from '@turf/rewind';
import { Bell, BookOpen, Factory, Globe2, Landmark, Layers, MapPinned, RefreshCw, Search, Sparkles, TrendingUp } from 'lucide-react';
import { Bar, CartesianGrid, Cell, ComposedChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useRecyclingDashboard } from './useRecyclingDashboard';

const numberFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });
const CHINA_GEOJSON_PATH = '/china.geo.json';
const MAP_MIN_LAT = 17;
const innerPieColors = ['#66b7ff', '#74ffd1', '#ffd166', '#ff9f9f', '#b9a3ff', '#89d8ff'];
const outerPieColors = ['#2f99ff', '#2ccf9f', '#ffb445', '#ff6f7b', '#8f7aff', '#47d1ff'];
const CATEGORY_ALERT_NEWS_RE = /大跌|下跌|暴跌|跳水|上涨|飙升|涨价|调价|停产|减产|复产|检修|关停|限产|禁令|关税|政策|补贴|库存|供需|扰动|预警|震荡|回落|反弹|price drop|price surge|plunge|slump|rally|shutdown|policy|tariff|inventory/i;

type Position = [number, number];
type PolygonCoords = Position[][];
type MultiPolygonCoords = PolygonCoords[];

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
  beijing: [116.4, 39.9], tianjin: [117.2, 39.12], shanghai: [121.47, 31.23], chongqing: [106.55, 29.56],
  hebei: [114.52, 38.05], shanxi: [112.56, 37.87], neimenggu: [111.67, 40.82], liaoning: [123.43, 41.8],
  jilin: [125.32, 43.9], heilongjiang: [126.63, 45.75], jiangsu: [118.78, 32.04], zhejiang: [120.15, 30.28],
  anhui: [117.27, 31.86], fujian: [119.3, 26.08], jiangxi: [115.89, 28.68], shandong: [117.0, 36.67],
  henan: [113.62, 34.75], hubei: [114.3, 30.6], hunan: [112.94, 28.23], guangdong: [113.27, 23.13],
  guangxi: [108.37, 22.82], hainan: [110.35, 20.02], sichuan: [104.06, 30.67], guizhou: [106.71, 26.57],
  yunnan: [102.71, 25.04], shaanxi: [108.95, 34.27], gansu: [103.82, 36.07], qinghai: [101.78, 36.62],
  ningxia: [106.27, 38.47], xinjiang: [87.62, 43.82], xizang: [91.11, 29.65], hongkong: [114.17, 22.3],
  macau: [113.54, 22.19], taiwan: [121.52, 25.04],
};

const REGION_LABELS: Record<string, string> = {
  beijing: '北京', tianjin: '天津', shanghai: '上海', chongqing: '重庆', hebei: '河北', shanxi: '山西', neimenggu: '内蒙古',
  liaoning: '辽宁', jilin: '吉林', heilongjiang: '黑龙江', jiangsu: '江苏', zhejiang: '浙江', anhui: '安徽', fujian: '福建',
  jiangxi: '江西', shandong: '山东', henan: '河南', hubei: '湖北', hunan: '湖南', guangdong: '广东', guangxi: '广西',
  hainan: '海南', sichuan: '四川', guizhou: '贵州', yunnan: '云南', shaanxi: '陕西', gansu: '甘肃', qinghai: '青海',
  ningxia: '宁夏', xinjiang: '新疆', xizang: '西藏', hongkong: '香港', macau: '澳门', taiwan: '台湾',
};

const REGION_ALIASES: Record<string, string[]> = {
  beijing: ['北京', '北京市', 'beijing'], tianjin: ['天津', '天津市', 'tianjin'], shanghai: ['上海', '上海市', 'shanghai'],
  chongqing: ['重庆', '重庆市', 'chongqing'], hebei: ['河北', 'hebei'], shanxi: ['山西', 'shanxi'], neimenggu: ['内蒙古', '内蒙', 'neimenggu'],
  liaoning: ['辽宁', 'liaoning'], jilin: ['吉林', 'jilin'], heilongjiang: ['黑龙江', 'heilongjiang'], jiangsu: ['江苏', 'jiangsu'],
  zhejiang: ['浙江', 'zhejiang'], anhui: ['安徽', 'anhui'], fujian: ['福建', 'fujian'], jiangxi: ['江西', 'jiangxi'],
  shandong: ['山东', 'shandong'], henan: ['河南', 'henan'], hubei: ['湖北', 'hubei'], hunan: ['湖南', 'hunan'],
  guangdong: ['广东', 'guangdong'], guangxi: ['广西', 'guangxi'], hainan: ['海南', 'hainan'], sichuan: ['四川', 'sichuan'],
  guizhou: ['贵州', 'guizhou'], yunnan: ['云南', 'yunnan'], shaanxi: ['陕西', 'shaanxi'], gansu: ['甘肃', 'gansu'],
  qinghai: ['青海', 'qinghai'], ningxia: ['宁夏', 'ningxia'], xinjiang: ['新疆', 'xinjiang'], xizang: ['西藏', 'xizang', 'tibet'],
  hongkong: ['香港', 'hongkong', 'hong kong'], macau: ['澳门', 'macau'], taiwan: ['台湾', 'taiwan'],
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
  polygon.forEach((ring) => ring.forEach((point) => { maxLat = Math.max(maxLat, point[1]); }));
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
  const primary = primarySource;
  const secondary = secondarySource;

  return { primary, secondary };
}

function compactSourceLabel(source: string): string {
  return source
    .replace(/[-_].*$/, '')
    .replace(/资讯|新闻|行情|价格总览|价格明细|参考价?/g, '')
    .trim();
}

function inferQuoteTag(title: string, subcategories: string[]): string {
  const matched = subcategories.find((item) => title.includes(item));
  if (matched) {
    return matched;
  }
  if (/上调|上涨/.test(title)) {
    return '上调';
  }
  if (/下调|下跌/.test(title)) {
    return '下调';
  }
  return subcategories[0] ?? '参考';
}

function App() {
  const { snapshot, connection, error } = useRecyclingDashboard();
  const [manualCategoryId, setManualCategoryId] = useState('');
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [chinaGeo, setChinaGeo] = useState<GeoJsonFeatureCollection | null>(null);
  const [activeMapRegion, setActiveMapRegion] = useState<string | null>(null);

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
    return () => { alive = false; };
  }, []);

  const activeCategoryId = useMemo(() => {
    const categories = snapshot?.categories ?? [];
    if (!categories.length) return '';
    return categories.some((item) => item.id === manualCategoryId) ? manualCategoryId : categories[0].id;
  }, [manualCategoryId, snapshot]);

  const activeCategory = useMemo(() => snapshot?.categories.find((item) => item.id === activeCategoryId) ?? null, [activeCategoryId, snapshot]);
  const quoteRows = useMemo(() => activeCategory?.quotes ?? [], [activeCategory]);

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

  const categoryAlertNewsSet = useMemo(() => new Set(categoryAlertNews.map((item) => item.title)), [categoryAlertNews]);
  const categoryDomesticGeneralNews = useMemo(() => (activeCategory?.domesticNews ?? []).filter((item) => !categoryAlertNewsSet.has(item.title)).slice(0, 8), [activeCategory, categoryAlertNewsSet]);
  const categoryInternationalGeneralNews = useMemo(() => (activeCategory?.internationalNews ?? []).filter((item) => !categoryAlertNewsSet.has(item.title)).slice(0, 8), [activeCategory, categoryAlertNewsSet]);

  const historyTrendData = useMemo(() => {
    const base = activeCategory?.analytics.history ?? [];
    return base.map((item, index) => {
      const from = Math.max(0, index - 2);
      const win = base.slice(from, index + 1);
      const avg3 = win.reduce((sum, x) => sum + x.price, 0) / Math.max(win.length, 1);
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
    return activeCategory.analytics.regionBars.slice(0, 8).map((item) => ({ region: item.region, avgPrice: item.avgPrice, quoteCount: countMap.get(item.region) ?? 0 }));
  }, [activeCategory]);

  const subcategoryRingData = useMemo(() => activeCategory?.analytics.subcategoryShares.length ? activeCategory.analytics.subcategoryShares.slice(0, 6) : [{ name: '综合', value: 1 }], [activeCategory]);
  const sourceRingData = useMemo(() => {
    const grouped = new Map<string, number>();
    quoteRows.forEach((quote) => grouped.set(quote.source, (grouped.get(quote.source) ?? 0) + 1));
    return [...grouped.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [quoteRows]);
  const quoteDisplayRows = useMemo(
    () =>
      quoteRows.map((quote) => ({
        ...quote,
        ...splitQuoteTitle(quote.title),
        sourceLabel: compactSourceLabel(quote.source),
        tag: inferQuoteTag(quote.title, activeCategory?.detail.subcategories ?? []),
      })),
    [activeCategory, quoteRows],
  );

  const mapView = useMemo(() => {
    if (!chinaGeo?.features?.length || !snapshot) return null;
    const drawableFeatures = chinaGeo.features.filter((feature) => String((feature.properties?.adcode as string | number | undefined) ?? '') !== '100000_JD').map(cleanSouthSeaGeometry).filter((feature): feature is GeoFeature => Boolean(feature));
    const collection: GeoJsonFeatureCollection = { type: 'FeatureCollection', features: drawableFeatures };
    const projection = geoMercator().fitExtent([[14, 12], [946, 462]], collection as never);
    const generator = geoPath(projection);
    const areas = drawableFeatures.map((feature, index) => {
      const path = generator(feature as never);
      if (!path) return null;
      const name = String(feature.properties?.name ?? `区域${index + 1}`);
      return { id: `${name}-${index}`, name, path };
    }).filter((item): item is { id: string; name: string; path: string } => Boolean(item));

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

    const allNews = [...snapshot.globalNews.domesticNews, ...snapshot.globalNews.internationalNews, ...snapshot.categories.flatMap((category) => [...category.domesticNews, ...category.internationalNews])];
    allNews.forEach((item) => {
      const region = normalizeRegion(item.title);
      if (!region) return;
      const current = regionCounter.get(region) ?? { quotes: 0, news: 0 };
      current.news += 1;
      regionCounter.set(region, current);
    });

    const points: MapPoint[] = [...regionCounter.entries()].map(([region, value]) => {
      const coordinate = REGION_COORDINATES[region];
      if (!coordinate) return null;
      const projected = projection(coordinate);
      if (!projected) return null;
      const heat = value.quotes * 2 + value.news;
      return { region, quotes: value.quotes, news: value.news, heat, x: projected[0], y: projected[1], radius: Math.max(4, Math.min(12, 4 + heat * 0.4)) };
    }).filter((item): item is MapPoint => Boolean(item)).sort((a, b) => b.heat - a.heat).slice(0, 25);

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

  const selectedMapPoint = useMemo(() => mapView?.points.find((point) => point.region === activeMapRegion) ?? null, [mapView, activeMapRegion]);
  const selectedMapLabel = useMemo(() => {
    if (!mapView || !selectedMapPoint) return null;
    const placeRight = selectedMapPoint.x < mapView.viewBounds.x + mapView.viewBounds.width * 0.62;
    const rawX = selectedMapPoint.x + (placeRight ? 20 : -196);
    const rawY = selectedMapPoint.y - 74;
    const x = Math.max(mapView.viewBounds.x + 8, Math.min(rawX, mapView.viewBounds.x + mapView.viewBounds.width - 190));
    const y = Math.max(mapView.viewBounds.y + 8, Math.min(rawY, mapView.viewBounds.y + mapView.viewBounds.height - 82));
    const anchorX = placeRight ? x + 10 : x + 176;
    const anchorY = y + 66;
    return { x, y, anchorX, anchorY };
  }, [mapView, selectedMapPoint]);

  const totalQuotes = snapshot?.categories.reduce((sum, category) => sum + category.quotes.length, 0) ?? 0;
  const tianjinQuotes = snapshot?.categories.reduce((sum, category) => sum + category.quotes.filter((quote) => quote.isTianjinPriority).length, 0) ?? 0;
  const totalGlobalNews = snapshot ? snapshot.globalNews.domesticNews.length + snapshot.globalNews.internationalNews.length : 0;
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

  return (
    <div className="kb-shell">
      <div className="glow glow-a" />
      <div className="glow glow-b" />

      <header className="top-header glass">
        <div>
          <div className="brand-line">
            <img src="/logo.png" alt="再生资源智慧看板 Logo" className="brand-logo" />
            <div className="brand-meta"><strong>实时智慧看板</strong><small>人工智能观星策划，摘星制作</small></div>
          </div>
          <h1>再生资源智慧看板<span>Smart Recycling Intelligence Dashboard</span></h1>
          <p>分类展示回收价、新闻、技术流程与法规标准，支持实时刷新与快速查阅。</p>
        </div>
        <div className="header-actions">
          <span className={`status ${connection}`}>{connection === 'online' ? '实时更新中' : '连接中断'}</span>
          <span className="status muted"><RefreshCw size={14} /> 数据更新 {snapshot ? formatTime(snapshot.fetchedAt) : '--:--:--'}</span>
          <span className="status muted"><Sparkles size={14} /> 系统时间 {formatTime(new Date(nowTick).toISOString())}</span>
          <span className="status muted">最近刷新 {snapshot ? Math.max(0, Math.floor((nowTick - new Date(snapshot.fetchedAt).getTime()) / 1000)) : 0} 秒前</span>
        </div>
      </header>

      {tickerQuotes.length ? <section className="news-ribbon glass"><div className="news-ribbon-head"><span className="ribbon-live-dot" /> 报价行情流</div><div className="news-ribbon-window"><div className="news-ribbon-track">{[...tickerQuotes, ...tickerQuotes].map((item, index) => <a key={`${item.id}-${index}`} href={item.sourceUrl} target="_blank" rel="noreferrer" className="ticker-chip price-ticker-chip" title={`${item.categoryName} ${item.primary}`}><div className="ticker-chip-top"><em className={item.isTianjinPriority ? 'ticker-badge tianjin' : 'ticker-badge domestic'}>{item.categoryName}</em><span className="ticker-region">{item.region}</span></div><strong className="ticker-price">{item.price}</strong><span className="ticker-copy">{item.primary}</span><i className="ticker-time">{formatTime(item.publishedAt)} 更新</i></a>)}</div></div></section> : null}

      <section className="kpi-row">
        <article className="kpi-card glass"><div className="kpi-head"><Layers size={16} /> 分类</div><strong>{snapshot?.categories.length ?? 16}</strong><small>固定 16 个大类</small></article>
        <article className="kpi-card glass"><div className="kpi-head"><Factory size={16} /> 报价条目</div><strong>{totalQuotes}</strong><small>每类最多 10 条</small></article>
        <article className="kpi-card glass"><div className="kpi-head"><TrendingUp size={16} /> 天津优先</div><strong>{tianjinQuotes}</strong><small>天津标记优先展示</small></article>
        <article className="kpi-card glass"><div className="kpi-head"><Bell size={16} /> 新闻总量</div><strong>{totalGlobalNews}</strong><small>全局新闻持续更新</small></article>
      </section>

      <section className="glass section-card map-card">
        <div className="section-head"><h2><MapPinned size={18} /> 全国资讯与报价热力地图</h2><span>点击点位查看悬浮标注</span></div>
        {mapView ? <div className="china-map-wrap"><svg className="china-map-svg" viewBox={mapView.viewBox} onClick={() => setActiveMapRegion(null)}><g className="map-areas">{mapView.areas.map((area) => <path key={area.id} d={area.path} className="map-area" fill="rgba(20,44,70,0.88)" strokeWidth={0.9} />)}</g><g className="map-markers">{mapView.points.map((point, index) => <g key={point.region} className="map-marker" onClick={(event) => { event.stopPropagation(); setActiveMapRegion((current) => (current === point.region ? null : point.region)); }}><circle cx={point.x} cy={point.y} r={point.radius * 2.2} className={point.region === 'tianjin' ? 'marker-pulse marker-tianjin' : 'marker-pulse'} style={{ animationDelay: `${index * 0.08}s` }} /><circle cx={point.x} cy={point.y} r={point.radius} className={point.region === 'tianjin' ? `marker-core marker-tianjin ${activeMapRegion === point.region ? 'marker-active' : ''}` : `marker-core ${activeMapRegion === point.region ? 'marker-active' : ''}`} /></g>)}</g>{selectedMapPoint && selectedMapLabel ? <g className="map-float-label"><line className="map-link-line" x1={selectedMapPoint.x} y1={selectedMapPoint.y} x2={selectedMapLabel.anchorX} y2={selectedMapLabel.anchorY} /><rect className="map-float-label-card" x={selectedMapLabel.x} y={selectedMapLabel.y} width={182} height={74} rx={10} ry={10} /><text className="map-float-title" x={selectedMapLabel.x + 12} y={selectedMapLabel.y + 22}>{REGION_LABELS[selectedMapPoint.region] ?? selectedMapPoint.region}</text><text className="map-float-meta" x={selectedMapLabel.x + 12} y={selectedMapLabel.y + 42}>报价 {selectedMapPoint.quotes} / 新闻 {selectedMapPoint.news}</text><text className="map-float-meta" x={selectedMapLabel.x + 12} y={selectedMapLabel.y + 61}>热度 {selectedMapPoint.heat}</text></g> : null}</svg><aside className="map-side-panel"><h4>区域热度 Top</h4><ul>{mapView.points.slice(0, 10).map((point) => <li key={point.region} className={activeMapRegion === point.region ? 'active' : ''} onClick={() => setActiveMapRegion((current) => (current === point.region ? null : point.region))}><strong>{REGION_LABELS[point.region] ?? point.region}</strong><span>报价 {point.quotes} / 新闻 {point.news}</span></li>)}</ul></aside></div> : <div className="empty-screen">地图加载中...</div>}
      </section>

      <section className="global-news-wide">
        <article className="glass section-card"><div className="section-head compact"><h3><BookOpen size={15} /> 全局新闻（国内）</h3></div><ul className="news-list news-list-wide">{(snapshot?.globalNews.domesticNews ?? []).slice(0, 10).map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>)}</ul></article>
        <article className="glass section-card"><div className="section-head compact"><h3><Globe2 size={15} /> 全局新闻（国际）</h3></div><ul className="news-list news-list-wide">{(snapshot?.globalNews.internationalNews ?? []).slice(0, 10).map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>)}</ul></article>
      </section>

      <section className="main-layout">
        <aside className="category-panel glass"><div className="panel-title"><Search size={15} /> 分类导航</div><div className="category-list">{(snapshot?.categories ?? []).map((category) => <button type="button" key={category.id} className={category.id === activeCategoryId ? 'category-item active' : 'category-item'} onClick={() => setManualCategoryId(category.id)}><div><strong>{category.name}</strong><small>{category.quotes.length}/10</small></div><em>天津 {category.quotes.filter((quote) => quote.isTianjinPriority).length}</em></button>)}</div></aside>

        <main className="detail-panel">
          {activeCategory ? <><section className="glass section-card"><div className="section-head compact"><h3><Layers size={15} /> {activeCategory.name}细分品类</h3></div><div className="subcat-chips">{activeCategory.detail.subcategories.map((item) => <span key={item} className="subcat-chip">{item}</span>)}</div></section>
          <section className="charts-board"><article className="glass section-card chart-card"><div className="section-head compact"><h3>{activeCategory.name}走势 + 平滑线</h3></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><LineChart data={historyTrendData}><CartesianGrid stroke="#1f3449" strokeDasharray="4 6" /><XAxis dataKey="month" tick={{ fill: '#9db4d2', fontSize: 12 }} /><YAxis tick={{ fill: '#9db4d2', fontSize: 12 }} width={80} /><Tooltip formatter={(value, key) => [`${numberFormatter.format(Number(value))} 元`, key === 'avg3' ? '3期均线' : '参考价']} /><Line type="monotone" dataKey="price" stroke="#69c1ff" strokeWidth={2.6} dot={false} /><Line type="monotone" dataKey="avg3" stroke="#7bffd4" strokeWidth={1.8} strokeDasharray="6 6" dot={false} /></LineChart></ResponsiveContainer></div></article><article className="glass section-card chart-card"><div className="section-head compact"><h3>{activeCategory.name}区域价量复合图</h3></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={regionCompositeData}><CartesianGrid stroke="#1f3449" strokeDasharray="4 6" /><XAxis dataKey="region" tick={{ fill: '#9db4d2', fontSize: 12 }} /><YAxis yAxisId="price" tick={{ fill: '#9db4d2', fontSize: 12 }} width={72} /><YAxis yAxisId="count" orientation="right" tick={{ fill: '#a9c6e7', fontSize: 12 }} width={44} allowDecimals={false} /><Tooltip formatter={(value, key) => key === 'avgPrice' ? [`${numberFormatter.format(Number(value))} 元`, '均价'] : [`${value} 条`, '条目数']} /><Bar yAxisId="price" dataKey="avgPrice" fill="#5ec8ff" radius={[8, 8, 0, 0]} /><Line yAxisId="count" type="monotone" dataKey="quoteCount" stroke="#74ffd1" strokeWidth={2.2} /></ComposedChart></ResponsiveContainer></div></article><article className="glass section-card chart-card"><div className="section-head compact"><h3>{activeCategory.name}双环结构图</h3><span>内环细分 / 外环来源</span></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sourceRingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={90} paddingAngle={1.5}>{sourceRingData.map((item, index) => <Cell key={`outer-${item.name}`} fill={outerPieColors[index % outerPieColors.length]} />)}</Pie><Pie data={subcategoryRingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={34} outerRadius={56} paddingAngle={2}>{subcategoryRingData.map((item, index) => <Cell key={`inner-${item.name}`} fill={innerPieColors[index % innerPieColors.length]} />)}</Pie><Tooltip formatter={(value, name) => [`${value} 条`, String(name)]} /></PieChart></ResponsiveContainer></div></article></section>
          <section className="glass section-card quote-panel"><div className="section-head"><h2>{activeCategory.name}回收价</h2><span>前 10 条有效报价</span></div><div className="quote-table-wrap"><table className="quote-table"><colgroup><col className="quote-col-region" /><col className="quote-col-price" /><col className="quote-col-source" /><col className="quote-col-time" /><col className="quote-col-main" /></colgroup><thead><tr><th>地区</th><th>价格</th><th>来源</th><th>时间</th><th>摘要</th></tr></thead><tbody>{quoteDisplayRows.length ? quoteDisplayRows.map((quote) => <tr key={quote.id} className="quote-row"><td className="quote-region-cell">{quote.region ?? (quote.isTianjinPriority ? '天津优先' : '全国')}</td><td className="price-cell">{numberFormatter.format(quote.price)} {quote.unit}</td><td className="quote-source-cell" title={quote.source}><span className="source-badge">{quote.sourceLabel}</span></td><td className="quote-time-cell">{formatTime(quote.publishedAt)}</td><td className="quote-summary-cell"><div className="quote-meta-line"><em className="quote-tag">{quote.tag}</em>{quote.isTianjinPriority ? <em className="quote-flag">天津优先</em> : null}</div><a href={quote.sourceUrl} target="_blank" rel="noreferrer" className="quote-primary" title={quote.title}>{quote.primary}</a>{quote.secondary ? <span className="quote-secondary" title={quote.title}>{quote.secondary}</span> : null}</td></tr>) : <tr><td colSpan={5} className="empty-cell">当前未解析到可用回收价。</td></tr>}</tbody></table></div></section>
          <section className="glass section-card"><div className="section-head compact"><h3><Bell size={15} /> {activeCategory.name}异动新闻</h3><span>价格波动 / 政策 / 供需事件</span></div>{categoryAlertNews.length ? <ul className="news-list compact-list compact-grid-list">{categoryAlertNews.map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>)}</ul> : <div className="empty-news">暂无品类异动新闻，系统会持续追新。</div>}</section>
          <section className="news-grid"><article className="glass section-card"><div className="section-head compact"><h3><BookOpen size={15} /> {activeCategory.name}相关新闻（国内）</h3></div><ul className="news-list compact-list compact-grid-list">{categoryDomesticGeneralNews.length ? categoryDomesticGeneralNews.map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>) : <li className="empty-news">暂无更多国内新闻。</li>}</ul></article><article className="glass section-card"><div className="section-head compact"><h3><Globe2 size={15} /> {activeCategory.name}相关新闻（国际）</h3></div><ul className="news-list compact-list compact-grid-list">{categoryInternationalGeneralNews.length ? categoryInternationalGeneralNews.map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>) : <li className="empty-news">暂无更多国际新闻。</li>}</ul></article></section>
          <section className="knowledge-grid"><article className="glass section-card"><div className="section-head compact"><h3><Factory size={15} /> 报价成本架构</h3></div><div className="cost-bars">{activeCategory.detail.costStructure.map((part) => <div key={part.label} className="cost-row"><span>{part.label}</span><strong>{part.percent}%</strong><div className="bar-track"><div className="bar-fill" style={{ width: `${part.percent}%` }} /></div></div>)}</div></article><article className="glass section-card"><div className="section-head compact"><h3><Layers size={15} /> 技术流程</h3></div><ol className="process-list">{activeCategory.detail.processFlow.map((step) => <li key={step.step}><strong>{step.step}. {step.title}</strong><p>{step.description}</p></li>)}</ol></article><article className="glass section-card"><div className="section-head compact"><h3><Landmark size={15} /> 法规标准</h3></div><ul className="rule-list">{activeCategory.detail.regulations.map((rule) => <li key={rule.title}><a href={rule.referenceUrl} target="_blank" rel="noreferrer">{rule.title}</a><span>{rule.authority}</span></li>)}</ul></article></section></> : <section className="glass section-card empty-screen">正在加载分类数据...</section>}
          {error && <div className="error-tip">{error}</div>}
        </main>
      </section>
    </div>
  );
}

export default App;
