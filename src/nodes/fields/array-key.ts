import { NodeType } from '../../node.js';
import { IField, FieldType } from '../field.js';
import { Expression } from '../types.js';

export class FieldArrayKey implements IField {
  readonly fieldType = FieldType.Expression;
  readonly type = NodeType.Field;

  constructor(value: Expression) {
    this.children = [value];
  }

  get value() {
    return this.children[0];
  }

  children: [Expression];
}
