import { expect } from 'chai';
import { suite, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { getAssumedCredentials, clearCredentialsCache } from '../../src/aws/auth.js';
import config from 'config';

suite('AWS Authentication', () => {
  let configStub: sinon.SinonStub;

  beforeEach(() => {
    // Limpiar caché antes de cada test
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

  it('should throw error when ROLE_ARN is missing', () => {
    configStub.withArgs('aws.roleArn').returns(undefined);

    expect(() => getAssumedCredentials()).to.throw('aws.roleArn configuration is required');
  });

  it('should throw error when EXTERNAL_ID is missing', () => {
    configStub.withArgs('aws.externalId').returns(undefined);

    expect(() => getAssumedCredentials()).to.throw('aws.externalId configuration is required');
  });

  it('should return credential provider when configuration is valid', () => {
    const credentials = getAssumedCredentials();

    expect(credentials).to.be.a('function');
    expect(typeof credentials).to.equal('function');
  });

  it('should cache credential provider on subsequent calls', () => {
    const credentials1 = getAssumedCredentials();
    const credentials2 = getAssumedCredentials();

    expect(credentials1).to.equal(credentials2);
  });

  it('should clear cache when clearCredentialsCache is called', () => {
    const credentials1 = getAssumedCredentials();
    clearCredentialsCache();
    const credentials2 = getAssumedCredentials();

    expect(credentials1).to.not.equal(credentials2);
  });
});
