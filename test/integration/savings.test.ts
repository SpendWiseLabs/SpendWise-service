import { expect } from 'chai';
import { suite, it } from 'mocha';
import request from 'supertest';
import { app } from '../../src/index.js';

suite('GET /api/savings', () => {
  it('should return savings estimate with correct structure', async () => {
    const response = await request(app).get('/api/savings').expect(200);

    // Log response for manual inspection
    console.log('Savings Response:', JSON.stringify(response.body, null, 2));

    // Verify response structure based on actual response
    expect(response.body).to.have.property('totalSavings');
    expect(response.body).to.have.property('currency');
    expect(response.body).to.have.property('breakdown');
    expect(response.body).to.have.property('resources');
    expect(response.body).to.have.property('lastUpdated');

    // Verify breakdown properties
    expect(response.body.breakdown).to.have.property('ec2');
    expect(response.body.breakdown).to.have.property('ebs');
    expect(response.body.breakdown).to.have.property('rds');
    expect(response.body.breakdown).to.have.property('eip');
    expect(response.body.breakdown).to.have.property('s3');

    // Verify resources properties
    expect(response.body.resources).to.have.property('idleInstances');
    expect(response.body.resources).to.have.property('availableVolumes');
    expect(response.body.resources).to.have.property('unassociatedEips');
    expect(response.body.resources).to.have.property('stoppedRds');

    // Verify all numeric values are non-negative
    expect(response.body.totalSavings).to.be.at.least(0);
    expect(response.body.breakdown.ec2).to.be.at.least(0);
    expect(response.body.breakdown.ebs).to.be.at.least(0);
    expect(response.body.breakdown.rds).to.be.at.least(0);
    expect(response.body.breakdown.eip).to.be.at.least(0);
    expect(response.body.breakdown.s3).to.be.at.least(0);
  });

  it('should handle errors gracefully', async () => {
    const response = await request(app).get('/api/savings').expect(200);

    expect(response.body).to.have.property('totalSavings');
    expect(response.body).to.have.property('currency');
    expect(response.body).to.have.property('breakdown');
    expect(response.body).to.have.property('resources');
    expect(response.body).to.have.property('lastUpdated');
  });
});
