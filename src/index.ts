import express, { Express, Request, Response } from 'express';
import config from 'config';
import { RestReceptionist } from './presentation/RestReceptionist.js';
import { System } from './domain/System.js';
import { DataSource } from './data-source/DataSource.js';

const app: Express = express();
const port = config.get('port') || 8080;

const aDataSource = new DataSource();
const aSystem = new System(aDataSource);
const aRestReceptionist = new RestReceptionist(aSystem);

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.get('/health', aRestReceptionist.health.bind(aRestReceptionist));

app.get('/api/inventory', aRestReceptionist.getInventory.bind(aRestReceptionist));
app.get('/api/issues', aRestReceptionist.getIssues.bind(aRestReceptionist));
app.get('/api/savings', aRestReceptionist.getSavings.bind(aRestReceptionist));
app.get('/api/costs', aRestReceptionist.getCosts.bind(aRestReceptionist));
app.get('/api/dashboard', aRestReceptionist.getDashboard.bind(aRestReceptionist));
app.get('/api/fixplan', aRestReceptionist.getFixPlan.bind(aRestReceptionist));

app.listen(port, () => {
  console.log(`
  [server]: Server is running at http://localhost:${port}
  [env]: ${config.get('environment')}
  `);
});

app.get('/debug/env', (_req, res) => {
  res.json({
    AWS_REGION: process.env.AWS_REGION,
    ROLE_ARN: (process.env.ROLE_ARN || '').slice(0, 25) + '...',
    EXTERNAL_ID: process.env.EXTERNAL_ID,
  });
});

export { app };
