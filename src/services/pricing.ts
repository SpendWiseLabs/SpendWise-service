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

  // Check cache
  const cachedPrice = pricingCache.get(cacheKey);
  if (cachedPrice !== null) return cachedPrice;

  try {
    const credentials = getAssumedCredentials();
    const pricingClient = new PricingClient({
      region: 'us-east-1', // Commercial Pricing API region
      credentials,
    });

    // Correct filters for GP3 per GB-Month (not IOPS)
    const command = new GetProductsCommand({
      ServiceCode: 'AmazonEC2',
      Filters: [
        { Type: 'TERM_MATCH', Field: 'location', Value: 'US East (N. Virginia)' },
        { Type: 'TERM_MATCH', Field: 'usagetype', Value: 'EBS:VolumeUsage.gp3' }, // key
        { Type: 'TERM_MATCH', Field: 'productFamily', Value: 'Storage' }, // avoids IOPS/Throughput
      ],
      MaxResults: 1,
    });

    const response = await pricingClient.send(command);
    if (!response.PriceList?.[0]) throw new Error('No pricing data found for EBS gp3');

    const priceDoc =
      typeof response.PriceList[0] === 'string' ? JSON.parse(response.PriceList[0] as string) : response.PriceList[0];

    const terms = priceDoc.terms?.OnDemand;
    if (!terms) throw new Error('No OnDemand terms found in pricing data');

    const odKey = Object.keys(terms)[0];
    if (!odKey) throw new Error('No OnDemand term key');

    const dims = terms[odKey].priceDimensions;
    if (!dims) throw new Error('No priceDimensions in OnDemand term');

    // ✅ Select the dimension whose unit is GB-Mo
    const dimKey = Object.keys(dims).find((k) => dims[k]?.unit === 'GB-Mo');
    if (!dimKey) throw new Error('No GB-Mo price dimension found');

    const usd = dims[dimKey].pricePerUnit?.USD;
    const price = usd ? parseFloat(usd) : NaN;
    if (!isFinite(price)) throw new Error('Invalid USD price value');

    logger.info(`Retrieved EBS gp3 GB-Mo price from AWS Pricing API: $${price} per GB-month`);
    pricingCache.set(cacheKey, price);
    return price;
  } catch (error) {
    const fallbackPrice = process.env.PRICE_EBS_GP3_USD_PER_GB
      ? parseFloat(process.env.PRICE_EBS_GP3_USD_PER_GB)
      : DEFAULT_EBS_GP3_PRICE_USD_PER_GB_MONTH;

    const safe = isFinite(fallbackPrice) ? fallbackPrice : DEFAULT_EBS_GP3_PRICE_USD_PER_GB_MONTH;
    if (!isFinite(fallbackPrice)) {
      logger.warn(`Invalid PRICE_EBS_GP3_USD_PER_GB env; using default ${DEFAULT_EBS_GP3_PRICE_USD_PER_GB_MONTH}`);
    }
    logger.info(
      `Using fallback EBS GP3 price: $${safe} per GB-month (AWS Pricing API failed: ${(error as Error).message})`,
    );
    pricingCache.set(cacheKey, safe);
    return safe;
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
