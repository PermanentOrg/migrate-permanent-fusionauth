import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { requestLogger, responseLogger } from 'axios-logger';
import FormData from 'form-data';
import { requireEnv } from 'require-env-variable';

import { logger } from './log';
import type { Auth0UserCredentials } from './transform';

// https://auth0.com/docs/users/import-and-export-users/bulk-user-imports#create-users-json-file
const AUTH0_IMPORT_SIZE_LIMIT = 500 * 1024;

const buildForm = (connectionId: string, users: Auth0UserCredentials[]) => {
  const formData = new FormData();
  formData.append('connection_id', connectionId);
  formData.append('users', JSON.stringify(users), {
    contentType: 'text/json',
    filename: 'users.json',
  });
  return formData;
}

const loadBatch = async (
  client: AxiosInstance,
  AUTH0_CONNECTION_ID: string,
  AUTH0_DOMAIN: string,
  AUTH0_MGMT_API_TOKEN: string,
  users: Auth0UserCredentials[],
): Promise<void> => {
  const form = buildForm(AUTH0_CONNECTION_ID, users);
  const jobRequest = await client.post(
    `https://${AUTH0_DOMAIN}/api/v2/jobs/users-imports`,
    form.getBuffer(),
    {
      headers: {
        ...form.getHeaders(),
        authorization: `Bearer ${AUTH0_MGMT_API_TOKEN}`,
      },
    },
  );
  const { id } = jobRequest.data;
  logger.verbose(`User import job ${id} submitted`);
  let statusRequest: AxiosResponse;
  let { status } = jobRequest.data;
  do {
    await new Promise(r => setTimeout(r, 5000));
    statusRequest = await client.get(
      `https://${AUTH0_DOMAIN}/api/v2/jobs/${id}`,
      {
        headers: {
          authorization: `Bearer ${AUTH0_MGMT_API_TOKEN}`,
        },
      },
    );
    ({ status } = statusRequest.data);
  } while (['pending', 'processing'].includes(status));

  const { summary } = statusRequest.data;
  logger.info(`User import job ${id} ${status}`, { summary });

  if (status === 'failed') {
    const failRequest = await client.get(
      `https://${AUTH0_DOMAIN}/api/v2/jobs/${id}/errors`,
      {
        headers: {
          authorization: `Bearer ${AUTH0_MGMT_API_TOKEN}`,
        },
      },
    );
    logger.warn(`User import job ${id} errors:`, failRequest.data);
  }
};

const load = async (users: Auth0UserCredentials[]): Promise<void> => {
  const { AUTH0_CONNECTION_ID, AUTH0_DOMAIN, AUTH0_MGMT_API_TOKEN } = requireEnv(
    'AUTH0_CONNECTION_ID',
    'AUTH0_DOMAIN',
    'AUTH0_MGMT_API_TOKEN',
  );
  logger.info(`Loading ${users.length} users into ${AUTH0_DOMAIN}`);

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
  // Auth0 seems to be fine with empty import jobs, anyway.
  const batches = [
    users.slice(0, 1000),
    users.slice(1000, 2000),
    users.slice(2000, 3000),
    users.slice(3000)
  ];
  if (batches.map(b => JSON.stringify(b).length).some((l) => l > AUTH0_IMPORT_SIZE_LIMIT)) {
    throw new Error('Batch too large!');
  }
  let index = 0;
  for (const batch of batches) {
    index++;
    logger.verbose(`Loading batch ${index} of ${batch.length} users`);
    await loadBatch(client, AUTH0_CONNECTION_ID, AUTH0_DOMAIN, AUTH0_MGMT_API_TOKEN, batch);
    logger.verbose(`Finished loading batch ${index} of ${batch.length} users`);
  };
  logger.info(`Loaded ${users.length} users into ${AUTH0_DOMAIN}`);
};

export { load };
