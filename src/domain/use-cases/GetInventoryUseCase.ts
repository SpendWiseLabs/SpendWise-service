import { DataSource } from '../../data-source/DataSource.js';
import { listInstances, listVolumes, listAddresses } from '../../services/ec2.js';

export class GetInventoryUseCase {
  constructor(private dataSource: DataSource) {}

  async execute() {
    const [ec2, ebs, eip] = await Promise.all([listInstances(), listVolumes(), listAddresses()]);
    return { ec2, ebs, rds: [], s3: [], eip };
  }
}
