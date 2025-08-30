import { fromTemporaryCredentials } from '@aws-sdk/credential-providers';
import type { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import config from 'config';

interface AssumedCredentialsConfig {
  roleArn: string;
  externalId: string;
  region: string;
  sessionName: string;
  durationSeconds: number;
}

let cachedProvider: AwsCredentialIdentityProvider | null = null;

/**
 * Obtiene credenciales temporales usando STS AssumeRole con caché automático
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

  // Si ya tenemos un provider en caché, lo reutilizamos
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

  console.log(`[INFO] Creating STS AssumeRole provider for role: ${configData.roleArn}`);
  console.log(`[INFO] Using region: ${configData.region}`);

  // Crear provider de credenciales temporales
  cachedProvider = fromTemporaryCredentials({
    params: {
      RoleArn: configData.roleArn,
      ExternalId: configData.externalId,
      RoleSessionName: configData.sessionName,
      DurationSeconds: configData.durationSeconds,
    },
    clientConfig: { region: configData.region },
  });

  return cachedProvider;
}

/**
 * Limpia el caché de credenciales (útil para testing)
 */
export function clearCredentialsCache(): void {
  cachedProvider = null;
  console.log('[INFO] Credentials cache cleared');
}
