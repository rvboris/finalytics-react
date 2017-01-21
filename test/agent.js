import http from 'http';
import { agent } from 'supertest';
import { app } from '../build/server/main';

export default async () => {
  const appInstance = await app();
  return agent(http.createServer(appInstance.callback()));
};
