import { NodeType } from '../../node.js';
import { IField, FieldType } from '../field.js';
import { Name } from '../name.js';
import { Expression } from '../types.js';

export class FieldNameKey implements IField {
  readonly fieldType = FieldType.NameExpression;
  readonly type = NodeType.Field;

  constructor(key: Name, value: Expression) {
    this.children = [key, value];
  }

  get key() {
    return this.children[0];
  }

  get value() {
    return this.children[1];
  }

  children: [Name, Expression];
}
