import { INode, NodeType } from '../node.js';
import { Expression } from './types.js';

export class ExpressionList implements INode {
  readonly type = NodeType.ExpressionList;

  constructor(expressions: Expression[]) {
    this.children = expressions;
  }

  get expressions() {
    return this.children;
  }

  children: Expression[];
}
