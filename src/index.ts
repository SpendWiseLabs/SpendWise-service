import express, { Express, Request, Response } from 'express';
import config from 'config';
import { RestReceptionist } from './presentation/RestReceptionist.js';
import { System } from './domain/System.js';
import { DataSource } from './data-source/DataSource.js';

const app: Express = express();
const port = config.get('port') || 3000;

const aDataSource = new DataSource();
const aSystem = new System(aDataSource);
const aRestReceptionist = new RestReceptionist(aSystem);

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.get('/health', aRestReceptionist.health.bind(aRestReceptionist));

app.listen(port, () => {
  console.log(`
  [server]: Server is running at http://localhost:${port}
  [env]: ${config.get('environment')}
  `);
});
