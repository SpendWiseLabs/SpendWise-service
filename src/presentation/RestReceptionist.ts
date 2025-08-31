import { System } from '../domain/System.js';
import { Request, Response } from 'express';

export class RestReceptionist {
  constructor(private system: System) {}

  async health(req: Request, res: Response): Promise<void> {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  }

  async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const inventory = await this.system.getInventory();
      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getIssues(req: Request, res: Response): Promise<void> {
    try {
      const issues = await this.system.getIssues();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getSavings(req: Request, res: Response) {
    try {
      const savings = await this.system.getSavings();
      res.json(savings);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  }

  async getCosts(req: Request, res: Response): Promise<void> {
    try {
      const costs = await this.system.getCosts();
      res.json(costs);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await this.system.getDashboard();
      res.json(dashboard);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
