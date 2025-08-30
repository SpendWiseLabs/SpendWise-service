import { fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import config from 'config';
import { logger, LogLevel } from '../utils/logger.js';

interface AssumedCredentialsConfig {
  roleArn: string;
  externalId: string;
  region: string;
  sessionName: string;
  durationSeconds: number;
}

// Thread-safe cache using WeakMap to avoid memory leaks
const credentialCache = new WeakMap<object, AwsCredentialIdentityProvider>();
const cacheKey = {};

/**
 * Obtiene credenciales temporales usando STS AssumeRole con caché thread-safe
 * @returns Provider de credenciales que se renueva automáticamente
 */
export function getAssumedCredentials(): AwsCredentialIdentityProvider {
  // Validar configuración requerida
  const roleArn = config.get<string>('aws.roleArn');
  const externalId = config.get<string>('aws.externalId');

  if (!roleArn) {
    throw new Error('aws.roleArn configuration is required for AWS authentication');
  }

  if (!externalId) {
    throw new Error('aws.externalId configuration is required for AWS authentication');
  }

  // Check thread-safe cache
  const cachedProvider = credentialCache.get(cacheKey);
  if (cachedProvider) {
    return cachedProvider;
  }

  // Configuración para AssumeRole
  const configData: AssumedCredentialsConfig = {
    roleArn,
    externalId,
    region: config.get<string>('aws.region') || 'us-east-1',
    sessionName: 'backend-session',
    durationSeconds: 3600,
  };

  // Secure logging of Role ARN
  logger.logArn(LogLevel.INFO, 'Creating STS AssumeRole provider for role:', configData.roleArn);
  logger.info('Using region:', configData.region);

  // Crear provider de credenciales temporales
  const newProvider = fromTemporaryCredentials({
    params: {
      RoleArn: configData.roleArn,
      ExternalId: configData.externalId,
      RoleSessionName: configData.sessionName,
      DurationSeconds: configData.durationSeconds,
    },
    clientConfig: { region: configData.region },
  });

  // Almacenar en caché thread-safe
  credentialCache.set(cacheKey, newProvider);

  return newProvider;
}

/**
 * Limpia el caché de credenciales (útil para testing)
 */
export function clearCredentialsCache(): void {
  credentialCache.delete(cacheKey);
  logger.info('Credentials cache cleared');
}
