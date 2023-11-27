import { NodeType } from '../../node.js';
import { IArguments, ArgumentsType } from '../args.js';
import { StringExpression } from '../exp/string-expression.js';

export class StringArguments implements IArguments {
  readonly argumentsType = ArgumentsType.String;
  readonly type = NodeType.Arguments;

  constructor(string: StringExpression) {
    this.children = [string];
  }

  get string() {
    return this.children[0];
  }

  children: [StringExpression];
}
