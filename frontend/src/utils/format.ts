export function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelative(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export function getHealthColor(summary: string): string {
  switch (summary) {
    case 'Healthy': return 'text-emerald-accent';
    case 'Stable': return 'text-cyan-accent';
    case 'Needs Attention': return 'text-amber-risk';
    case 'High Risk': return 'text-red-500';
    default: return 'text-graphite-500';
  }
}

export function getHealthBg(summary: string): string {
  switch (summary) {
    case 'Healthy': return 'bg-emerald-50 border-emerald-200';
    case 'Stable': return 'bg-cyan-50 border-cyan-200';
    case 'Needs Attention': return 'bg-amber-50 border-amber-200';
    case 'High Risk': return 'bg-red-50 border-red-200';
    default: return 'bg-white border-graphite-200';
  }
}

export function getRiskHintColor(hint: string): string {
  switch (hint) {
    case 'high': return 'text-red-500 bg-red-50';
    case 'medium': return 'text-amber-risk bg-amber-50';
    default: return 'text-emerald-accent bg-emerald-50';
  }
}

export interface SuggestedRepo {
  owner: string;
  name: string;
  label: string;
  description: string;
  language: string;
  stars: number;
}

export const SUGGESTED_REPOS: SuggestedRepo[] = [
  {
    owner: 'facebook',
    name: 'react',
    label: 'facebook/react',
    description: 'The library for web and native user interfaces.',
    language: 'JavaScript',
    stars: 230000,
  },
  {
    owner: 'vercel',
    name: 'next.js',
    label: 'vercel/next.js',
    description: 'The React framework for production with server rendering and routing.',
    language: 'TypeScript',
    stars: 130000,
  },
  {
    owner: 'nodejs',
    name: 'node',
    label: 'nodejs/node',
    description: 'Node.js JavaScript runtime built on Chrome V8 engine.',
    language: 'JavaScript',
    stars: 110000,
  },
  {
    owner: 'microsoft',
    name: 'vscode',
    label: 'microsoft/vscode',
    description: 'Visual Studio Code editor. Open source and cross platform.',
    language: 'TypeScript',
    stars: 170000,
  },
  {
    owner: 'expressjs',
    name: 'express',
    label: 'expressjs/express',
    description: 'Fast, unopinionated web framework for Node.js.',
    language: 'JavaScript',
    stars: 66000,
  },
  {
    owner: 'nestjs',
    name: 'nest',
    label: 'nestjs/nest',
    description: 'Progressive Node.js framework for scalable server side apps.',
    language: 'TypeScript',
    stars: 68000,
  },
  {
    owner: 'prisma',
    name: 'prisma',
    label: 'prisma/prisma',
    description: 'Next generation ORM for Node.js and TypeScript.',
    language: 'TypeScript',
    stars: 40000,
  },
  {
    owner: 'tailwindlabs',
    name: 'tailwindcss',
    label: 'tailwindlabs/tailwindcss',
    description: 'Utility first CSS framework for rapid UI development.',
    language: 'TypeScript',
    stars: 85000,
  },
];

export const SUGGESTED_QUERIES = [
  'react typescript',
  'node express api',
  'machine learning python',
  'developer tools',
  'open source dashboard',
];

export const CHART_COLORS = [
  '#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
];
