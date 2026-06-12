CREATE TABLE IF NOT EXISTS saved_repositories (
  id SERIAL PRIMARY KEY,
  github_id BIGINT UNIQUE NOT NULL,
  owner VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(512) NOT NULL,
  description TEXT,
  html_url VARCHAR(512),
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  watchers INTEGER DEFAULT 0,
  open_issues INTEGER DEFAULT 0,
  default_branch VARCHAR(255),
  license VARCHAR(255),
  visibility VARCHAR(50),
  created_at_github TIMESTAMPTZ,
  updated_at_github TIMESTAMPTZ,
  pushed_at TIMESTAMPTZ,
  last_analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repository_snapshots (
  id SERIAL PRIMARY KEY,
  repository_id INTEGER NOT NULL REFERENCES saved_repositories(id) ON DELETE CASCADE,
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  watchers INTEGER DEFAULT 0,
  open_issues INTEGER DEFAULT 0,
  size INTEGER DEFAULT 0,
  network_count INTEGER DEFAULT 0,
  subscribers_count INTEGER DEFAULT 0,
  pushed_at TIMESTAMPTZ,
  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repository_languages (
  id SERIAL PRIMARY KEY,
  repository_id INTEGER NOT NULL REFERENCES saved_repositories(id) ON DELETE CASCADE,
  language VARCHAR(100) NOT NULL,
  bytes BIGINT DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repository_issues_summary (
  id SERIAL PRIMARY KEY,
  repository_id INTEGER NOT NULL REFERENCES saved_repositories(id) ON DELETE CASCADE,
  open_issues INTEGER DEFAULT 0,
  high_activity_estimate BOOLEAN DEFAULT FALSE,
  recent_issue_count INTEGER DEFAULT 0,
  stale_issue_count INTEGER DEFAULT 0,
  issue_risk_level VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repository_health_scores (
  id SERIAL PRIMARY KEY,
  repository_id INTEGER NOT NULL REFERENCES saved_repositories(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  popularity_score INTEGER DEFAULT 0,
  maintenance_score INTEGER DEFAULT 0,
  documentation_score INTEGER DEFAULT 0,
  risk_score INTEGER DEFAULT 0,
  summary VARCHAR(100),
  recommended_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comparison_reports (
  id SERIAL PRIMARY KEY,
  title VARCHAR(512),
  repository_ids INTEGER[] NOT NULL,
  summary TEXT,
  winner VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS search_history (
  id SERIAL PRIMARY KEY,
  query VARCHAR(512) NOT NULL,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_repos_full_name ON saved_repositories(full_name);
CREATE INDEX IF NOT EXISTS idx_saved_repos_last_analyzed ON saved_repositories(last_analyzed_at);
CREATE INDEX IF NOT EXISTS idx_snapshots_repo_id ON repository_snapshots(repository_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_repo_id ON repository_health_scores(repository_id);
