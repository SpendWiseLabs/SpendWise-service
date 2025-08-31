import { DataSource } from '../data-source/DataSource.js';
import { GetInventoryUseCase } from './use-cases/GetInventoryUseCase.js';
import { GetIssuesUseCase } from './use-cases/GetIssuesUseCase.js';
import { GetSavingsUseCase } from './use-cases/GetSavingsUseCase.js';
import { GetCostsUseCase } from './use-cases/GetCostsUseCase.js';
import { GetDashboardUseCase } from './use-cases/GetDashboardUseCase.js';
import { GetFixPlanUseCase } from './use-cases/GetFixPlanUseCase.js';

export class System {
  private dataSource: DataSource;
  private getInventoryUseCase: GetInventoryUseCase;
  private getIssuesUseCase: GetIssuesUseCase;
  private getSavingsUseCase: GetSavingsUseCase;
  private getCostsUseCase: GetCostsUseCase;
  private getDashboardUseCase: GetDashboardUseCase;
  private getFixPlanUseCase: GetFixPlanUseCase;

  constructor(aDataSource: DataSource) {
    this.dataSource = aDataSource;

    this.getInventoryUseCase = new GetInventoryUseCase(aDataSource);
    this.getIssuesUseCase = new GetIssuesUseCase(aDataSource);
    this.getSavingsUseCase = new GetSavingsUseCase(aDataSource);
    this.getCostsUseCase = new GetCostsUseCase(aDataSource);
    this.getDashboardUseCase = new GetDashboardUseCase(aDataSource, aDataSource, aDataSource, aDataSource);
    this.getFixPlanUseCase = new GetFixPlanUseCase(aDataSource);
  }

  async getInventory() {
    return this.getInventoryUseCase.execute();
  }

  async getIssues() {
    return this.getIssuesUseCase.execute();
  }

  async getSavings() {
    return this.getSavingsUseCase.execute();
  }

  async getCosts() {
    return this.getCostsUseCase.execute();
  }

  async getDashboard() {
    return this.getDashboardUseCase.execute();
  }

  async getFixPlan() {
    return this.getFixPlanUseCase.execute();
  }
}
