export interface CostIssue {
  id: string;
  resourceType: 'EC2' | 'EBS' | 'RDS' | 'S3' | 'EIP';
  resourceId: string;
  issueType: 'idle' | 'unused' | 'oversized' | 'orphaned';
  description: string;
  estimatedSavings: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
}

export interface SavingsEstimate {
  totalSavings: number;
  currency: string;
  breakdown: {
    ec2: number;
    ebs: number;
    rds: number;
    eip: number;
    s3: number;
  };
  resources: {
    idleInstances: number;
    availableVolumes: number;
    unassociatedEips: number;
    stoppedRds: number;
  };
  lastUpdated: string;
}
