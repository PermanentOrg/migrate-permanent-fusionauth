import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js/max';

import { logger } from './log';

import type { PermanentUserCredentials } from './extract';

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
  mfa_factors?: (EmailMFA | PhoneMFA)[];
};

const hasPhoneMfa = (user: PermanentUserCredentials): boolean => (
  user.phoneVerified === 1 && !!user.phone && isValidPhoneNumber(user.phone, 'US')
);

const getMfaFactors = (user: PermanentUserCredentials) => (
  (user.emailVerified === 1 || hasPhoneMfa(user)) ? {
    mfa_factors: [
      ...(user.emailVerified === 1 ? [{
        email: {
          value: user.email,
        },
      }] : []),
      ...(hasPhoneMfa(user) && !!user.phone ? [{
        phone: {
          value: parsePhoneNumberFromString(user.phone, 'US')!.number as string,
        },
      }] : []),
    ],
  } : {}
);

const permanentToAuth0 = (user: PermanentUserCredentials): Auth0UserCredentials => ({
  email: user.email,
  email_verified: !!user.emailVerified,
  name: user.name,
  password_hash: user.passwordHash.replace('$2y$', '$2a$'),
  password_set_date: user.passwordDate.toISOString(),
  ...getMfaFactors(user),
});

const transform = (
  userCredentials: PermanentUserCredentials[]
): Auth0UserCredentials[] => userCredentials.map(permanentToAuth0);

export { transform };
