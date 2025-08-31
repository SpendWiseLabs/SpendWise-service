import { listVolumes, listAddresses } from './ec2.js';
import { priceEbsGp3USDPerGBMonth, priceEipUSDPerMonth } from './pricing.js';

export interface SavingsEstimate {
  region: string;
  assumptions: { gp3USDPerGBMonth: number; eipUSDPerMonth: number };
  inputs: { ebsAvailableGiB: number; eipsUnassociated: number };
  estimateUSD: { ebs: number; eip: number; total: number };
}

export async function computeSavings(): Promise<SavingsEstimate> {
  const [vols, eips, pGp3, pEip] = await Promise.all([
    listVolumes(),
    listAddresses(),
    priceEbsGp3USDPerGBMonth(),
    priceEipUSDPerMonth(),
  ]);

  const ebsAvailableGiB = vols.filter((v) => v.State === 'available').reduce((sum, v) => sum + (v.SizeGiB || 0), 0);

  const eipsUnassociated = eips.filter((e) => !e.AssociationId).length;

  const estEbs = +(ebsAvailableGiB * pGp3).toFixed(2);
  const estEip = +(eipsUnassociated * pEip).toFixed(2);
  const total = +(estEbs + estEip).toFixed(2);

  return {
    region: process.env.AWS_REGION || 'us-east-1',
    assumptions: { gp3USDPerGBMonth: pGp3, eipUSDPerMonth: pEip },
    inputs: { ebsAvailableGiB, eipsUnassociated },
    estimateUSD: { ebs: estEbs, eip: estEip, total },
  };
}
