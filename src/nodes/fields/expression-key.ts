import { NodeType } from '../../node.js';
import { IField, FieldType } from '../field.js';
import { Expression } from '../types.js';

export class FieldExpressionKey implements IField {
  readonly fieldType = FieldType.ExpressionExpression;
  readonly type = NodeType.Field;

  constructor(key: Expression, value: Expression) {
    this.children = [key, value];
  }

  get key() {
    return this.children[0];
  }

  get value() {
    return this.children[1];
  }

  children: [Expression, Expression];
}
