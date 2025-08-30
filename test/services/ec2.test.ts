import { expect } from 'chai';
import { suite, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { EC2Client } from '@aws-sdk/client-ec2';
import {
  listInstances,
  listVolumes,
  listAddresses,
  clearCache,
  type Ec2Instance,
  type EbsVolume,
  type Eip,
} from '../../src/services/ec2.js';
import config from 'config';

suite('EC2 Service', () => {
  let ec2ClientStub: sinon.SinonStub;
  let configStub: sinon.SinonStub;

  beforeEach(() => {
    // Mock de configuración
    configStub = sinon.stub(config, 'get');
    configStub.withArgs('aws.region').returns('us-east-1');
    configStub.withArgs('aws.roleArn').returns('arn:aws:iam::123456789012:role/test-role');
    configStub.withArgs('aws.externalId').returns('test-external-id');

    // Mock EC2Client directly
    ec2ClientStub = sinon.stub(EC2Client.prototype, 'send');

    // Clear cache before each test
    clearCache();
  });

  afterEach(() => {
    sinon.restore();
  });

  suite('listInstances', () => {
    it('should return cached instances when available', async () => {
      const mockInstances: Ec2Instance[] = [
        { Id: 'i-1234567890abcdef0', Type: 't2.micro', State: 'running', AZ: 'us-east-1a' },
      ];

      // First call - saves to cache
      ec2ClientStub.resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-1234567890abcdef0',
                InstanceType: 't2.micro',
                State: { Name: 'running' },
                Placement: { AvailabilityZone: 'us-east-1a' },
              },
            ],
          },
        ],
      });

      const result1 = await listInstances();
      expect(result1).to.deep.equal(mockInstances);

      // Second call - uses cache
      const result2 = await listInstances();
      expect(result2).to.deep.equal(mockInstances);
      expect(ec2ClientStub.calledOnce).to.be.true;
    });

    it('should handle pagination correctly', async () => {
      const mockInstances: Ec2Instance[] = [
        { Id: 'i-1234567890abcdef0', Type: 't2.micro', State: 'running', AZ: 'us-east-1a' },
        { Id: 'i-0987654321fedcba0', Type: 't3.small', State: 'stopped', AZ: 'us-east-1b' },
      ];

      // First page
      ec2ClientStub.onFirstCall().resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-1234567890abcdef0',
                InstanceType: 't2.micro',
                State: { Name: 'running' },
                Placement: { AvailabilityZone: 'us-east-1a' },
              },
            ],
          },
        ],
        NextToken: 'token123',
      });

      // Segunda página
      ec2ClientStub.onSecondCall().resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-0987654321fedcba0',
                InstanceType: 't3.small',
                State: { Name: 'stopped' },
                Placement: { AvailabilityZone: 'us-east-1b' },
              },
            ],
          },
        ],
      });

      const result = await listInstances();
      expect(result).to.deep.equal(mockInstances);
      expect(ec2ClientStub.calledTwice).to.be.true;
    });

    it('should handle empty response', async () => {
      ec2ClientStub.resolves({
        Reservations: [],
      });

      const result = await listInstances();
      expect(result).to.deep.equal([]);
    });

    it('should handle API errors', async () => {
      ec2ClientStub.rejects(new Error('EC2 API Error'));

      try {
        await listInstances();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.include('Failed to list EC2 instances');
      }
    });
  });

  suite('listVolumes', () => {
    it('should return cached volumes when available', async () => {
      const mockVolumes: EbsVolume[] = [
        { Id: 'vol-1234567890abcdef0', SizeGiB: 100, Type: 'gp3', State: 'in-use', AZ: 'us-east-1a' },
      ];

      ec2ClientStub.resolves({
        Volumes: [
          {
            VolumeId: 'vol-1234567890abcdef0',
            Size: 100,
            VolumeType: 'gp3',
            State: 'in-use',
            AvailabilityZone: 'us-east-1a',
          },
        ],
      });

      const result1 = await listVolumes();
      expect(result1).to.deep.equal(mockVolumes);

      const result2 = await listVolumes();
      expect(result2).to.deep.equal(mockVolumes);
      expect(ec2ClientStub.calledOnce).to.be.true;
    });

    it('should handle pagination for volumes', async () => {
      const mockVolumes: EbsVolume[] = [
        { Id: 'vol-1234567890abcdef0', SizeGiB: 100, Type: 'gp3', State: 'in-use', AZ: 'us-east-1a' },
        { Id: 'vol-0987654321fedcba0', SizeGiB: 50, Type: 'gp2', State: 'available', AZ: 'us-east-1b' },
      ];

      ec2ClientStub.onFirstCall().resolves({
        Volumes: [
          {
            VolumeId: 'vol-1234567890abcdef0',
            Size: 100,
            VolumeType: 'gp3',
            State: 'in-use',
            AvailabilityZone: 'us-east-1a',
          },
        ],
        NextToken: 'token123',
      });

      ec2ClientStub.onSecondCall().resolves({
        Volumes: [
          {
            VolumeId: 'vol-0987654321fedcba0',
            Size: 50,
            VolumeType: 'gp2',
            State: 'available',
            AvailabilityZone: 'us-east-1b',
          },
        ],
      });

      const result = await listVolumes();
      expect(result).to.deep.equal(mockVolumes);
      expect(ec2ClientStub.calledTwice).to.be.true;
    });

    it('should handle volumes without optional fields', async () => {
      ec2ClientStub.resolves({
        Volumes: [
          {
            VolumeId: 'vol-1234567890abcdef0',
            Size: 100,
          },
        ],
      });

      const result = await listVolumes();
      expect(result).to.deep.equal([
        { Id: 'vol-1234567890abcdef0', SizeGiB: 100, Type: undefined, State: undefined, AZ: undefined },
      ]);
    });
  });

  suite('listAddresses', () => {
    it('should return cached EIPs when available', async () => {
      const mockEips: Eip[] = [
        { PublicIp: '192.168.1.1', AllocationId: 'eipalloc-1234567890abcdef0', AssociationId: null },
      ];

      ec2ClientStub.resolves({
        Addresses: [
          {
            PublicIp: '192.168.1.1',
            AllocationId: 'eipalloc-1234567890abcdef0',
            AssociationId: null,
          },
        ],
      });

      const result1 = await listAddresses();
      expect(result1).to.deep.equal(mockEips);

      const result2 = await listAddresses();
      expect(result2).to.deep.equal(mockEips);
      expect(ec2ClientStub.calledOnce).to.be.true;
    });

    it('should handle EIPs with associations', async () => {
      ec2ClientStub.resolves({
        Addresses: [
          {
            PublicIp: '192.168.1.1',
            AllocationId: 'eipalloc-1234567890abcdef0',
            AssociationId: 'eipassoc-0987654321fedcba0',
          },
        ],
      });

      const result = await listAddresses();
      expect(result).to.deep.equal([
        {
          PublicIp: '192.168.1.1',
          AllocationId: 'eipalloc-1234567890abcdef0',
          AssociationId: 'eipassoc-0987654321fedcba0',
        },
      ]);
    });

    it('should handle empty EIPs response', async () => {
      ec2ClientStub.resolves({
        Addresses: [],
      });

      const result = await listAddresses();
      expect(result).to.deep.equal([]);
    });
  });

  suite('clearCache', () => {
    it('should clear all cached data', async () => {
      // Llenar caché primero
      ec2ClientStub.resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-1234567890abcdef0',
                InstanceType: 't2.micro',
                State: { Name: 'running' },
                Placement: { AvailabilityZone: 'us-east-1a' },
              },
            ],
          },
        ],
      });

      await listInstances();
      expect(ec2ClientStub.calledOnce).to.be.true;

      // Clear cache
      clearCache();

      // Call again - should make new API call
      await listInstances();
      expect(ec2ClientStub.calledTwice).to.be.true;
    });
  });

  suite('Error handling', () => {
    it('should handle malformed API responses', async () => {
      ec2ClientStub.resolves({
        Reservations: [
          {
            Instances: [
              {
                // Without InstanceId - should be filtered
                InstanceType: 't2.micro',
                State: { Name: 'running' },
              },
            ],
          },
        ],
      });

      const result = await listInstances();
      expect(result).to.deep.equal([]);
    });
  });
});
