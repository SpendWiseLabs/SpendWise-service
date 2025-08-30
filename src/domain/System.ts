import { DataSource } from '../data-source/DataSource.js';
import { GetInventoryUseCase } from './use-cases/GetInventoryUseCase.js';
import { GetIssuesUseCase } from './use-cases/GetIssuesUseCase.js';
import { GetSavingsUseCase } from './use-cases/GetSavingsUseCase.js';
import { GetCostsUseCase } from './use-cases/GetCostsUseCase.js';
import { GetDashboardUseCase } from './use-cases/GetDashboardUseCase.js';

export class System {
  private dataSource: DataSource;
  private getInventoryUseCase: GetInventoryUseCase;
  private getIssuesUseCase: GetIssuesUseCase;
  private getSavingsUseCase: GetSavingsUseCase;
  private getCostsUseCase: GetCostsUseCase;
  private getDashboardUseCase: GetDashboardUseCase;

  constructor(aDataSource: DataSource) {
    this.dataSource = aDataSource;

    this.getInventoryUseCase = new GetInventoryUseCase(aDataSource);
    this.getIssuesUseCase = new GetIssuesUseCase(aDataSource);
    this.getSavingsUseCase = new GetSavingsUseCase(aDataSource);
    this.getCostsUseCase = new GetCostsUseCase(aDataSource);
    this.getDashboardUseCase = new GetDashboardUseCase(aDataSource, aDataSource, aDataSource, aDataSource);
  }
}
