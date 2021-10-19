import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js/max';

import { logger } from './log';

import type { PermanentUserCredentials } from './extract';

interface EmailMFA {
  method: string;
  email: string;
};

interface PhoneMFA {
  method: string;
  mobilePhone: string;
};

export interface FusionAuthUserCredentials {
  active: boolean;
  email: string;
  verified: boolean;
  fullName: string;
  passwordLastUpdateInstant: number;
  mobilePhone?: string;
  twoFactorEnabled: boolean;
  twoFactor?: {
    methods: (EmailMFA | PhoneMFA)[];
  };
};

const hasPhoneMfa = (user: PermanentUserCredentials): boolean => (
  user.phoneVerified === 1 && !!user.phone && isValidPhoneNumber(user.phone, 'US')
);

const getMfaFactors = (user: PermanentUserCredentials) => (
  (user.emailVerified === 1 || hasPhoneMfa(user)) ? {
    twoFactorEnabled: true,
    twoFactor: {
      methods: [
        ...(user.emailVerified === 1 ? [{
          method: 'email',
          email: user.email,
        }] : []),
        ...(hasPhoneMfa(user) && !!user.phone ? [{
          method: 'sms',
          mobilePhone: parsePhoneNumberFromString(user.phone, 'US')!.number as string,
        }] : []),
      ]
    },
  } : {
    twoFactorEnabled: false,
  }
);

const passwordToFusionAuth = (hash: string) => ({
  encryptionScheme: 'bcrypt',
  factor: hash.substring(4, 6),
  salt: hash.substring(7, 29),
  password: hash.substring(29),
});

const permanentToFusionAuth = (user: PermanentUserCredentials): FusionAuthUserCredentials => ({
  active: true,
  email: user.email,
  verified: !!user.emailVerified,
  fullName: user.name,
  passwordLastUpdateInstant: user.passwordDate.getTime(),
  ...passwordToFusionAuth(user.passwordHash),
  ...getMfaFactors(user),
});

const transform = (
  userCredentials: PermanentUserCredentials[]
): FusionAuthUserCredentials[] => userCredentials.map(permanentToFusionAuth);

export { transform };
