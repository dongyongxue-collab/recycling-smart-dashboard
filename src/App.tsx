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
const CATEGORY_ALERT_NEWS_RE = /??|??|??|??|??|??|??|??|??|??|??|??|??|??|??|??|??|??|??|??|??|??|??|??|??|price drop|price surge|plunge|slump|rally|shutdown|policy|tariff|inventory/i;

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
  beijing: '??', tianjin: '??', shanghai: '??', chongqing: '??', hebei: '??', shanxi: '??', neimenggu: '???',
  liaoning: '??', jilin: '??', heilongjiang: '???', jiangsu: '??', zhejiang: '??', anhui: '??', fujian: '??',
  jiangxi: '??', shandong: '??', henan: '??', hubei: '??', hunan: '??', guangdong: '??', guangxi: '??',
  hainan: '??', sichuan: '??', guizhou: '??', yunnan: '??', shaanxi: '??', gansu: '??', qinghai: '??',
  ningxia: '??', xinjiang: '??', xizang: '??', hongkong: '??', macau: '??', taiwan: '??',
};

const REGION_ALIASES: Record<string, string[]> = {
  beijing: ['??', '???', 'beijing'], tianjin: ['??', '???', 'tianjin'], shanghai: ['??', '???', 'shanghai'],
  chongqing: ['??', '???', 'chongqing'], hebei: ['??', 'hebei'], shanxi: ['??', 'shanxi'], neimenggu: ['???', '??', 'neimenggu'],
  liaoning: ['??', 'liaoning'], jilin: ['??', 'jilin'], heilongjiang: ['???', 'heilongjiang'], jiangsu: ['??', 'jiangsu'],
  zhejiang: ['??', 'zhejiang'], anhui: ['??', 'anhui'], fujian: ['??', 'fujian'], jiangxi: ['??', 'jiangxi'],
  shandong: ['??', 'shandong'], henan: ['??', 'henan'], hubei: ['??', 'hubei'], hunan: ['??', 'hunan'],
  guangdong: ['??', 'guangdong'], guangxi: ['??', 'guangxi'], hainan: ['??', 'hainan'], sichuan: ['??', 'sichuan'],
  guizhou: ['??', 'guizhou'], yunnan: ['??', 'yunnan'], shaanxi: ['??', 'shaanxi'], gansu: ['??', 'gansu'],
  qinghai: ['??', 'qinghai'], ningxia: ['??', 'ningxia'], xinjiang: ['??', 'xinjiang'], xizang: ['??', 'xizang', 'tibet'],
  hongkong: ['??', 'hongkong', 'hong kong'], macau: ['??', 'macau'], taiwan: ['??', 'taiwan'],
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
    .split(/[?;;]/)
    .map((item) => item.trim())
    .filter(Boolean);

  const first = majorParts[0] ?? normalized;
  const second = majorParts[1] ?? '';
  const primarySource = first
    .replace(/^(????|????|????|????|????|????|????)\s*[::]\s*/g, '')
    .replace(/\s+/g, ' ');
  const secondarySource = second.replace(/\s+/g, ' ');
  const primary = primarySource;
  const secondary = secondarySource;

  return { primary, secondary };
}

function compactSourceLabel(source: string): string {
  return source
    .replace(/[-_].*$/, '')
    .replace(/??|??|??|????|????|????/g, '')
    .trim();
}

