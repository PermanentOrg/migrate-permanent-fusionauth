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
  insertInstant: number;
  passwordLastUpdateInstant: number;
  mobilePhone?: string;
  twoFactorEnabled: boolean;
  twoFactor?: {
    methods: (EmailMFA | PhoneMFA)[];
  };
};

const hasPhone = (user: PermanentUserCredentials): boolean => (
  user.phoneVerified === 1 && !!user.phone && isValidPhoneNumber(user.phone, 'US')
);

const normalizePhoneNumber = (phoneNumber: string): string => (
  parsePhoneNumberFromString(phoneNumber, 'US')!.number as string
);

const getMfaFactors = (user: PermanentUserCredentials) => (
  (user.emailVerified === 1 || hasPhone(user)) ? {
    twoFactorEnabled: true,
    twoFactor: {
      methods: [
        ...(user.emailVerified === 1 ? [{
          method: 'email',
          email: user.email,
        }] : []),
        ...(hasPhone(user) && !!user.phone ? [{
          method: 'sms',
          mobilePhone: normalizePhoneNumber(user.phone),
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

const getPhone = (user: PermanentUserCredentials) => (
  hasPhone(user) ? { mobilePhone: normalizePhoneNumber(user.phone as string) } : {}
);

const getRegistrations = (user: PermanentUserCredentials) => (
  user.lastLoginDate === null ? {} : {
    registrations: [{
      applicationId: process.env.IDP_APPLICATION_ID,
      insertInstant: user.accountDate.getTime(),
      lastLoginInstant: user.lastLoginDate.getTime(),
      verified: true,
    }],
  }
);


const permanentToFusionAuth = (user: PermanentUserCredentials): FusionAuthUserCredentials => ({
  active: true,
  email: user.email,
  verified: !!user.emailVerified,
  fullName: user.name,
  insertInstant: user.accountDate.getTime(),
  passwordLastUpdateInstant: user.passwordDate.getTime(),
  ...getPhone(user),
  ...passwordToFusionAuth(user.passwordHash),
  ...getMfaFactors(user),
  ...getRegistrations(user),
});

const transform = (
  userCredentials: PermanentUserCredentials[]
): FusionAuthUserCredentials[] => userCredentials.map(permanentToFusionAuth);

export { transform };
