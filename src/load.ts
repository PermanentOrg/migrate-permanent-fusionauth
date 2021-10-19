import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { requestLogger, responseLogger } from 'axios-logger';
import { requireEnv } from 'require-env-variable';

import { logger } from './log';
import type { FusionAuthUserCredentials } from './transform';

const loadBatch = async (
  client: AxiosInstance,
  IDP_MGMT_API_TOKEN: string,
  IMPORT_URL: string,
  users: FusionAuthUserCredentials[],
): Promise<void> => {
  try {
    await client.post(
      IMPORT_URL,
      { users },
      {
        headers: {
          authorization: IDP_MGMT_API_TOKEN,
        },
      },
    );
  } catch (err: unknown) {
    logger.warn('Error importing:', err);
  }
};

const load = async (users: FusionAuthUserCredentials[]): Promise<void> => {
  const { IDP_MGMT_API_TOKEN, IMPORT_URL } = requireEnv(
    'IDP_MGMT_API_TOKEN',
    'IMPORT_URL',
  );
  logger.info(`Loading ${users.length} users into ${IMPORT_URL}`);

  const client = axios.create();
  client.interceptors.request.use((request) => requestLogger(request, {
    data: false,
    logger: logger.http.bind(logger),
    prefixText: false,
  }));
  client.interceptors.response.use((response) => responseLogger(response, {
    logger: logger.http.bind(logger),
    prefixText: false,
  }));

  // This is stupid and simple. Rather than write code to split effectively,
  // just always do four batches of about 1k users each.
  const batches = [
    users.slice(0, 1000),
    users.slice(1000, 2000),
    users.slice(2000, 3000),
    users.slice(3000)
  ].filter(b => b.length > 0);
  let index = 0;
  for (const batch of batches) {
    index++;
    logger.verbose(`Loading batch ${index} of ${batch.length} users`);
    await loadBatch(client, IDP_MGMT_API_TOKEN, IMPORT_URL, batch);
    logger.verbose(`Finished loading batch ${index} of ${batch.length} users`);
  };
  logger.info(`Loaded ${users.length} users into ${IMPORT_URL}`);
};

export { load };
