export interface ProjectVideo {
  /** Silent 16:10 loop (H.264). */
  mp4: string;
  /** Same loop as VP9 — smaller where supported. */
  webm?: string;
  /** First frame, shown before playback and to reduced-motion / Save-Data visitors. */
  poster: string;
}

export interface Project {
  n: string;
  slug: string;
  kind: string;
  title: string;
  href: string;
  body: string;
  stack: string[];
  /** 16:10 WebP under /public (a sibling `-800.webp` is served to small screens). */
  image?: string;
  /** Description of `image` (from the project's case study on rafikicode.com). */
  imageAlt?: string;
  /** Extra 16:10 screenshots for the case-study strip / gallery. */
  gallery?: string[];
  /** Show in the homepage featured-work reel (right after the hero). */
  featured?: boolean;
  /** Optional screen-recording loop; replaces the still in cards and the case-study hero. */
  video?: ProjectVideo;
  /** Long-form case-study paragraphs. ⚠ Pending — the page omits the block until supplied. */
  story?: string[];
}

export interface Track {
  id: 'ai' | 'data';
  label: string;
  intro: string;
  moreHref: string;
  moreLabel: string;
  projects: Project[];
}

const ai: Project[] = [
  {
    n: '01',
    slug: 'faidapoint',
    featured: true,
    image: '/images/work/faidapoint/01.webp',
    imageAlt: 'FaidaPoint dashboard showing point-of-sale and financial information',
    video: {
      mp4: '/videos/work/faidapoint/01.mp4',
      webm: '/videos/work/faidapoint/01.webm',
      poster: '/videos/work/faidapoint/poster.webp',
    },
    kind: 'POS & finance',
    title: 'FaidaPoint',
    href: 'https://www.rafikicode.com/work/faidapoint',
    body: 'A profit-aware point-of-sale web app that keeps small-business sales and books in one operating view.',
    stack: ['Web app', 'POS', 'Product design'],
  },
  {
    n: '02',
    slug: 'safarimaster',
    image: '/images/work/safarimaster/01.webp',
    imageAlt: 'SafariMaster travel management dashboard',
    kind: 'Tour operations',
    title: 'SafariMaster',
    href: 'https://www.rafikicode.com/work/safarimaster',
    body: 'Travel management that automates the quotes, invoices, vouchers and reminders behind every journey.',
    stack: ['Web app', 'Operations', 'Automation'],
  },
  {
    n: '03',
    slug: 'little-luxury',
    featured: true,
    image: '/images/work/little-luxury/01.webp',
    imageAlt: 'Little Luxury website displayed on a laptop',
    gallery: ['/images/work/little-luxury/02.webp', '/images/work/little-luxury/03.webp'],
    kind: 'Hospitality',
    title: 'Little Luxury',
    href: 'https://www.rafikicode.com/work/little-luxury',
    body: 'A reservation experience for a guest residence in Kitengela, from discovery to booking.',
    stack: ['Web design', 'Development', 'Booking journey'],
  },
  {
    n: '04',
    slug: 'dkisaka',
    image: '/images/work/dkisaka/01.webp',
    imageAlt: 'D.Kisaka and Associates website displayed on a laptop',
    gallery: ['/images/work/dkisaka/02.webp', '/images/work/dkisaka/03.webp'],
    kind: 'Legal services',
    title: 'D.Kisaka & Associates',
    href: 'https://www.rafikicode.com/work/dkisaka-associates',
    body: 'A clear digital home that makes a complex legal practice easier to explore.',
    stack: ['Web design', 'Development', 'Content structure'],
  },
];

const data: Project[] = [
  {
    n: '01',
    slug: 'live-sales',
    featured: true,
    image: '/images/work/live-sales/01.webp',
    kind: 'Real-time BI',
    title: 'Live Sales Performance Dashboard',
    href: 'https://www.datascienceportfol.io/neo/projects/19',
    body: 'A real-time dashboard simulating live e-commerce transactions, demand swings and conversion, modelled on the views revenue teams use daily.',
    stack: ['Python', 'Plotly', 'Streamlit', 'Pandas'],
  },
  {
    n: '02',
    slug: 'medical-billing',
    image: '/images/work/medical-billing/01.webp',
    imageAlt: 'Top Procedure Codes by Billed Amount bar chart',
    kind: 'Healthcare finance',
    title: 'Medical Billing Performance',
    href: 'https://www.datascienceportfol.io/neo/projects/14',
    body: 'Financial, operational and clinical KPIs in one view, tracking $297K billed against a 97% reimbursement rate.',
    stack: ['Looker Studio', 'SQL', 'Visualisation'],
  },
  {
    n: '03',
    slug: 'churn',
    image: '/images/work/churn/01.webp',
    kind: 'Predictive model',
    title: 'Telecom Churn Prediction',
    href: 'https://www.datascienceportfol.io/neo/projects/13',
    body: 'Flags customers at risk of leaving using tenure, monthly charges and service usage.',
    stack: ['Python', 'Random Forest', 'Logistic Regression'],
  },
  {
    n: '04',
    slug: 'sentiment',
    featured: true,
    image: '/images/work/sentiment/01.webp',
    imageAlt: 'Sentiment of 144,000 tweets: 39% positive, 50% neutral, 11% negative',
    kind: 'NLP',
    title: 'iPhone 14 Launch Sentiment',
    href: 'https://www.datascienceportfol.io/neo/projects/16',
    body: '144,000 tweets analysed to read public perception in the two months before launch.',
    stack: ['NLTK', 'TextBlob', 'Seaborn', 'EDA'],
  },
];

export const tracks: Track[] = [
  {
    id: 'ai',
    label: 'AI & products',
    intro:
      'Products built with Code Rafiki Technologies for retail, travel, hospitality and legal clients across Kenya.',
    moreHref: 'https://www.rafikicode.com/work',
    moreLabel: 'All work at Code Rafiki',
    projects: ai,
  },
  {
    id: 'data',
    label: 'Data & analytics',
    intro:
      'Analytics, dashboards and models from my data portfolio, across healthcare, e-commerce and telecom.',
    moreHref: 'https://www.datascienceportfol.io/neo',
    moreLabel: 'All 19 data projects',
    projects: data,
  },
];

export interface ProjectEntry extends Project {
  track: Track;
}

/** Every project across both tracks, in display order. */
export const allProjects: ProjectEntry[] = tracks.flatMap((track) =>
  track.projects.map((p) => ({ ...p, track })),
);

export const projectUrl = (p: Pick<Project, 'slug'>) => `/work/${p.slug}/`;

/** Host of the external case study, e.g. "rafikicode.com" — used as link text. */
export const projectHost = (p: Pick<Project, 'href'>) => new URL(p.href).hostname.replace(/^www\./, '');

/** Placeholder slots for the media strip until real screenshots exist. */
export const mediaSlots = (p: Project, min = 3) => {
  const imgs = [p.image, ...(p.gallery ?? [])].filter(Boolean) as string[];
  return Array.from({ length: Math.max(min, imgs.length) }, (_, i) => imgs[i]);
};
