import { EbsVolume, Ec2Instance, ElasticIp, RdsInstance, S3Bucket } from './AwsResource.js';
import { CostData } from './CostData.js';
import { CostIssue, SavingsEstimate } from './CostIssue.js';

export interface DashboardData {
  inventory: {
    ec2: Ec2Instance[];
    ebs: EbsVolume[];
    rds: RdsInstance[];
    s3: S3Bucket[];
    eip: ElasticIp[];
  };
  issues: CostIssue[];
  savings: SavingsEstimate;
  costs: CostData;
  summary: {
    totalResources: number;
    totalIssues: number;
    totalSavings: number;
    totalCosts?: number;
  };
}
