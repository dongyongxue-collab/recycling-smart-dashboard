export interface QuoteItem {
  id: string;
  title: string;
  region?: string;
  price: number;
  unit: string;
  priceText: string;
  source: string;
  sourceUrl: string;
  publishedAt: string;
  isTianjinPriority: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  link: string;
  publishedAt: string;
}

export interface CostPart {
  label: string;
  percent: number;
}

export interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

export interface RegulationItem {
  title: string;
  authority: string;
  referenceUrl: string;
}

export interface CategorySnapshot {
  id: string;
  name: string;
  quotes: QuoteItem[];
  domesticNews: NewsItem[];
  internationalNews: NewsItem[];
  detail: {
    subcategories: string[];
    painPoints: string[];
    costStructure: CostPart[];
    processFlow: ProcessStep[];
    regulations: RegulationItem[];
    commonRegulations: RegulationItem[];
    categoryRegulations: RegulationItem[];
    supportMaterials: NewsItem[];
    regulationUpdates: NewsItem[];
  };
  analytics: {
    history: Array<{ month: string; price: number }>;
    regionBars: Array<{ region: string; avgPrice: number }>;
    subcategoryShares: Array<{ name: string; value: number }>;
  };
}

export interface RecyclingKnowledgeSnapshot {
  fetchedAt: string;
  cityPriority: string;
  globalNews: {
    domesticNews: NewsItem[];
    internationalNews: NewsItem[];
  };
  categories: CategorySnapshot[];
}
