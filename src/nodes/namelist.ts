import { INode, NodeType } from '../node.js';
import { Name } from './name.js';

export class NameList implements INode {
  readonly type = NodeType.NameList;

  constructor(names: Name[]) {
    this.children = names;
  }

  get names() {
    return this.children;
  }

  children: Name[];
}
