import { NodeType } from '../../node.js';
import { IArguments, ArgumentsType } from '../args.js';
import { ExpressionList } from '../explist.js';

export class ExpressionListArguments implements IArguments {
  readonly argumentsType = ArgumentsType.ExpressionList;
  readonly type = NodeType.Arguments;

  constructor(expressions: ExpressionList) {
    this.children = [expressions];
  }

  get expressions() {
    return this.children[0];
  }

  children: [ExpressionList];
}
