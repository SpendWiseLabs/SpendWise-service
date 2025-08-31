import { DataSource } from '../../data-source/DataSource.js';
import { listVolumes, listAddresses } from '../../services/ec2.js';
import { priceEbsGp3USDPerGBMonth, priceEipUSDPerMonth } from '../../services/pricing.js';

export class GetSavingsUseCase {
  constructor(private dataSource: DataSource) {}

  async execute() {
    // Traer inventario + precios en paralelo
    const [vols, eips, pGp3, pEip] = await Promise.all([
      listVolumes(),
      listAddresses(),
      priceEbsGp3USDPerGBMonth(),
      priceEipUSDPerMonth(),
    ]);

    // EBS sin uso: volúmenes en estado "available"
    const availableVolumes = vols.filter((v) => v.State === 'available');
    const availableGiB = availableVolumes.reduce((s, v) => s + (v.SizeGiB || 0), 0);

    // EIPs sin asociar
    const unassociatedEips = eips.filter((e) => !e.AssociationId).length;

    // Estimación de ahorro
    const ebsUSD = +(availableGiB * pGp3).toFixed(2);
    const eipUSD = +(unassociatedEips * pEip).toFixed(2);
    const total = +(ebsUSD + eipUSD).toFixed(2);

    return {
      totalSavings: total,
      currency: 'USD',
      breakdown: {
        ec2: 0,
        ebs: ebsUSD,
        rds: 0,
        eip: eipUSD,
        s3: 0,
      },
      resources: {
        idleInstances: 0,
        availableVolumes: availableVolumes.length,
        unassociatedEips: unassociatedEips,
        stoppedRds: 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}
