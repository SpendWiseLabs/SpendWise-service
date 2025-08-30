import { InventoryRepository } from '../repositories/InventoryRepository.js';
import { Ec2Instance, EbsVolume, RdsInstance, S3Bucket, ElasticIp } from '../entities/AwsResource.js';

export class GetInventoryUseCase {
  constructor(private inventoryRepository: InventoryRepository) {}

  async execute(): Promise<{
    ec2: Ec2Instance[];
    ebs: EbsVolume[];
    rds: RdsInstance[];
    s3: S3Bucket[];
    eip: ElasticIp[];
  }> {
    try {
      return await this.inventoryRepository.getAllResources();
    } catch (error) {
      throw new Error(`Error retrieving inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
