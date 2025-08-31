import { PricingClient, GetProductsCommand } from '@aws-sdk/client-pricing';
import { getAssumedCredentials } from '../aws/auth.js';
import { logger } from '../utils/logger.js';

// Pricing constants for fallback values
const DEFAULT_EBS_GP3_PRICE_USD_PER_GB_MONTH = 0.08;
const DEFAULT_EIP_PRICE_USD_PER_MONTH = 3.6;

// In-memory cache with 24-hour TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class PricingCache {
  private cache = new Map<string, CacheEntry<number>>();
  private readonly ttl = 24 * 60 * 60 * 1000; // 24 hours in ms

  get(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    logger.info(`Cache hit for pricing key: ${key}`);
    return entry.data;
  }

  set(key: string, value: number): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const pricingCache = new PricingCache();

/**
 * Gets the EBS GP3 price per GB-month from AWS Pricing API
 * @returns Price in USD per GB-month
 */
export async function priceEbsGp3USDPerGBMonth(): Promise<number> {
  const cacheKey = 'ebs-gp3-usd-per-gb-month';
  const cached = pricingCache.get(cacheKey);
  if (cached !== null) return cached;

  const credentials = getAssumedCredentials();
  const client = new PricingClient({ region: 'us-east-1', credentials });
  const LOCATION = 'US East (N. Virginia)';

  async function tryQuery(filters: { Type: 'TERM_MATCH'; Field: string; Value: string }[]) {
    const res = await client.send(
      new GetProductsCommand({
        ServiceCode: 'AmazonEC2',
        Filters: filters,
        MaxResults: 5, // 👈 probá más de 1
      }),
    );
    const items = res.PriceList ?? [];
    for (const item of items) {
      const doc = typeof item === 'string' ? JSON.parse(item) : item;
      const terms = doc.terms?.OnDemand;
      if (!terms) continue;
      const odKey = Object.keys(terms)[0];
      if (!odKey) continue;
      const dims = terms[odKey].priceDimensions;
      if (!dims) continue;
      // 👇 elegimos explícitamente la dimensión de almacenamiento
      const dimKey = Object.keys(dims).find((k) => dims[k]?.unit === 'GB-Mo');
      if (!dimKey) continue;
      const usd = dims[dimKey].pricePerUnit?.USD;
      const price = usd ? Number(usd) : NaN;
      if (isFinite(price)) return price;
    }
    throw new Error('no GB-Mo OnDemand price found');
  }

  try {
    // Intento A — usagetype GP3
    try {
      const p = await tryQuery([
        { Type: 'TERM_MATCH', Field: 'location', Value: LOCATION },
        { Type: 'TERM_MATCH', Field: 'usagetype', Value: 'EBS:VolumeUsage.gp3' },
        { Type: 'TERM_MATCH', Field: 'productFamily', Value: 'Storage' },
      ]);
      logger.info(`Retrieved EBS gp3 GB-Mo price (A): $${p}`);
      pricingCache.set(cacheKey, p);
      return p;
    } catch {
      /* cae al B */
    }

    // Intento B — volumeApiName GP3 (puede traer IOPS/Throughput; filtramos por unit)
    const p2 = await tryQuery([
      { Type: 'TERM_MATCH', Field: 'location', Value: LOCATION },
      { Type: 'TERM_MATCH', Field: 'volumeApiName', Value: 'gp3' },
      { Type: 'TERM_MATCH', Field: 'productFamily', Value: 'Storage' },
    ]);
    logger.info(`Retrieved EBS gp3 GB-Mo price (B): $${p2}`);
    pricingCache.set(cacheKey, p2);
    return p2;
  } catch (error) {
    // Fallback
    const fallback = process.env.PRICE_EBS_GP3_USD_PER_GB
      ? Number(process.env.PRICE_EBS_GP3_USD_PER_GB)
      : DEFAULT_EBS_GP3_PRICE_USD_PER_GB_MONTH;
    logger.info(`Using fallback EBS gp3 price: $${fallback} (reason: ${(error as Error).message})`);
    pricingCache.set(cacheKey, fallback);
    return fallback;
  }
}

/**
 * Gets the EIP price per month (currently uses fallback)
 * @returns Price in USD per month
 */
export async function priceEipUSDPerMonth(): Promise<number> {
  const cacheKey = 'eip-usd-per-month';

  // Check cache
  const cachedPrice = pricingCache.get(cacheKey);
  if (cachedPrice !== null) {
    return cachedPrice;
  }

  // For now uses fallback (in the future AWS Pricing API can be implemented)
  const fallbackPrice = process.env.PRICE_EIP_USD_PER_MONTH
    ? parseFloat(process.env.PRICE_EIP_USD_PER_MONTH)
    : DEFAULT_EIP_PRICE_USD_PER_MONTH;

  if (isNaN(fallbackPrice)) {
    logger.warn(
      `Invalid PRICE_EIP_USD_PER_MONTH environment variable, using default ${DEFAULT_EIP_PRICE_USD_PER_MONTH}`,
    );
    pricingCache.set(cacheKey, DEFAULT_EIP_PRICE_USD_PER_MONTH);
    return DEFAULT_EIP_PRICE_USD_PER_MONTH;
  }

  logger.info(`Using EIP price: $${fallbackPrice} per month`);
  pricingCache.set(cacheKey, fallbackPrice);
  return fallbackPrice;
}

/**
 * Clears the pricing cache (useful for testing)
 */
export function clearPricingCache(): void {
  pricingCache.clear();
  logger.info('Pricing cache cleared');
}
