export interface AwsResource {
  id: string;
  type: 'EC2' | 'EBS' | 'RDS' | 'S3' | 'EIP';
  name?: string;
  region: string;
  state: string;
  createdAt?: string;
  tags?: Record<string, string>;
}

export interface Ec2Instance extends AwsResource {
  type: 'EC2';
  instanceType: string;
  state: 'running' | 'stopped' | 'terminated';
  publicIp?: string;
  privateIp?: string;
}

export interface EbsVolume extends AwsResource {
  type: 'EBS';
  size: number;
  volumeType: string;
  state: 'in-use' | 'available' | 'deleting';
  attachedTo?: string;
}

export interface RdsInstance extends AwsResource {
  type: 'RDS';
  engine: string;
  instanceClass: string;
  state: 'available' | 'stopped' | 'deleting';
  endpoint?: string;
}

export interface S3Bucket extends AwsResource {
  type: 'S3';
  state: 'active';
  size?: number;
  objectCount?: number;
}

export interface ElasticIp extends AwsResource {
  type: 'EIP';
  publicIp: string;
  state: 'associated' | 'unassociated';
  associatedWith?: string;
}
