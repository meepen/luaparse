import { NodeType } from '../../node.js';
import { IArguments, ArgumentsType } from '../args.js';
import { TableConstructorExpression } from '../exp/table-constructor-expression.js';

export class TableConstructorArguments implements IArguments {
  readonly argumentsType = ArgumentsType.TableConstructor;
  readonly type = NodeType.Arguments;

  constructor(tableConstructor: TableConstructorExpression) {
    this.children = [tableConstructor];
  }

  get table() {
    return this.children[0];
  }

  children: [TableConstructorExpression];
}
