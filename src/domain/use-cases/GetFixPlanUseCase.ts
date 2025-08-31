import { DataSource } from '../../data-source/DataSource.js';
import { listVolumes, listAddresses } from '../../services/ec2.js';
import { priceEbsGp3USDPerGBMonth, priceEipUSDPerMonth } from '../../services/pricing.js';

export class GetFixPlanUseCase {
  constructor(private dataSource: DataSource) {}

  async execute() {
    const [vols, eips, pGp3, pEip] = await Promise.all([
      listVolumes(),
      listAddresses(),
      priceEbsGp3USDPerGBMonth(),
      priceEipUSDPerMonth(),
    ]);

    // EBS “available” → candidatos para borrar
    const ebsToDelete = vols
      .filter((v) => v.State === 'available')
      .map((v) => ({ id: v.Id, sizeGiB: v.SizeGiB ?? 0, az: v.AZ }));

    const totalGiB = ebsToDelete.reduce((s, v) => s + v.sizeGiB, 0);

    // EIP sin asociar → candidatos para liberar
    const eipsToRelease = eips
      .filter((e) => !e.AssociationId)
      .map((e) => ({ allocationId: e.AllocationId!, publicIp: e.PublicIp! }));

    const estEbsUSD = +(totalGiB * pGp3).toFixed(2);
    const estEipUSD = +(eipsToRelease.length * pEip).toFixed(2);

    return {
      summary: {
        ebsCount: ebsToDelete.length,
        eipCount: eipsToRelease.length,
        estMonthlyUSD: +(estEbsUSD + estEipUSD).toFixed(2),
      },
      assumptions: {
        gp3USDPerGBMonth: pGp3,
        eipUSDPerMonth: pEip,
      },
      ebsToDelete,
      eipsToRelease,
      disclaimer: 'Solo lectura. Verifica con el equipo antes de eliminar volúmenes o liberar EIPs.',
      generatedAt: new Date().toISOString(),
    };
  }
}
