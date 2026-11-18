export interface Service {
  n: string;
  title: string;
  body: string;
  tags: string[];
  /** Dot-matrix suit glyph shown on the service's playing card. */
  suit: 'ai' | 'bi' | 'pred';
  /** Side-panel "reflection" in the deck — names must match items in data/stack.ts. */
  tools: string[];
  /** Related project slugs (data/projects.ts), shown beside the card. ⚠ Editorial pairing — confirm. */
  work: string[];
}

export const services: Service[] = [
  {
    n: '01',
    title: 'AI systems & automation',
    suit: 'ai',
    tools: ['Python', 'LLMs & RAG', 'Workflow automation'],
    work: ['safarimaster', 'faidapoint'],
    body: 'Custom AI tools, assistants and automated workflows built around how your business actually runs.',
    tags: ['LLM apps', 'RAG', 'Automation', 'Integrations'],
  },
  {
    n: '02',
    title: 'Data analysis & BI',
    suit: 'bi',
    tools: ['SQL', 'BigQuery', 'Tableau', 'Looker Studio'],
    work: ['live-sales', 'medical-billing'],
    body: 'From messy spreadsheets to dashboards your team trusts, with reporting that moves from days to real-time.',
    tags: ['SQL', 'BigQuery', 'Tableau', 'Looker Studio'],
  },
  {
    n: '03',
    title: 'Predictive analytics',
    suit: 'pred',
    tools: ['scikit-learn', 'XGBoost · LightGBM', 'NLTK · TextBlob'],
    work: ['churn', 'sentiment'],
    body: 'Churn, demand and risk models that tell you what happens next, explained in plain business language.',
    tags: ['Forecasting', 'Classification', 'scikit-learn', 'XGBoost'],
  },
];
