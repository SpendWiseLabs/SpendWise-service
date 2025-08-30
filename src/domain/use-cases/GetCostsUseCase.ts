import { CostsRepository } from '../repositories/CostsRepository.js';
import { CostData } from '../entities/CostData.js';

export class GetCostsUseCase {
  constructor(private costsRepository: CostsRepository) {}

  async execute(): Promise<CostData> {
    try {
      return await this.costsRepository.getCostData();
    } catch (error) {
      throw new Error(`Error retrieving cost data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
