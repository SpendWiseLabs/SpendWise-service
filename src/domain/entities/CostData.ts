export interface CostData {
  status: 'ingesting' | 'ready' | 'unavailable';
  totalCost?: number;
  currency?: string;
  period?: {
    start: string;
    end: string;
  };
  breakdown?: {
    ec2: number;
    ebs: number;
    rds: number;
    s3: number;
    eip: number;
    other: number;
  };
  lastUpdated: string;
}
