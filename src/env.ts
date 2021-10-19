import { config } from 'dotenv';
import { requireEnv } from 'require-env-variable';

config();

requireEnv(
  'DATABASE_URL',
  'IDP_APPLICATION_ID',
);
