import { CostIssue } from '../entities/CostIssue.js';

export interface IssuesRepository {
  getCostIssues(): Promise<CostIssue[]>;
  getIssuesByType(issueType: string): Promise<CostIssue[]>;
  getIssuesBySeverity(severity: string): Promise<CostIssue[]>;
}
