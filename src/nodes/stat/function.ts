import { NodeType } from '../../node.js';
import { FuncBody } from '../funcbody.js';
import { FuncName } from '../funcname.js';
import { IStatement, StatementType } from '../stat.js';

export class FunctionStatement implements IStatement {
  readonly statementType = StatementType.FunctionDeclaration;
  readonly type = NodeType.Statement;
  readonly isLastStatement = false;

  constructor(name: FuncName, body: FuncBody) {
    this.children = [name, body];
  }

  get name() {
    return this.children[0];
  }

  get body() {
    return this.children[1];
  }

  children: [FuncName, FuncBody];
}
