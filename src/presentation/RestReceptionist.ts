import { Request, Response } from 'express';
import { System } from '../domain/System.js';
import { whoAmI } from '../aws/whoami.js';

export class RestReceptionist {
  private system: System;

  constructor(aSystem: System) {
    this.system = aSystem;
  }

  public health(request: Request, response: Response) {
    response.sendStatus(200);
  }

  /**
   * Endpoint para probar la conexión con AWS
   */
  public async testAwsConnection(request: Request, response: Response) {
    try {
      const identity = await whoAmI();

      response.json({
        success: true,
        message: 'AWS connection successful',
        data: {
          account: identity.account,
          arn: identity.arn,
          region: process.env.AWS_REGION || 'us-east-1',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      response.status(500).json({
        success: false,
        message: 'AWS connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
