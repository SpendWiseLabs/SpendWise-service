import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeVolumesCommand,
  DescribeAddressesCommand,
} from '@aws-sdk/client-ec2';
import { getAssumedCredentials } from '../aws/auth.js';
import { logger } from '../utils/logger.js';
import config from 'config';

// Tipos de datos
export type Ec2Instance = {
  Id: string;
  Type?: string;
  State?: string;
  AZ?: string;
};

export type EbsVolume = {
  Id: string;
  SizeGiB: number;
  Type?: string;
  State?: string;
  AZ?: string;
};

export type Eip = {
  PublicIp: string;
  AllocationId?: string;
  AssociationId?: string | null;
};

// Cache in-memory con TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtl = 60000; // 60 segundos

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTtl): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new Cache();

// Cliente EC2 singleton
let ec2Client: EC2Client | null = null;

function getEc2Client(): EC2Client {
  if (!ec2Client) {
    const credentials = getAssumedCredentials();
    const region = config.get<string>('aws.region') || 'us-east-1';

    ec2Client = new EC2Client({
      region,
      credentials,
    });

    logger.info('EC2 client initialized for region:', region);
  }

  return ec2Client;
}

/**
 * Lista todas las instancias EC2 con paginación
 */
export async function listInstances(): Promise<Ec2Instance[]> {
  const cacheKey = 'ec2:instances';
  const cached = cache.get<Ec2Instance[]>(cacheKey);

  if (cached) {
    logger.debug('Returning cached EC2 instances');
    return cached;
  }

  const instances: Ec2Instance[] = [];
  let nextToken: string | undefined;

  try {
    do {
      const command = new DescribeInstancesCommand({
        NextToken: nextToken,
      });

      const response = await getEc2Client().send(command);

      response.Reservations?.forEach((reservation) => {
        reservation.Instances?.forEach((instance) => {
          if (instance.InstanceId) {
            instances.push({
              Id: instance.InstanceId,
              Type: instance.InstanceType,
              State: instance.State?.Name,
              AZ: instance.Placement?.AvailabilityZone,
            });
          }
        });
      });

      nextToken = response.NextToken;
    } while (nextToken);

    cache.set(cacheKey, instances);
    logger.info(`Retrieved ${instances.length} EC2 instances`);

    return instances;
  } catch (error) {
    logger.error('Error listing EC2 instances:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error(`Failed to list EC2 instances: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Lista todos los volúmenes EBS con paginación
 */
export async function listVolumes(): Promise<EbsVolume[]> {
  const cacheKey = 'ec2:volumes';
  const cached = cache.get<EbsVolume[]>(cacheKey);

  if (cached) {
    logger.debug('Returning cached EBS volumes');
    return cached;
  }

  const volumes: EbsVolume[] = [];
  let nextToken: string | undefined;

  try {
    do {
      const command = new DescribeVolumesCommand({
        NextToken: nextToken,
      });

      const response = await getEc2Client().send(command);

      response.Volumes?.forEach((volume) => {
        if (volume.VolumeId) {
          volumes.push({
            Id: volume.VolumeId,
            SizeGiB: volume.Size || 0,
            Type: volume.VolumeType,
            State: volume.State,
            AZ: volume.AvailabilityZone,
          });
        }
      });

      nextToken = response.NextToken;
    } while (nextToken);

    cache.set(cacheKey, volumes);
    logger.info(`Retrieved ${volumes.length} EBS volumes`);

    return volumes;
  } catch (error) {
    logger.error('Error listing EBS volumes:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error(`Failed to list EBS volumes: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Lista todas las direcciones IP elásticas
 */
export async function listAddresses(): Promise<Eip[]> {
  const cacheKey = 'ec2:eips';
  const cached = cache.get<Eip[]>(cacheKey);

  if (cached) {
    logger.debug('Returning cached Elastic IPs');
    return cached;
  }

  try {
    const command = new DescribeAddressesCommand({});
    const response = await getEc2Client().send(command);

    const eips: Eip[] = (response.Addresses || []).map((address) => ({
      PublicIp: address.PublicIp || '',
      AllocationId: address.AllocationId,
      AssociationId: address.AssociationId,
    }));

    cache.set(cacheKey, eips);
    logger.info(`Retrieved ${eips.length} Elastic IPs`);

    return eips;
  } catch (error) {
    logger.error('Error listing Elastic IPs:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error(`Failed to list Elastic IPs: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Limpia el caché (útil para testing)
 */
export function clearCache(): void {
  cache.clear();
  logger.debug('EC2 service cache cleared');
}
