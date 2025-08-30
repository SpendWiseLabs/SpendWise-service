import { DataSource } from '../data-source/DataSource.js';

export class System {
  private dataSource: DataSource;

  constructor(aDataSource: DataSource) {
    this.dataSource = aDataSource;
  }
}
