import { InventoryRepository } from '../repositories/InventoryRepository.js';
import { IssuesRepository } from '../repositories/IssuesRepository.js';
import { SavingsRepository } from '../repositories/SavingsRepository.js';
import { CostsRepository } from '../repositories/CostsRepository.js';
import { DashboardData } from '../entities/DashboardData.js';

export class GetDashboardUseCase {
  constructor(
    private inventoryRepository: InventoryRepository,
    private issuesRepository: IssuesRepository,
    private savingsRepository: SavingsRepository,
    private costsRepository: CostsRepository,
  ) {}

  async execute(): Promise<DashboardData> {
    try {
      const [inventory, issues, savings, costs] = await Promise.all([
        this.inventoryRepository.getAllResources(),
        this.issuesRepository.getCostIssues(),
        this.savingsRepository.getSavingsEstimate(),
        this.costsRepository.getCostData(),
      ]);

      const totalResources =
        inventory.ec2.length + inventory.ebs.length + inventory.rds.length + inventory.s3.length + inventory.eip.length;

      const totalSavings = savings.totalSavings;
      const totalIssues = issues.length;
      const totalCosts = costs.totalCost ?? 0;

      return {
        inventory,
        issues,
        savings,
        costs,
        summary: {
          totalResources,
          totalIssues,
          totalSavings,
          totalCosts,
        },
      };
    } catch (error) {
      throw new Error(`Error retrieving dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
