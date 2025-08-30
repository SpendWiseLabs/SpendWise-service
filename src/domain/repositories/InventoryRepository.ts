import { Ec2Instance, EbsVolume, RdsInstance, S3Bucket, ElasticIp } from '../entities/AwsResource.js';

export interface InventoryRepository {
  getEc2Instances(): Promise<Ec2Instance[]>;
  getEbsVolumes(): Promise<EbsVolume[]>;
  getRdsInstances(): Promise<RdsInstance[]>;
  getS3Buckets(): Promise<S3Bucket[]>;
  getElasticIps(): Promise<ElasticIp[]>;
  getAllResources(): Promise<{
    ec2: Ec2Instance[];
    ebs: EbsVolume[];
    rds: RdsInstance[];
    s3: S3Bucket[];
    eip: ElasticIp[];
  }>;
}
