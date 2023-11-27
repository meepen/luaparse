import { INode, NodeType } from '../node.js';
import { Chunk } from './chunk.js';
import { ParameterList } from './parlist.js';

export class FuncBody implements INode {
  readonly type = NodeType.FuncBody;

  constructor(parameterList: ParameterList, body: Chunk) {
    this.children = [parameterList, body];
  }

  get parameterList() {
    return this.children[0];
  }

  get body(): Chunk {
    return this.children[1];
  }

  children: [ParameterList, Chunk];
}
