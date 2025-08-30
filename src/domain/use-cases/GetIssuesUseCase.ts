import { IssuesRepository } from '../repositories/IssuesRepository.js';
import { CostIssue } from '../entities/CostIssue.js';

export class GetIssuesUseCase {
  constructor(private issuesRepository: IssuesRepository) {}

  async execute(): Promise<CostIssue[]> {
    try {
      return await this.issuesRepository.getCostIssues();
    } catch (error) {
      throw new Error(`Error retrieving cost issues: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
