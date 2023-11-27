import { INode, NodeType } from '../node.js';
import { Name } from './name.js';

export class FuncName implements INode {
  readonly type = NodeType.FunctionName;

  constructor(
    name: Name,
    indexers: Name[],
    public methodName?: Name,
  ) {
    this.children = methodName ? [name, ...indexers, methodName] : [name, ...indexers];
  }

  get name() {
    return this.children[0];
  }

  get indexers() {
    return this.children.slice(1, this.children.length - (this.methodName ? 1 : 0));
  }

  children: [Name, ...Name[]] | [Name, ...Name[], Name];
}
