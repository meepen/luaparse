import { describe, it } from 'node:test';
import assert from 'node:assert';
import { TableConstructorExpression } from './table-constructor-expression.js';
import { FieldArrayKey } from '../fields/array-key.js';
import { TrueExpression } from './true-expression.js';

describe('TableConstructorExpression', () => {
  const fields = [new FieldArrayKey(new TrueExpression())];
  const exp = new TableConstructorExpression(fields);

  it('should return the fields', () => {
    assert.deepEqual(exp.fields, fields);
  });
});
