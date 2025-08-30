import { assert } from 'chai';
import { suite } from 'mocha';
import httpMocks from 'node-mocks-http';
import { RestReceptionist } from '../src/presentation/RestReceptionist.js';
import { System } from '../src/domain/System.js';
import { DataSource } from '../src/data-source/DataSource.js';

suite('Bootstrap suite', () => {
  it('RestReceptionist can report health status', () => {
    const aDataSource = new DataSource();
    const aSystem = new System(aDataSource);
    const aRestReceptionist = new RestReceptionist(aSystem);
    const request = httpMocks.createRequest({
      method: 'GET',
      url: '/health',
    });
    const response = httpMocks.createResponse();

    aRestReceptionist.health(request, response);

    assert.equal(response.statusCode, 200);
  });
});
