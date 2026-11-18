// ⚠ Placeholder engagement models — confirm with Erick.
export interface Engagement {
  title: string;
  time: string;
  body: string;
}

export const engagements: Engagement[] = [
  {
    title: 'Data audit',
    time: '2–3 weeks',
    body: 'A deep look at your data, quick wins, and a roadmap for what AI can realistically do for you.',
  },
  {
    title: 'Build',
    time: '6–12 weeks',
    body: 'An AI system, predictive model or live dashboard, designed, shipped and handed over.',
  },
  {
    title: 'Retainer',
    time: 'Monthly',
    body: 'Ongoing analytics and AI support for teams that need a data partner on call.',
  },
];

export const engagementNote = 'Each engagement is quoted to scope after a first conversation.';
