import dotenv from 'dotenv';

// Determine which .env file to load based on NODE_ENV
type Environment = 'development' | 'staging' | 'production' | undefined;

const env: Environment = process.env.NODE_ENV as Environment;

// Load environment-specific .env file if set and exists
if (env) {
  const envFile = `.env.${env}.local`;
  dotenv.config({ path: envFile });
} else {
  dotenv.config();
}

interface Config {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  databaseUrl: string;
  pathPrefix: string;
  hostName: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  databaseUrl: process.env.DATABASE_URL || '',
  pathPrefix: process.env.PATH_PREFIX || '/',
  hostName: process.env.HOST_NAME || 'http://localhost',
};

export default config;
