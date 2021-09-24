import './env';

import { promises as fs } from 'fs';
import { requireEnv } from 'require-env-variable';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

import { extract } from './extract';
import { logger } from './log';
import { transform } from './transform';

const { DATABASE_URL } = requireEnv('DATABASE_URL');

const main = async (argv: string[]) => yargs(hideBin(argv))
  .version(false)
  .command(
    'save <filename>',
    'Extract & transform the data, then write it to a file',
    (y) => y.positional('filename', {
      describe: 'file to write JSON data to',
    }).normalize('filename'),
    async ({ filename }) => {
      const data = await extract(DATABASE_URL).then(transform);
      await fs.writeFile(filename as string, JSON.stringify(data, null, 2), 'utf8');
      logger.info(`Wrote ${data.length} users to ${filename}`);
    },
  )
  .demandCommand()
  .parse();

main(process.argv)
  .then(() => logger.info('done'))
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
