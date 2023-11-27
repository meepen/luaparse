import { NodeType } from '../../node.js';
import { Chunk, Expression } from '../index.js';
import { Name } from '../name.js';
import { IStatement, StatementType } from '../stat.js';

export class ForStatement implements IStatement {
  readonly type = NodeType.Statement;
  readonly statementType = StatementType.ForDoBlockEnd;
  readonly isLastStatement = false;

  constructor(
    varName: Name,
    body: Chunk,
    startExpression: Expression,
    endExpression: Expression,
    stepExpression?: Expression,
  ) {
    this.children = stepExpression
      ? [varName, startExpression, endExpression, stepExpression, body]
      : [varName, startExpression, endExpression, body];
  }

  get varName() {
    return this.children[0];
  }

  get startExpression() {
    return this.children[1];
  }

  get endExpression() {
    return this.children[2];
  }

  get stepExpression() {
    return this.children.length === 5 ? this.children[3] : null;
  }

  get body(): Chunk {
    return this.children[this.children.length - 1] as Chunk;
  }

  children: [Name, Expression, Expression, Expression, Chunk] | [Name, Expression, Expression, Chunk];
}
