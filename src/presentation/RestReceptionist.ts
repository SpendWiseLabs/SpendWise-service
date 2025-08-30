import { Request, Response } from 'express';
import { System } from '../domain/System.js';

export class RestReceptionist {
  private system: System;

  constructor(aSystem: System) {
    this.system = aSystem;
  }

  public health(request: Request, response: Response) {
    response.sendStatus(200);
  }
}
