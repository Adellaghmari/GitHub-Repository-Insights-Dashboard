import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  githubToken: process.env.GITHUB_TOKEN || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export const isDatabaseConfigured = (): boolean => {
  return Boolean(env.databaseUrl && env.databaseUrl.length > 0);
};
