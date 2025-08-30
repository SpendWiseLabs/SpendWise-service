import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { getAssumedCredentials } from './auth.js';
import config from 'config';

/**
 * Obtiene la identidad del usuario/rol actual usando las credenciales asumidas
 * @returns Información de la cuenta y ARN del rol asumido
 */
export async function whoAmI(): Promise<{ account: string; arn: string }> {
  try {
    const credentials = getAssumedCredentials();
    const stsClient = new STSClient({
      region: config.get<string>('aws.region') || 'us-east-1',
      credentials,
    });

    const command = new GetCallerIdentityCommand({});
    const response = await stsClient.send(command);

    if (!response.Account || !response.Arn) {
      throw new Error('Invalid response from STS GetCallerIdentity');
    }

    console.log(`[INFO] Successfully authenticated as: ${response.Arn}`);

    return {
      account: response.Account,
      arn: response.Arn,
    };
  } catch (error) {
    console.error('[ERROR] Failed to get caller identity:', error);
    throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
