import { logger } from './log';

import type { PermanentUserCredentials } from './load';

interface EmailMFA {
  email: {
    value: string;
  };
};

interface PhoneMFA {
  phone: {
    value: string;
  };
};

export interface Auth0UserCredentials {
  email: string;
  email_verified: boolean;
  name: string;
  password_hash: string;
  password_set_date: string;
  mfa_factors: (EmailMFA | PhoneMFA)[];
};

const permanentToAuth0 = (user: PermanentUserCredentials): Auth0UserCredentials => ({
  email: user.email,
  email_verified: !!user.emailVerified,
  name: user.name,
  password_hash: user.passwordHash.replace('$2y$', '$2a$'),
  password_set_date: user.passwordDate.toISOString(),
  mfa_factors: [
    ...(user.emailVerified === 1 ? [{
      email: {
        value: user.email,
      },
    }] : []),
    ...((user.phoneVerified === 1 && !!user.phone) ? [{
      phone: {
        value: user.phone, // TODO
      },
    }] : []),
  ],
});

const transform = (
  userCredentials: PermanentUserCredentials[]
): Auth0UserCredentials[] => userCredentials.map(permanentToAuth0);

export { transform };
