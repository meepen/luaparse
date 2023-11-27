import { INode, NodeType } from '../node.js';
import { VariablePrefixExpression } from './types.js';

export class VariableList implements INode {
  readonly type = NodeType.VariableList;

  constructor(variables: VariablePrefixExpression[]) {
    this.children = variables;
  }

  get variables() {
    return this.children;
  }

  children: VariablePrefixExpression[];
}