function inferQuoteTag(title: string, subcategories: string[]): string {
  const matched = subcategories.find((item) => title.includes(item));
  if (matched) {
    return matched;
  }
  if (/??|??/.test(title)) {
    return '??';
  }
  if (/??|??/.test(title)) {
    return '??';
  }
  return subcategories[0] ?? '??';
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
  const latestRegulationUpdate = useMemo(() => activeCategory?.detail.regulationUpdates[0] ?? null, [activeCategory]);

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
      const region = normalizeRegion(quote.region ?? quote.title) ?? quote.region ?? '??';
      countMap.set(region, (countMap.get(region) ?? 0) + 1);
    });
    return activeCategory.analytics.regionBars.slice(0, 8).map((item) => ({ region: item.region, avgPrice: item.avgPrice, quoteCount: countMap.get(item.region) ?? 0 }));
  }, [activeCategory]);

  const subcategoryRingData = useMemo(() => activeCategory?.analytics.subcategoryShares.length ? activeCategory.analytics.subcategoryShares.slice(0, 6) : [{ name: '??', value: 1 }], [activeCategory]);
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
      const name = String(feature.properties?.name ?? `??${index + 1}`);
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
          region: quote.region ?? (quote.isTianjinPriority ? '????' : '??'),
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
            <img src="/logo.png" alt="???????? Logo" className="brand-logo" />
            <div className="brand-meta"><strong>??????</strong><small>????????,????</small></div>
          </div>
          <h1>????????<span>Smart Recycling Intelligence Dashboard</span></h1>
          <p>????????????????????,????????????</p>
        </div>
        <div className="header-actions">
          <span className={`status ${connection}`}>{connection === 'online' ? '?????' : '????'}</span>
          <span className="status muted"><RefreshCw size={14} /> ???? {snapshot ? formatTime(snapshot.fetchedAt) : '--:--:--'}</span>
          <span className="status muted"><Sparkles size={14} /> ???? {formatTime(new Date(nowTick).toISOString())}</span>
          <span className="status muted">???? {snapshot ? Math.max(0, Math.floor((nowTick - new Date(snapshot.fetchedAt).getTime()) / 1000)) : 0} ??</span>
        </div>
      </header>

      {tickerQuotes.length ? <section className="news-ribbon glass"><div className="news-ribbon-head"><span className="ribbon-live-dot" /> ?????</div><div className="news-ribbon-window"><div className="news-ribbon-track">{[...tickerQuotes, ...tickerQuotes].map((item, index) => <a key={`${item.id}-${index}`} href={item.sourceUrl} target="_blank" rel="noreferrer" className="ticker-chip price-ticker-chip" title={`${item.categoryName} ${item.primary}`}><div className="ticker-chip-top"><em className={item.isTianjinPriority ? 'ticker-badge tianjin' : 'ticker-badge domestic'}>{item.categoryName}</em><span className="ticker-region">{item.region}</span></div><strong className="ticker-price">{item.price}</strong><span className="ticker-copy">{item.primary}</span><i className="ticker-time">{formatTime(item.publishedAt)} ??</i></a>)}</div></div></section> : null}

      <section className="kpi-row">
        <article className="kpi-card glass"><div className="kpi-head"><Layers size={16} /> ??</div><strong>{snapshot?.categories.length ?? 16}</strong><small>?? 16 ???</small></article>
        <article className="kpi-card glass"><div className="kpi-head"><Factory size={16} /> ????</div><strong>{totalQuotes}</strong><small>???? 10 ?</small></article>
        <article className="kpi-card glass"><div className="kpi-head"><TrendingUp size={16} /> ????</div><strong>{tianjinQuotes}</strong><small>????????</small></article>
        <article className="kpi-card glass"><div className="kpi-head"><Bell size={16} /> ????</div><strong>{totalGlobalNews}</strong><small>????????</small></article>
      </section>

      <section className="glass section-card map-card">
        <div className="section-head"><h2><MapPinned size={18} /> ???????????</h2><span>??????????</span></div>
        {mapView ? <div className="china-map-wrap"><svg className="china-map-svg" viewBox={mapView.viewBox} onClick={() => setActiveMapRegion(null)}><g className="map-areas">{mapView.areas.map((area) => <path key={area.id} d={area.path} className="map-area" fill="rgba(20,44,70,0.88)" strokeWidth={0.9} />)}</g><g className="map-markers">{mapView.points.map((point, index) => <g key={point.region} className="map-marker" onClick={(event) => { event.stopPropagation(); setActiveMapRegion((current) => (current === point.region ? null : point.region)); }}><circle cx={point.x} cy={point.y} r={point.radius * 2.2} className={point.region === 'tianjin' ? 'marker-pulse marker-tianjin' : 'marker-pulse'} style={{ animationDelay: `${index * 0.08}s` }} /><circle cx={point.x} cy={point.y} r={point.radius} className={point.region === 'tianjin' ? `marker-core marker-tianjin ${activeMapRegion === point.region ? 'marker-active' : ''}` : `marker-core ${activeMapRegion === point.region ? 'marker-active' : ''}`} /></g>)}</g>{selectedMapPoint && selectedMapLabel ? <g className="map-float-label"><line className="map-link-line" x1={selectedMapPoint.x} y1={selectedMapPoint.y} x2={selectedMapLabel.anchorX} y2={selectedMapLabel.anchorY} /><rect className="map-float-label-card" x={selectedMapLabel.x} y={selectedMapLabel.y} width={182} height={74} rx={10} ry={10} /><text className="map-float-title" x={selectedMapLabel.x + 12} y={selectedMapLabel.y + 22}>{REGION_LABELS[selectedMapPoint.region] ?? selectedMapPoint.region}</text><text className="map-float-meta" x={selectedMapLabel.x + 12} y={selectedMapLabel.y + 42}>?? {selectedMapPoint.quotes} / ?? {selectedMapPoint.news}</text><text className="map-float-meta" x={selectedMapLabel.x + 12} y={selectedMapLabel.y + 61}>?? {selectedMapPoint.heat}</text></g> : null}</svg><aside className="map-side-panel"><h4>???? Top</h4><ul>{mapView.points.slice(0, 10).map((point) => <li key={point.region} className={activeMapRegion === point.region ? 'active' : ''} onClick={() => setActiveMapRegion((current) => (current === point.region ? null : point.region))}><strong>{REGION_LABELS[point.region] ?? point.region}</strong><span>?? {point.quotes} / ?? {point.news}</span></li>)}</ul></aside></div> : <div className="empty-screen">?????...</div>}
      </section>

      <section className="global-news-wide">
        <article className="glass section-card"><div className="section-head compact"><h3><BookOpen size={15} /> ????(??)</h3></div><ul className="news-list news-list-wide">{(snapshot?.globalNews.domesticNews ?? []).slice(0, 10).map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>)}</ul></article>
        <article className="glass section-card"><div className="section-head compact"><h3><Globe2 size={15} /> ????(??)</h3></div><ul className="news-list news-list-wide">{(snapshot?.globalNews.internationalNews ?? []).slice(0, 10).map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>)}</ul></article>
      </section>

      <section className="main-layout">
        <aside className="category-panel glass"><div className="panel-title"><Search size={15} /> ????</div><div className="category-list">{(snapshot?.categories ?? []).map((category) => <button type="button" key={category.id} className={category.id === activeCategoryId ? 'category-item active' : 'category-item'} onClick={() => setManualCategoryId(category.id)}><div><strong>{category.name}</strong><small>{category.quotes.length}/10</small></div><em>?? {category.quotes.filter((quote) => quote.isTianjinPriority).length}</em></button>)}</div>{activeCategory ? <div className="category-brief-card"><div className="category-brief-head"><strong>{activeCategory.name}??</strong><span>?????????</span></div><div className="category-brief-stats"><div><small>????</small><strong>{activeCategory.detail.subcategories.length}</strong></div><div><small>????</small><strong>{activeCategory.quotes.length}</strong></div><div><small>????</small><strong>{activeCategory.detail.regulationUpdates.length}</strong></div><div><small>????</small><strong>{categoryAlertNews.length}</strong></div></div><div className="category-brief-note"><span>????</span><p>{activeCategory.detail.painPoints[0] ?? '????????????'}</p></div>{latestRegulationUpdate ? <div className="category-brief-note"><span>??????</span><a href={latestRegulationUpdate.link} target="_blank" rel="noreferrer">{latestRegulationUpdate.title}</a></div> : null}</div> : null}</aside>

        <main className="detail-panel">
          {activeCategory ? <><section className="glass section-card"><div className="section-head compact"><h3><Layers size={15} /> {activeCategory.name}????</h3></div><div className="subcat-chips">{activeCategory.detail.subcategories.map((item) => <span key={item} className="subcat-chip">{item}</span>)}</div></section>
          <section className="charts-board"><article className="glass section-card chart-card"><div className="section-head compact"><h3>{activeCategory.name}?? + ???</h3></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><LineChart data={historyTrendData}><CartesianGrid stroke="#1f3449" strokeDasharray="4 6" /><XAxis dataKey="month" tick={{ fill: '#9db4d2', fontSize: 12 }} /><YAxis tick={{ fill: '#9db4d2', fontSize: 12 }} width={80} /><Tooltip formatter={(value, key) => [`${numberFormatter.format(Number(value))} ?`, key === 'avg3' ? '3???' : '???']} /><Line type="monotone" dataKey="price" stroke="#69c1ff" strokeWidth={2.6} dot={false} /><Line type="monotone" dataKey="avg3" stroke="#7bffd4" strokeWidth={1.8} strokeDasharray="6 6" dot={false} /></LineChart></ResponsiveContainer></div></article><article className="glass section-card chart-card"><div className="section-head compact"><h3>{activeCategory.name}???????</h3></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={regionCompositeData}><CartesianGrid stroke="#1f3449" strokeDasharray="4 6" /><XAxis dataKey="region" tick={{ fill: '#9db4d2', fontSize: 12 }} /><YAxis yAxisId="price" tick={{ fill: '#9db4d2', fontSize: 12 }} width={72} /><YAxis yAxisId="count" orientation="right" tick={{ fill: '#a9c6e7', fontSize: 12 }} width={44} allowDecimals={false} /><Tooltip formatter={(value, key) => key === 'avgPrice' ? [`${numberFormatter.format(Number(value))} ?`, '??'] : [`${value} ?`, '???']} /><Bar yAxisId="price" dataKey="avgPrice" fill="#5ec8ff" radius={[8, 8, 0, 0]} /><Line yAxisId="count" type="monotone" dataKey="quoteCount" stroke="#74ffd1" strokeWidth={2.2} /></ComposedChart></ResponsiveContainer></div></article><article className="glass section-card chart-card"><div className="section-head compact"><h3>{activeCategory.name}?????</h3><span>???? / ????</span></div><div className="chart-box"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sourceRingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={62} outerRadius={90} paddingAngle={1.5}>{sourceRingData.map((item, index) => <Cell key={`outer-${item.name}`} fill={outerPieColors[index % outerPieColors.length]} />)}</Pie><Pie data={subcategoryRingData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={34} outerRadius={56} paddingAngle={2}>{subcategoryRingData.map((item, index) => <Cell key={`inner-${item.name}`} fill={innerPieColors[index % innerPieColors.length]} />)}</Pie><Tooltip formatter={(value, name) => [`${value} ?`, String(name)]} /></PieChart></ResponsiveContainer></div></article></section>
          <section className="glass section-card quote-panel"><div className="section-head"><h2>{activeCategory.name}???</h2><span>? 10 ?????</span></div><div className="quote-table-wrap"><table className="quote-table"><colgroup><col className="quote-col-region" /><col className="quote-col-price" /><col className="quote-col-source" /><col className="quote-col-time" /><col className="quote-col-main" /></colgroup><thead><tr><th>??</th><th>??</th><th>??</th><th>??</th><th>??</th></tr></thead><tbody>{quoteDisplayRows.length ? quoteDisplayRows.map((quote) => <tr key={quote.id} className="quote-row"><td className="quote-region-cell">{quote.region ?? (quote.isTianjinPriority ? '????' : '??')}</td><td className="price-cell">{numberFormatter.format(quote.price)} {quote.unit}</td><td className="quote-source-cell" title={quote.source}><span className="source-badge">{quote.sourceLabel}</span></td><td className="quote-time-cell">{formatTime(quote.publishedAt)}</td><td className="quote-summary-cell"><div className="quote-meta-line"><em className="quote-tag">{quote.tag}</em>{quote.isTianjinPriority ? <em className="quote-flag">????</em> : null}</div><a href={quote.sourceUrl} target="_blank" rel="noreferrer" className="quote-primary" title={quote.title}>{quote.primary}</a>{quote.secondary ? <span className="quote-secondary" title={quote.title}>{quote.secondary}</span> : null}</td></tr>) : <tr><td colSpan={5} className="empty-cell">????????????</td></tr>}</tbody></table></div></section>
          <section className="glass section-card"><div className="section-head compact"><h3><Bell size={15} /> {activeCategory.name}????</h3><span>???? / ?? / ????</span></div>{categoryAlertNews.length ? <ul className="news-list compact-list compact-grid-list">{categoryAlertNews.map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>)}</ul> : <div className="empty-news">????????,????????</div>}</section>
          <section className="news-grid"><article className="glass section-card"><div className="section-head compact"><h3><BookOpen size={15} /> {activeCategory.name}????(??)</h3></div><ul className="news-list compact-list compact-grid-list">{categoryDomesticGeneralNews.length ? categoryDomesticGeneralNews.map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>) : <li className="empty-news">?????????</li>}</ul></article><article className="glass section-card"><div className="section-head compact"><h3><Globe2 size={15} /> {activeCategory.name}????(??)</h3></div><ul className="news-list compact-list compact-grid-list">{categoryInternationalGeneralNews.length ? categoryInternationalGeneralNews.map((item) => <li key={item.id}><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a><span>{item.source}</span></li>) : <li className="empty-news">?????????</li>}</ul></article></section>
          <section className="glass section-card pain-points-panel"><div className="section-head compact"><h3><TrendingUp size={15} /> {activeCategory.name}????</h3><span>????????????????????</span></div><div className="pain-point-list">{activeCategory.detail.painPoints.map((item, index) => <article key={item} className="pain-point-card"><span className="pain-point-index">0{index + 1}</span><p>{item}</p></article>)}</div></section>
          <section className="knowledge-grid"><article className="glass section-card"><div className="section-head compact"><h3><Factory size={15} /> ??????</h3></div><div className="cost-bars">{activeCategory.detail.costStructure.map((part) => <div key={part.label} className="cost-row"><span>{part.label}</span><strong>{part.percent}%</strong><div className="bar-track"><div className="bar-fill" style={{ width: `${part.percent}%` }} /></div></div>)}</div></article><article className="glass section-card"><div className="section-head compact"><h3><Layers size={15} /> ????</h3></div><ol className="process-list">{activeCategory.detail.processFlow.map((step) => <li key={step.step}><strong>{step.step}. {step.title}</strong><p>{step.description}</p></li>)}</ol></article><article className="glass section-card"><div className="section-head compact"><h3><Landmark size={15} /> ????</h3><span>???? + ??????</span></div><div className="regulation-stack"><div className="regulation-block"><h4>??????</h4><ul className="rule-list">{activeCategory.detail.regulations.map((rule) => <li key={rule.title}><a href={rule.referenceUrl} target="_blank" rel="noreferrer">{rule.title}</a><span>{rule.authority}</span></li>)}</ul></div><div className="regulation-block"><h4>??????</h4>{activeCategory.detail.regulationUpdates.length ? <ul className="rule-list rule-list-compact">{activeCategory.detail.regulationUpdates.map((rule) => <li key={rule.id}><a href={rule.link} target="_blank" rel="noreferrer">{rule.title}</a><span>{rule.source}</span></li>)}</ul> : <div className="empty-news">???????????/?????</div>}</div></div></article></section></> : <section className="glass section-card empty-screen">????????...</section>}
          {error && <div className="error-tip">{error}</div>}
        </main>
      </section>
      <footer className="footer-meta-grid">
        <article className="glass section-card footer-meta-card"><div className="section-head compact"><h3>????</h3><span>?????? + ?????</span></div><ul className="footer-meta-list"><li>?????????????????????????????</li><li>??????????????????????????</li><li>???????? Reccessary,??????????</li></ul></article>
        <article className="glass section-card footer-meta-card"><div className="section-head compact"><h3>????</h3><span>???? + ???? + GitHub ????</span></div><ul className="footer-meta-list"><li>????? 45 ???????????????</li><li>???? 45 ???????,??????????</li><li>??????? <a href="https://insight.stargazer.cloud" target="_blank" rel="noreferrer">insight.stargazer.cloud</a>?</li></ul></article>
        <article className="glass section-card footer-meta-card"><div className="section-head compact"><h3>?????????</h3><span>??????,??????????</span></div><ul className="footer-meta-list"><li>??????????????,?????????????????</li><li>??????????,??????????????????????</li><li>?????????,??????????????????????</li></ul></article>
      </footer>
    </div>
  );
}

export default App;
