import type { Timestamp } from 'firebase/firestore';

export type Application = {
  id: string;
  name: string;
  version: string;
  htmlContent: string;
  password?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type ApplicationData = Omit<Application, 'createdAt' | 'updatedAt'> & {
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
};
