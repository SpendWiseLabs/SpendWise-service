import { SavingsEstimate } from '../entities/CostIssue.js';

export interface SavingsRepository {
  getSavingsEstimate(): Promise<SavingsEstimate>;
}
