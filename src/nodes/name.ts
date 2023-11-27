import { INode, NodeType } from '../node.js';

/**
 * A name node represents a name in the AST.
 * In Lua, a name is a string of letters, digits, and underscores, not beginning with a digit.
 * In LuaJIT, a name can also contain characters above 0x7F.
 */
export class Name implements INode {
  readonly type = NodeType.Name;
  readonly children = [];

  constructor(public name: string) {}
}
