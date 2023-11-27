import { INode, NodeType } from '../node.js';
import { NameList } from './namelist.js';

export class ParameterList implements INode {
  readonly type = NodeType.ParameterList;

  constructor(
    namesList: NameList,
    public vararg: boolean,
  ) {
    this.children = [namesList];
  }

  get namesList() {
    return this.children[0];
  }

  children: [NameList];
}
