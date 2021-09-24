import './env';

import { requireEnv } from 'require-env-variable';

import { extract } from './extract';
import { logger } from './log';
import { transform } from './transform';

const { DATABASE_URL } = requireEnv('DATABASE_URL');

const main = () => extract(DATABASE_URL)
  .then(transform)
  .then((users) => logger.info('Transformed', { users }))
;

main()
  .then(() => logger.info('done'))
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
