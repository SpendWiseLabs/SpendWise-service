import { SavingsRepository } from '../repositories/SavingsRepository.js';
import { SavingsEstimate } from '../entities/CostIssue.js';

export class GetSavingsUseCase {
  constructor(private savingsRepository: SavingsRepository) {}

  async execute(): Promise<SavingsEstimate> {
    try {
      return await this.savingsRepository.getSavingsEstimate();
    } catch (error) {
      throw new Error(`Error retrieving savings estimate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
