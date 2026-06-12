import { Link } from 'react-router-dom';
import { Code, Database, BarChart3, Shield, GitBranch, Cloud } from 'lucide-react';

const techConcepts = [
  { icon: Code, title: 'REST API integration', desc: 'All GitHub requests go through the backend. The frontend never calls GitHub directly.' },
  { icon: Database, title: 'PostgreSQL caching', desc: 'Analyses cached for 24 hours to reduce API calls and speed up repeat lookups.' },
  { icon: BarChart3, title: 'Health scoring', desc: 'Scores activity, popularity, maintenance, documentation and risk on a 0 to 100 scale.' },
  { icon: Shield, title: 'Error handling', desc: 'Rate limits, network failures, missing repos and database gaps handled without crashes.' },
  { icon: GitBranch, title: 'Fullstack architecture', desc: 'React frontend and Express backend with typed interfaces and production deployment.' },
  { icon: Cloud, title: 'Deployment', desc: 'Frontend on Vercel, backend on Render and PostgreSQL on Neon.' },
];

const reviewSteps = [
  'Start on Overview to understand the product idea and the main system signals.',
  'Use Search to analyze a real public repository such as facebook/react.',
  'Open the repository report and review the health score, language breakdown, risk signals and executive summary.',
  'Go to Compare and place facebook/react next to vercel/next.js to see how the decision logic works.',
  'Open Monitor to see how the frontend, backend, GitHub API and PostgreSQL cache work together.',
];

const devReviewSteps = [
  'Run the backend on port 3001 and the frontend on port 5173.',
  'Search for a public repository and open the generated report.',
  'Save a repository to confirm that PostgreSQL persistence is working.',
  'Use Compare to test multiple repositories side by side.',
  'Check Monitor to verify API status, cache behaviour and rate limit handling.',
];

export function About() {
  return (
    <div className="page-stack max-w-3xl">
      <div className="page-header">
        <p className="page-eyebrow">Project</p>
        <h2 className="page-title">About this project</h2>
        <div className="page-header-accent" />
        <p className="page-desc">What the dashboard does and how to explore it.</p>
      </div>

      <section className="card card-interactive">
        <div className="card-body space-y-4">
          <p className="text-graphite-700 leading-relaxed">
            GitHub Repository Insights analyzes repository activity, health and technical risk using live GitHub data.
            Search any public repository and get a scored report with language breakdown,
            risk signals and a recommended course of action.
          </p>
          <p className="text-sm text-graphite-500 leading-relaxed">
            Built with React, TypeScript, Node.js, Express and PostgreSQL.
            The project covers external API integration, data analysis, caching and dashboard UI work.
          </p>
        </div>
      </section>

      <section className="card border-emerald-200/50">
        <div className="card-header">
          <h3 className="section-title">How to review this demo</h3>
        </div>
        <ol className="card-body space-y-2.5 list-decimal list-inside">
          {reviewSteps.map((step) => (
            <li key={step} className="text-sm text-graphite-600 leading-relaxed">{step}</li>
          ))}
        </ol>
      </section>

      <section className="card card-interactive">
        <div className="card-header">
          <h3 className="section-title">What the stack demonstrates</h3>
        </div>
        <div className="card-body space-y-4">
          {techConcepts.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-graphite-50 border border-graphite-200/80 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-emerald-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-graphite-800">{title}</p>
                <p className="text-sm text-graphite-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card card-interactive">
        <div className="card-header">
          <h3 className="section-title">Developer review flow</h3>
        </div>
        <div className="card-body space-y-4">
          <ol className="space-y-2.5 list-decimal list-inside">
            {devReviewSteps.map((step) => (
              <li key={step} className="text-sm text-graphite-600 leading-relaxed">{step}</li>
            ))}
          </ol>
          <p className="text-sm text-graphite-500 leading-relaxed">
            The demo is designed to show both the product experience and the technical structure behind it.
          </p>
        </div>
      </section>

      <section className="card card-interactive">
        <div className="card-header">
          <h3 className="section-title">Tech stack</h3>
        </div>
        <div className="card-body flex flex-wrap gap-2">
          {['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Recharts', 'GitHub REST API', 'Tailwind CSS', 'Vercel', 'Render', 'Neon'].map((tech) => (
            <span key={tech} className="lang-chip">{tech}</span>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/search" className="btn-primary">Try a search</Link>
        <Link to="/" className="btn-secondary">Back to overview</Link>
      </div>
    </div>
  );
}
