import { NodeType } from '../../node.js';
import { FuncBody } from '../funcbody.js';
import { Name } from '../name.js';
import { IStatement, StatementType } from '../stat.js';

export class LocalFunctionStatement implements IStatement {
  readonly statementType = StatementType.LocalFunctionDeclaration;
  readonly type = NodeType.Statement;
  readonly isLastStatement = false;

  constructor(name: Name, body: FuncBody) {
    this.children = [name, body];
  }

  get name() {
    return this.children[0];
  }

  get body() {
    return this.children[1];
  }

  children: [Name, FuncBody];
}
