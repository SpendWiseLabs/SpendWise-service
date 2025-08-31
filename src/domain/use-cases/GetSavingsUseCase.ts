import { SavingsRepository } from '../repositories/SavingsRepository.js';
import { SavingsEstimate } from '../entities/CostIssue.js';

export class GetSavingsUseCase {
  constructor(private savingsRepository: SavingsRepository) {}

  async execute(): Promise<SavingsEstimate> {
    return this.savingsRepository.getSavingsEstimate();
  }
}
