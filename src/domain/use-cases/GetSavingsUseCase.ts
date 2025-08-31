import { DataSource } from '../../data-source/DataSource.js';
import { listVolumes, listAddresses } from '../../services/ec2.js';
import { priceEbsGp3USDPerGBMonth, priceEipUSDPerMonth } from '../../services/pricing.js';

export class GetSavingsUseCase {
  constructor(private dataSource: DataSource) {}

  async execute() {
    const [vols, eips, pGp3, pEip] = await Promise.all([
      listVolumes(),
      listAddresses(),
      priceEbsGp3USDPerGBMonth(),
      priceEipUSDPerMonth(),
    ]);

    const availableVolumes = vols.filter((v) => v.State === 'available');
    const availableGiB = availableVolumes.reduce((s, v) => s + (v.SizeGiB || 0), 0);

    const unassociated = eips.filter((e) => !e.AssociationId);

    const ebsUSD = +(availableGiB * pGp3).toFixed(2);
    const eipUSD = +(unassociated.length * pEip).toFixed(2);
    const total = +(ebsUSD + eipUSD).toFixed(2);

    const recommendations = [
      ...(availableVolumes.length > 0
        ? [
            {
              type: 'EBS_AVAILABLE',
              count: availableVolumes.length,
              estimatedMonthlyUSD: ebsUSD,
              action: 'delete_unused_ebs',
              items: availableVolumes.map((v) => ({ id: v.Id, sizeGiB: v.SizeGiB, az: v.AZ })),
              note: 'Verifica que no sean discos temporales de pruebas antes de borrar.',
            },
          ]
        : []),
      ...(unassociated.length > 0
        ? [
            {
              type: 'EIP_UNASSOCIATED',
              count: unassociated.length,
              estimatedMonthlyUSD: eipUSD,
              action: 'release_unused_eip',
              items: unassociated.map((ip) => ({ allocationId: ip.AllocationId, publicIp: ip.PublicIp })),
              note: 'Si no está asociada a ninguna ENI/instancia, puedes liberarla.',
            },
          ]
        : []),
    ];

    return {
      totalSavings: total,
      currency: 'USD',
      breakdown: { ec2: 0, ebs: ebsUSD, rds: 0, eip: eipUSD, s3: 0 },
      resources: {
        idleInstances: 0,
        availableVolumes: availableVolumes.length,
        unassociatedEips: unassociated.length,
        stoppedRds: 0,
      },
      recommendations,
      lastUpdated: new Date().toISOString(),
    };
  }
}
