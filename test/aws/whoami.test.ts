import { assert, expect } from 'chai';
import { suite, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { STSClient } from '@aws-sdk/client-sts';
import { whoAmI } from '../../src/aws/whoami.js';
import { clearCredentialsCache } from '../../src/aws/auth.js';
import config from 'config';

suite('AWS WhoAmI', () => {
  let stsClientStub: sinon.SinonStub;
  let configStub: sinon.SinonStub;

  beforeEach(() => {
    clearCredentialsCache();

    // Mock de configuración
    configStub = sinon.stub(config, 'get');
    configStub.withArgs('aws.roleArn').returns('arn:aws:iam::123456789012:role/test-role');
    configStub.withArgs('aws.externalId').returns('test-external-id');
    configStub.withArgs('aws.region').returns('us-east-1');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return account and ARN when authentication succeeds', async () => {
    // Mock de STS GetCallerIdentity
    const mockResponse = {
      Account: '123456789012',
      Arn: 'arn:aws:sts::123456789012:assumed-role/test-role/backend-session',
    };

    stsClientStub = sinon.stub(STSClient.prototype, 'send').resolves(mockResponse);

    const result = await whoAmI();

    expect(result.account).to.equal('123456789012');
    expect(result.arn).to.include('assumed-role/test-role/backend-session');
    expect(stsClientStub.calledOnce).to.be.true;
  });

  it('should throw error when STS call fails', async () => {
    stsClientStub = sinon.stub(STSClient.prototype, 'send').rejects(new Error('STS Error'));

    try {
      await whoAmI();
      assert.fail('Should have thrown an error');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      expect((error as Error).message).to.include('Authentication failed');
    }
  });

  it('should throw error when response is invalid', async () => {
    const mockResponse = {
      Account: undefined,
      Arn: undefined,
    };

    stsClientStub = sinon.stub(STSClient.prototype, 'send').resolves(mockResponse);

    try {
      await whoAmI();
      assert.fail('Should have thrown an error');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      expect((error as Error).message).to.include('Invalid response from STS');
    }
  });
});
