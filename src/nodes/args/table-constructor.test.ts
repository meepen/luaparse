import assert from 'node:assert';
import { TableConstructorExpression } from '../exp/table-constructor-expression.js';
import { TableConstructorArguments } from './table-constructor.js';

describe('TableConstructorArguments', () => {
  const tab = new TableConstructorExpression([]);
  const args = new TableConstructorArguments(tab);
  it('should return the table', () => {
    assert.deepEqual(args.table, tab);
  });
});
