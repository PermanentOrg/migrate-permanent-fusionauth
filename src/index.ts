import './env';

import { requireEnv } from 'require-env-variable';

import { extract } from './extract';
import { logger } from './log';

const { DATABASE_URL } = requireEnv('DATABASE_URL');
extract(DATABASE_URL)
  .then(() => logger.info('done'))
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
