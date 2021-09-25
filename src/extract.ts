import mysql from 'mysql2';
import puresql from 'puresql';

import { logger } from './log';

const queries = puresql.loadQueries('src/extract.sql');

export interface PermanentUserCredentials {
  email: string;
  emailVerified: number;
  name: string;
  passwordDate: Date;
  passwordHash: string;
  phone: string | null;
  phoneVerified: number;
};

const extract  = async (databaseUrl: string): Promise<PermanentUserCredentials[]> => {
  const connection = mysql.createConnection(databaseUrl);
  const adapter = puresql.adapters.mysql(connection);

  const version = await queries.version({}, adapter);
  logger.debug(`Connected to MySQL ${version[0]['version()']} database server at ${connection.config.host}`);

  const results = await queries.userCredentials({}, adapter);
  logger.verbose(`Loaded ${results.length} user credentials`);

  await connection.end();
  return results;
};

export { extract };
