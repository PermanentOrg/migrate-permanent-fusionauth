import './env';

import { promises as fs } from 'fs';
import { isValidPhoneNumber } from 'libphonenumber-js/max';
import { requireEnv } from 'require-env-variable';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

import { extract } from './extract';
import { load } from './load';
import { logger } from './log';
import { transform } from './transform';

const { DATABASE_URL } = requireEnv('DATABASE_URL');

const main = async (argv: string[]) => yargs(hideBin(argv))
  .version(false)
  .command(
    'checkPhone',
    'Look at the extracted phone numbers, and report on how many are valid',
    (y) => y.option('list-invalid-users', { type: 'boolean' }),
    async (args) => {
      logger.info('Reporting on phone numbers');
      const data = await extract(DATABASE_URL);
      const hasPhone = data.filter(user => user.phone !== null);
      logger.info(`${hasPhone.length} users have a phone number set`);
      const isVerified = hasPhone.filter(user => !!user.phoneVerified);
      logger.info(`${isVerified.length} users have a verified phone number`);
      const isValid = isVerified.filter(user => isValidPhoneNumber(user.phone as string, 'US'));
      logger.info(`${isValid.length} users have a valid phone number`);
      const isInvalid = isVerified.filter(user => !isValidPhoneNumber(user.phone as string, 'US'));
      logger.info(`${isInvalid.length} users have an invalid phone number`);
      if (isInvalid.length > 0) {
        if (args['list-invalid-users']) {
          logger.info('Users with an invalid phone number:');
          isInvalid.forEach((user) => logger.info(`${user.name} <${user.email}>: ${user.phone}`));
        } else {
          logger.info('Call with --list-invalid-users to see full list');
        }
      }
    }
  )
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
  .command(
    'migrate',
    'Extract & transform the data, then load it into Auth0',
    () => {},
    () => extract(DATABASE_URL)
      .then(transform)
      .then(load)
      .catch((err: unknown) => { logger.error('Error migrating credentials:', { err }) })
  )
  .demandCommand()
  .parse();

main(process.argv)
  .then(() => logger.verbose('done'))
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
