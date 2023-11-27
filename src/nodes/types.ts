import { ExpressionListArguments } from './args/expression-list.js';
import { StringArguments } from './args/string.js';
import { TableConstructorArguments } from './args/table-constructor.js';
import { Chunk } from './chunk.js';
import { BinaryOperationExpression } from './exp/binary-expression.js';
import { FalseExpression } from './exp/false-expression.js';
import { FunctionExpression } from './exp/function-expression.js';
import { NilExpression } from './exp/nil-expression.js';
import { NumberExpression } from './exp/number-expression.js';
import { MethodFunctionCall } from './exp/prefixexp/function-call/method.js';
import { NormalFunctionCall } from './exp/prefixexp/function-call/normal.js';
import { ParenthesisedPrefixExpression } from './exp/prefixexp/parenthesised.js';
import { IndexedVariable } from './exp/prefixexp/variable/indexed-variable.js';
import { MemberVariable } from './exp/prefixexp/variable/member-variable.js';
import { NameVariable } from './exp/prefixexp/variable/name-variable.js';
import { StringExpression } from './exp/string-expression.js';
import { TableConstructorExpression } from './exp/table-constructor-expression.js';
import { TrueExpression } from './exp/true-expression.js';
import { UnaryOperationExpression } from './exp/unary-expression.js';
import { VarargExpression } from './exp/vararg-expression.js';
import { ExpressionList } from './explist.js';
import { FieldArrayKey } from './fields/array-key.js';
import { FieldExpressionKey } from './fields/expression-key.js';
import { FieldNameKey } from './fields/name-key.js';
import { FuncBody } from './funcbody.js';
import { FuncName } from './funcname.js';
import { Name } from './name.js';
import { NameList } from './namelist.js';
import { ParameterList } from './parlist.js';
import { AssignmentStatement } from './stat/assignment.js';
import { BreakStatement } from './stat/break.js';
import { DoStatement } from './stat/do.js';
import { ForInStatement } from './stat/for-in.js';
import { ForStatement } from './stat/for.js';
import { FunctionCallStatement } from './stat/function-call.js';
import { FunctionStatement } from './stat/function.js';
import { IfStatement } from './stat/if.js';
import { ElseIfClause } from './stat/if/elseif.js';
import { LocalFunctionStatement } from './stat/local-function.js';
import { LocalVariablesStatement } from './stat/local-variables.js';
import { RepeatStatement } from './stat/repeat.js';
import { ReturnStatement } from './stat/return-explist.js';
import { WhileStatement } from './stat/while.js';
import { VariableList } from './varlist.js';

export type Arguments = ExpressionListArguments | StringArguments | TableConstructorArguments;

export type Field = FieldExpressionKey | FieldNameKey | FieldArrayKey;

export type FunctionCallPrefixExpression = MethodFunctionCall | NormalFunctionCall;
export type VariablePrefixExpression = IndexedVariable | MemberVariable | NameVariable;

export type PrefixExpression = FunctionCallPrefixExpression | ParenthesisedPrefixExpression | VariablePrefixExpression;
export type Expression =
  | NilExpression
  | FalseExpression
  | TrueExpression
  | NumberExpression
  | StringExpression
  | VarargExpression
  | FunctionExpression
  | PrefixExpression
  | TableConstructorExpression
  | BinaryOperationExpression
  | UnaryOperationExpression;

export type Statement =
  | AssignmentStatement
  | BreakStatement
  | DoStatement
  | ForStatement
  | ForInStatement
  | FunctionCallStatement
  | FunctionStatement
  | IfStatement
  | LocalFunctionStatement
  | LocalVariablesStatement
  | RepeatStatement
  | ReturnStatement
  | WhileStatement;

export type Node =
  | Arguments
  | Chunk
  | Expression
  | ExpressionList
  | Field
  | FuncBody
  | FuncName
  | Name
  | NameList
  | ParameterList
  | Statement
  | VariableList
  | ElseIfClause;
