import { randomBytes } from 'crypto';

export const makeId = (): string => {
  return randomBytes(10).toString('hex');
};
