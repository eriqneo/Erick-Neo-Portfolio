export interface StackItem {
  name: string;
  note: string;
}

export interface StackGroup {
  title: string;
  items: StackItem[];
}

const item = (name: string, note: string): StackItem => ({ name, note });

export const stackGroups: StackGroup[] = [
  {
    title: 'AI engineering',
    items: [
      item('Python', 'core'),
      item('LLMs & RAG', 'assistants'),
      item('scikit-learn', 'ML'),
      item('XGBoost · LightGBM', 'boosting'),
      item('NLTK · TextBlob', 'NLP'),
      item('Workflow automation', 'ops'),
    ],
  },
  {
    title: 'Data & BI',
    items: [
      item('SQL', 'daily'),
      item('BigQuery', 'warehouse'),
      item('Tableau', 'certified'),
      item('Looker Studio', 'certified'),
      item('Pandas · NumPy', 'wrangling'),
      item('Plotly · Streamlit', 'live apps'),
    ],
  },
  {
    title: 'How I work',
    items: [
      item('Discovery & scoping', 'week 1'),
      item('Exploratory analysis', 'always'),
      item('Data storytelling', 'stakeholders'),
      item('Dashboards to real-time', 'delivery'),
      item('Mentoring teams', 'handover'),
    ],
  },
];
