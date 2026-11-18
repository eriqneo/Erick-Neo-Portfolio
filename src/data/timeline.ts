export interface TimelineEntry {
  years: string;
  role: string;
  org: string;
  body: string;
}

export const timeline: TimelineEntry[] = [
  {
    years: '2022 — now',
    role: 'Freelance Data Analyst & AI Engineer',
    org: 'Independent',
    body: 'Consulting with clients on their data challenges: collecting from databases and APIs, exploratory analysis, predictive models and dashboards that communicate clearly.',
  },
  {
    years: 'Now',
    // ⚠ Confirm exact title with Erick.
    role: 'AI & software',
    org: 'Code Rafiki Technologies',
    body: 'Building custom software, AI tools and automation for businesses in retail, travel, education and hospitality.',
  },
  {
    years: '2018 — 2022',
    role: 'Data Analyst',
    org: 'TMC',
    body: 'Cleaned and reconciled hospital insurance-payable data against billing and claims, surfaced patterns in denials and payments, and reported to administrators, finance and insurers.',
  },
];
