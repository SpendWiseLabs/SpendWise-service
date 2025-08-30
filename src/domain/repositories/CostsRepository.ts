import { CostData } from '../entities/CostData.js';

export interface CostsRepository {
  getCostData(): Promise<CostData>;
}
