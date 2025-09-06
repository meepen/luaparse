import { ExpressionType } from '../../nodes/exp.js';
import { PrefixExpressionType } from '../../nodes/exp/prefix-expression.js';
import { VariablePrefixExpressionType } from '../../nodes/exp/prefixexp/variable.js';
import { FuncName } from '../../nodes/funcname.js';
import {
  Arguments,
  BinaryOperationExpression,
  BreakStatement,
  Chunk,
  DoStatement,
  ElseIfClause,
  Expression,
  ExpressionList,
  ExpressionListArguments,
  FalseExpression,
  Field,
  FieldArrayKey,
  FieldExpressionKey,
  FieldNameKey,
  ForInStatement,
  ForStatement,
  FuncBody,
  FunctionExpression,
  FunctionStatement,
  IfStatement,
  IndexedVariable,
  LocalFunctionStatement,
  LocalVariablesStatement,
  MemberVariable,
  MethodFunctionCall,
  Name,
  NameVariable,
  NilExpression,
  NormalFunctionCall,
  NumberExpression,
  ParameterList,
  ParenthesisedPrefixExpression,
  PrefixExpression,
  RepeatStatement,
  ReturnStatement,
  Statement,
  StringArguments,
  StringExpression,
  TableConstructorArguments,
  TableConstructorExpression,
  TrueExpression,
  UnaryOperationExpression,
  VarargExpression,
  WhileStatement,
} from '../../nodes/index.js';
import { NameList } from '../../nodes/namelist.js';
import { AssignmentStatement } from '../../nodes/stat/assignment.js';
import { FunctionCallStatement } from '../../nodes/stat/function-call.js';
import { VariableList } from '../../nodes/varlist.js';
import { CharCodes } from '../../tokenizer/char-codes.js';
import { TokenType, Tokenizer, isValidHexChar } from '../../tokenizer/index.js';
import { AstParser, LuaVersion } from '../index.js';

function createHashMap(...values: string[]): { [key: string]: true } {
  const map = Object.create(null);
  for (const value of values) {
    map[value] = true;
  }
  return map;
}

function createPrecedenceMap(...values: string[][]): { [key: string]: number } {
  const map = Object.create(null);
  for (const [precedence, operators] of Object.entries(values.entries)) {
    for (const operator of operators) {
      map[operator] = precedence;
    }
  }
  return map;
}

function createStringEscapeMap(...values: [CharCodes, CharCodes[]][]): (CharCodes[] | null)[] {
  const map = new Array<CharCodes[] | null>(256).fill(null);
  for (const [from, to] of values) {
    map[from] = to;
  }
  return map;
}

export class LuaParserError extends Error {
  constructor(message: string, tokenizer: Tokenizer) {
    super(`${message} near ${LuaParserError.lookAheadText(tokenizer)}`);
  }

  static lookAheadText(tokenizer: Tokenizer) {
    const token = tokenizer.lookahead;
    if (token) {
      return `'${token.value}' at ${token.lineNumber}:${token.columnNumber}`;
    }
    return 'EOF';
  }
}

export class PUCRio_v5_1_Parser extends Tokenizer implements AstParser {
  constructor(public source: string) {
    super(source, 4);
  }

  static _keywords = createHashMap(
    'and',
    'break',
    'do',
    'else',
    'elseif',
    'end',
    'false',
    'for',
    'function',
    'if',
    'in',
    'local',
    'nil',
    'not',
    'or',
    'repeat',
    'return',
    'then',
    'true',
    'until',
    'while',
  );

  static _binaryOperators = createHashMap(
    '+',
    '-',
    '*',
    '/',
    '^',
    '%',
    '..',
    '<',
    '<=',
    '>',
    '>=',
    '==',
    '~=',
    'and',
    'or',
  );

  static _binaryOperatorPrecedence = createPrecedenceMap(
    ['or'],
    ['and'],
    ['<', '>', '<=', '>=', '~=', '=='],
    ['..'],
    ['+', '-'],
    ['*', '/', '%'],
    ['^'],
  );

  // Digits are handled seperately
  static _escapeMap = createStringEscapeMap(
    [CharCodes.LINE_FEED, [CharCodes.LINE_FEED]],
    [CharCodes.CARRIAGE_RETURN, [CharCodes.CARRIAGE_RETURN]],
    [CharCodes.APOSTROPHE, [CharCodes.APOSTROPHE]],
    [CharCodes.QUOTATION_MARK, [CharCodes.QUOTATION_MARK]],
    [CharCodes.BACKSLASH, [CharCodes.BACKSLASH]],
    [CharCodes.LATIN_SMALL_A, [CharCodes.BELL]],
    [CharCodes.LATIN_SMALL_B, [CharCodes.BACKSPACE]],
    [CharCodes.LATIN_SMALL_F, [CharCodes.FORM_FEED]],
    [CharCodes.LATIN_SMALL_N, [CharCodes.LINE_FEED]],
    [CharCodes.LATIN_SMALL_R, [CharCodes.CARRIAGE_RETURN]],
    [CharCodes.LATIN_SMALL_T, [CharCodes.TAB]],
    [CharCodes.LATIN_SMALL_V, [CharCodes.VERTICAL_TAB]],
    [CharCodes.LATIN_SMALL_Z, []],
  );

  readonly keywords = PUCRio_v5_1_Parser._keywords;
  readonly binaryOperators = PUCRio_v5_1_Parser._binaryOperators;
  readonly binaryOperatorPrecedence = PUCRio_v5_1_Parser._binaryOperatorPrecedence;
  readonly escapeMap = PUCRio_v5_1_Parser._escapeMap;

  static unaryOperators = createHashMap('-', 'not', '#');

  get luaVersion() {
    return LuaVersion.PUCRio_v5_1;
  }
  async parse(): Promise<Chunk> {
    const chunk = await this.parseBlock();
    if (!this.eof) {
      throw this.parserError('unexpected token');
    }
    return chunk;
  }

  parserError(message: string) {
    return new LuaParserError(message, this);
  }

  async parseBlock(): Promise<Chunk> {
    const statements: Statement[] = [];
    while (!this.eof) {
      const statement = await this.parseStatement();
      if (!statement) {
        break;
      }

      statements.push(statement);
      this.consume(';');
      if (statement.isLastStatement) {
        break;
      }
    }
    return new Chunk(statements);
  }

  protected async parseStatement(): Promise<Statement | null> {
    const token = this.lookahead;
    if (!token) {
      return null;
    }
    switch (token.value) {
      // Simple cases where there are no ambiguities
      case 'return':
        return this.parseReturnStatement();
      case 'break':
        return new BreakStatement();
      case 'do':
        return this.parseDoStatement();
      case 'while':
        return this.parseWhileStatement();
      case 'function':
        return this.parseFunctionStatement();
      case 'local':
        return this.parseLocalAmbiguousStatement();
      case 'for':
        return this.parseForAmibiguousStatement();
      case 'if':
        return this.parseIfStatement();
      case 'repeat':
        return this.parseRepeatStatement();
      default:
        break;
    }

    // Either varlist = explist OR functioncall

    const prefixExpression = await this.parsePrefixExpression();
    if (!prefixExpression) {
      return null;
    }
    if (prefixExpression.prefixExpressionType === PrefixExpressionType.Variable) {
      const vars = [prefixExpression];
      while (this.consume(',')) {
        const prefixExpression = await this.parsePrefixExpression();
        if (!prefixExpression || prefixExpression.prefixExpressionType !== PrefixExpressionType.Variable) {
          throw this.parserError('expected variable');
        }
        vars.push(prefixExpression);
      }
      this.expect('=');
      const assignments = await this.parseExpressionList();
      return new AssignmentStatement(new VariableList(vars), assignments);
    } else if (prefixExpression.prefixExpressionType === PrefixExpressionType.FunctionCall) {
      return new FunctionCallStatement(prefixExpression);
    }
    throw this.parserError('expected statement');
  }

  async parseLocalStatement(): Promise<LocalVariablesStatement> {
    // this will already be consumed by the caller
    // this.expect('local');
    const nameList = this.parseNameList();
    if (!nameList) {
      throw this.parserError('expected name');
    }
    let expressions: ExpressionList | undefined;
    if (this.consume('=')) {
      expressions = await this.parseExpressionList();
    }
    return new LocalVariablesStatement(nameList, expressions);
  }
  async parseLocalFunctionStatement(): Promise<LocalFunctionStatement> {
    // this will already be consumed by the caller
    // this.expect('local');
    this.expect('function');
    const name = this.parseName();
    const body = await this.parseFuncBody();
    return new LocalFunctionStatement(name, body);
  }

  async parseRepeatStatement(): Promise<RepeatStatement> {
    this.expect('repeat');
    const statements = await this.parseBlock();
    this.expect('until');
    const condition = await this.parseExpression();
    if (!condition) {
      throw this.parserError('expected expression');
    }
    return new RepeatStatement(statements, condition);
  }

  async parseIfStatement(): Promise<IfStatement> {
    this.expect('if');
    const exp = await this.parseExpression();
    if (!exp) {
      throw this.parserError('expected expression');
    }
    this.expect('then');
    const block = await this.parseBlock();
    const clauses: ElseIfClause[] = [];
    while (this.consume('elseif')) {
      const exp = await this.parseExpression();
      if (!exp) {
        throw this.parserError('expected expression');
      }
      this.expect('then');
      const block = await this.parseBlock();
      clauses.push(new ElseIfClause(exp, block));
    }

    let elseBlock: Chunk | undefined;
    if (this.consume('else')) {
      elseBlock = await this.parseBlock();
    }

    this.expect('end');

    return new IfStatement(exp, block, clauses, elseBlock);
  }

  async parseForAmibiguousStatement(): Promise<ForStatement | ForInStatement> {
    this.expect('for');
    const nameList = this.parseNameList();
    if (!nameList) {
      throw this.parserError('expected name');
    }

    if (nameList.names.length === 1 && this.consume('=')) {
      // for statement
      const start = await this.parseExpression();
      if (!start) {
        throw this.parserError('expected expression');
      }
      this.expect(',');
      const end = await this.parseExpression();
      if (!end) {
        throw this.parserError('expected expression');
      }
      let step: Expression | null = null;
      if (this.consume(',')) {
        step = await this.parseExpression();
        if (!step) {
          throw this.parserError('expected expression');
        }
      }
      this.expect('do');
      const statements = await this.parseBlock();
      this.expect('end');

      return new ForStatement(nameList.names[0], statements, start, end, ...(step ? [step] : []));
    } else {
      // for in statement
      this.expect('in');
      const expressions = await this.parseExpressionList();
      this.expect('do');
      const statements = await this.parseBlock();
      this.expect('end');

      return new ForInStatement(nameList, expressions, statements);
    }
  }

  async parseLocalAmbiguousStatement(): Promise<LocalVariablesStatement | LocalFunctionStatement> {
    this.expect('local');
    const token = this.lookahead;
    if (!token) {
      throw this.parserError("expected name or 'function'");
    }
    if (token.value === 'function') {
      return this.parseLocalFunctionStatement();
    } else {
      return this.parseLocalStatement();
    }
  }

  parseFuncName(): FuncName {
    const name = this.parseName();
    const indexers: Name[] = [];
    while (this.consume('.')) {
      indexers.push(this.parseName());
    }
    let methodName: Name | undefined;
    if (this.consume(':')) {
      methodName = this.parseName();
    }
    return new FuncName(name, indexers, methodName);
  }

  async parseFunctionStatement(): Promise<FunctionStatement> {
    this.expect('function');
    const name = this.parseFuncName();
    const body = await this.parseFuncBody();
    return new FunctionStatement(name, body);
  }

  async parseReturnStatement(): Promise<ReturnStatement> {
    this.expect('return');
    const expressions = await this.parseExpressionList();
    return new ReturnStatement(expressions);
  }

  async parseDoStatement(): Promise<DoStatement> {
    this.expect('do');
    const statements = await this.parseBlock();
    this.expect('end');
    return new DoStatement(statements);
  }

  async parseWhileStatement(): Promise<WhileStatement> {
    this.expect('while');
    const condition = await this.parseExpression();
    if (!condition) {
      throw this.parserError('expected expression');
    }
    this.expect('do');
    const statements = await this.parseBlock();
    this.expect('end');
    return new WhileStatement(condition, statements);
  }

  async parseExpressionList(): Promise<ExpressionList> {
    const expressions: Expression[] = [];
    const expression = await this.parseExpression();
    if (expression) {
      expressions.push(expression);
      while (this.consume(',')) {
        const expression = await this.parseExpression();
        if (!expression) {
          throw this.parserError('expected expression');
        }
        expressions.push(expression);
      }
    }
    return new ExpressionList(expressions);
  }

  async parseExpression(withBinaryExpressions = true): Promise<Expression | null> {
    if (!this.lookahead) {
      return null;
    }

    let expression: Expression | null = null;
    // unary
    if (PUCRio_v5_1_Parser.unaryOperators[this.lookahead.value]) {
      const unaryOperator = this.next!;
      const right = await this.parseExpression();
      if (!right) {
        throw this.parserError('expected expression');
      }
      expression = new UnaryOperationExpression(unaryOperator.value, right);
    }

    if (!expression) {
      switch (this.lookahead.value) {
        case 'nil':
          this.skip();
          expression = new NilExpression();
          break;
        case 'false':
          this.skip();
          expression = new FalseExpression();
          break;
        case 'true':
          this.skip();
          expression = new TrueExpression();
          break;
        case '...':
          this.skip();
          expression = new VarargExpression();
          break;
        case '{':
          expression = await this.parseTableConstructorExpression();
          break;
        case 'function':
          expression = await this.parseFunctionExpression();
          break;
        default:
          break;
      }
    }

    if (!expression) {
      switch (this.lookahead.type) {
        case TokenType.Number:
          expression = this.parseNumberExpression();
          break;
        case TokenType.String:
          expression = this.parseStringExpression();
          break;
        case TokenType.Identifier:
          if (this.isIdentifier()) {
            expression = await this.parsePrefixExpression();
          }
          break;
        default:
          break;
      }
    }

    if (!expression && this.lookahead?.value === '(') {
      expression = await this.parsePrefixExpression();
    }

    if (!expression) {
      return null;
    }

    // binary
    const binaryParts: { operator: string; right: Expression }[] = [];
    while (withBinaryExpressions && expression && this.binaryOperators[this.lookahead?.value]) {
      const binaryOperator = this.next!;
      const right = await this.parseExpression(false);
      if (!right) {
        throw this.parserError('expected expression');
      }
      binaryParts.push({ operator: binaryOperator.value, right });
    }

    // build binary expression tree
    if (binaryParts.length > 0) {
      while (binaryParts.length !== 0) {
        // find the highest precedence operator
        const next = binaryParts
          .map((part, index) => ({ ...part, index, precedence: this.binaryOperatorPrecedence[part.operator] }))
          .reduceRight((a, b) => {
            return a.precedence > b.precedence ? a : b;
          });
        // remove it from the list
        binaryParts.splice(next.index, 1);
        // create the binary expression
        const leftIndex = next.index - 1;
        const left: Expression = leftIndex === -1 ? expression! : binaryParts[leftIndex].right;

        const newExpr: BinaryOperationExpression = new BinaryOperationExpression(left, next.operator, next.right);

        if (leftIndex === -1) {
          expression = newExpr;
        } else {
          binaryParts[leftIndex].right = newExpr;
        }
      }
    }

    return expression;
  }

  async parsePrefixExpression(): Promise<PrefixExpression | null> {
    let expression: PrefixExpression;
    if (this.consume('(')) {
      const parentheses = await this.parseExpression();
      if (!parentheses) {
        throw this.parserError('expected expression');
      }
      this.expect(')');
      expression = new ParenthesisedPrefixExpression(parentheses);
    } else if (this.isIdentifier()) {
      expression = new NameVariable(this.parseName());
    } else {
      return null;
    }

    let lookahead: string | undefined;
    while (
      ((lookahead = this.lookahead?.value),
      this.consume('[') ||
        this.consume('.') ||
        this.consume(':') ||
        lookahead === '(' ||
        lookahead === '{' ||
        this.lookahead?.type === TokenType.String)
    ) {
      switch (lookahead) {
        case '[': {
          const index = await this.parseExpression();
          if (!index) {
            throw this.parserError('expected expression');
          }
          this.expect(']');
          expression = new IndexedVariable(expression, index!);
          break;
        }

        case '.':
          expression = new MemberVariable(expression, this.parseName());
          break;

        case ':':
          expression = new MethodFunctionCall(expression, this.parseName(), await this.parseArguments());
          break;

        case '(':
        case '{':
          expression = new NormalFunctionCall(expression, await this.parseArguments());
          break;

        default:
          if (this.lookahead?.type === TokenType.String) {
            expression = new NormalFunctionCall(expression, await this.parseArguments());
            break;
          }
          throw this.parserError("expected '[', '.', '(' or ':'");
      }
    }

    return expression;
  }

  async parseArguments(): Promise<Arguments> {
    if (this.lookahead?.type === TokenType.String) {
      return new StringArguments(this.parseStringExpression());
    }
    if (this.lookahead?.value === '{') {
      return new TableConstructorArguments(await this.parseTableConstructorExpression());
    }
    this.expect('(');
    const expressions = await this.parseExpressionList();
    this.expect(')');
    return new ExpressionListArguments(expressions);
  }

  isIdentifier(): boolean {
    // : this.lookahead is Token & { type: TokenType.Identifier }
    return this.lookahead?.type === TokenType.Identifier && !this.keywords[this.lookahead.value];
  }

  parseName(): Name {
    if (this.lookahead?.type !== TokenType.Identifier) {
      throw this.parserError('expected name');
    }
    const next = this.next!;

    if (this.keywords[next.value]) {
      throw this.parserError(`unexpected keyword '${next.value}'`);
    }

    return new Name(next.value);
  }

  parseNameList(): NameList | null {
    if (!this.isIdentifier()) {
      return null;
    }
    const names: Name[] = [];
    names.push(this.parseName());
    while (this.consume(',')) {
      names.push(this.parseName());
    }
    return new NameList(names);
  }

  isParameter() {
    return this.isIdentifier() || this.lookahead?.value === '...';
  }

  parseParameterList(): ParameterList {
    if (!this.isParameter()) {
      return new ParameterList(new NameList([]), false);
    }
    // TODO: we should really use parseNameList but i'm not sure how we can since we need to take ... as well
    const names: Name[] = [];
    let hasVararg = false;
    while (this.isParameter()) {
      if (this.consume('...')) {
        hasVararg = true;
        break;
      }
      names.push(this.parseName());
      if (!this.consume(',')) {
        break;
      }
    }

    return new ParameterList(new NameList(names), hasVararg);
  }

  async parseFuncBody(): Promise<FuncBody> {
    this.expect('(');
    const parameters = this.parseParameterList();
    this.expect(')');
    const body = await this.parseBlock();
    this.expect('end');
    return new FuncBody(parameters, body);
  }

  async parseFunctionExpression(): Promise<Expression> {
    this.expect('function');
    const body = await this.parseFuncBody();
    return new FunctionExpression(body);
  }

  generateDigits(radix: number): { [key: number]: number } {
    const digits: { [key: number]: number } = {};
    for (let i = 0; i < Math.min(10, radix); i++) {
      digits[CharCodes.DIGIT_0 + i] = i;
    }
    for (let i = 10; i < Math.min(36, radix); i++) {
      digits[CharCodes.LATIN_CAPITAL_A + i - 10] = i;
      digits[CharCodes.LATIN_SMALL_A + i - 10] = i;
    }
    for (let i = 36; i < radix; i++) {
      throw this.parserError('radix too large');
    }
    return digits;
  }

  calculateNumber(value: Uint8Array, radix: number): number {
    const digits = this.generateDigits(radix);
    const startIndex = radix === 16 ? 2 : 0;
    let retn = 0;
    let decimalIndex = value.length - startIndex;
    let exponentIndex = value.length - startIndex;
    // find decimal point
    for (let i = 0; i < value.length - startIndex; i++) {
      const raw = value[i + startIndex];
      if (raw === CharCodes.FULL_STOP) {
        decimalIndex = i;
      } else if (
        (raw === CharCodes.LATIN_SMALL_E || raw === CharCodes.LATIN_CAPITAL_E) &&
        !digits[CharCodes.LATIN_CAPITAL_E]
      ) {
        if (decimalIndex > i) {
          decimalIndex = i;
        }
        exponentIndex = i;
      }
    }

    let exponent = 0;
    // calculate integer part
    for (let i = decimalIndex - 1; i >= 0; i--) {
      const raw = value[i + startIndex];
      const digit = digits[raw];
      if (digit === undefined) {
        throw this.parserError('malformed number');
      }
      retn += digit * radix ** exponent++;
    }

    exponent = -1;
    // calculate decimal part
    for (let i = decimalIndex + 1; i < exponentIndex; i++) {
      const raw = value[i + startIndex];
      const digit = digits[raw];
      if (!digit) {
        throw this.parserError('malformed number');
      }
      retn += digit * radix ** exponent--;
    }

    // calculate exponent part
    if (exponentIndex === value.length - startIndex - 1) {
      throw this.parserError('malformed number');
    }

    if (exponentIndex !== value.length - startIndex) {
      let exponentSign = 1;
      if (value[exponentIndex + startIndex] === CharCodes.HYPHEN_MINUS) {
        exponentSign = -1;
        exponentIndex++;
      }

      let exponentValue = 0;
      exponent = 0;
      // exponents can only be integers in base 10
      const exponentDigits = this.generateDigits(10);
      for (let i = value.length - 1; i > exponentIndex + startIndex; i--) {
        const raw = value[i];
        const digit = exponentDigits[raw];
        if (!digit) {
          throw this.parserError('malformed number');
        }
        exponentValue += digit * 10 ** exponent++;
      }

      retn *= 10 ** (exponentValue * exponentSign);
    }

    return retn;
  }

  hexToNumber(hex: CharCodes): number {
    if (hex >= CharCodes.DIGIT_0 && hex <= CharCodes.DIGIT_9) {
      return hex - CharCodes.DIGIT_0;
    } else if (hex >= CharCodes.LATIN_SMALL_A && hex <= CharCodes.LATIN_SMALL_F) {
      return hex - CharCodes.LATIN_SMALL_A + 10;
    } else if (hex >= CharCodes.LATIN_CAPITAL_A && hex <= CharCodes.LATIN_CAPITAL_F) {
      return hex - CharCodes.LATIN_CAPITAL_A + 10;
    } else {
      throw this.parserError('invalid hex character');
    }
  }

  parseNumberExpression(): Expression {
    const raw = this.next;
    if (!raw) {
      throw this.parserError('expected number');
    }

    let value: number | undefined;

    switch (raw.bytes[1]) {
      case CharCodes.LATIN_CAPITAL_X:
      case CharCodes.LATIN_SMALL_X:
        value = this.calculateNumber(raw.bytes, 16);
        break;
      default:
        value = this.calculateNumber(raw.bytes, 10);
        break;
    }

    if (value === undefined) {
      throw this.parserError('expected number');
    }

    return new NumberExpression(raw.value, value);
  }

  parseStringExpression(): StringExpression {
    const raw = this.next;
    if (!raw || raw.type !== TokenType.String) {
      throw this.parserError('expected string');
    }
    const bytes = raw.bytes;
    const str: CharCodes[] = [];
    switch (bytes[0]) {
      case CharCodes.APOSTROPHE:
      case CharCodes.QUOTATION_MARK:
        for (let i = 1; i < bytes.length - 1; i++) {
          const byte = bytes[i];
          if (byte === CharCodes.BACKSLASH) {
            const escape = bytes[i + 1];
            if (escape && (escape === CharCodes.LATIN_CAPITAL_X || escape === CharCodes.LATIN_SMALL_X)) {
              // hex
              const hex0 = bytes[i + 2];
              const hex1 = bytes[i + 3];
              if (!isValidHexChar(hex0) || !isValidHexChar(hex1)) {
                throw this.parserError('invalid escape sequence');
              }

              str.push(this.hexToNumber(hex0) * 16 + this.hexToNumber(hex1));
              i += 3;
            } else if (escape && escape >= CharCodes.DIGIT_0 && escape <= CharCodes.DIGIT_9) {
              let decimal0 = bytes[i + 1];
              let decimal1 = bytes[i + 2] || 0;
              let decimal2 = bytes[i + 3] || 0;
              if (!decimal0) {
                throw this.parserError('invalid escape sequence');
              }

              decimal0 -= CharCodes.DIGIT_0;
              decimal1 -= CharCodes.DIGIT_0;
              decimal2 -= CharCodes.DIGIT_0;

              if (decimal1 < 10 && decimal1 >= 0) {
                if (decimal2 < 10 && decimal2 >= 0) {
                  const escaped = decimal0 * 100 + decimal1 * 10 + decimal2;
                  if (escaped > 255) {
                    throw this.parserError('invalid escape sequence');
                  }
                  str.push(escaped);
                  i += 3;
                } else {
                  str.push(decimal0 * 10 + decimal1);
                  i += 2;
                }
              } else {
                str.push(decimal0);
                i++;
              }
            } else {
              const newValue = this.escapeMap[bytes[i + 1]];
              if (!newValue) {
                throw this.parserError('invalid escape sequence');
              }
              str.push(...newValue);
              i++;
            }
          } else {
            str.push(byte);
          }
        }
        break;
      case CharCodes.LEFT_SQUARE_BRACKET:
        for (let i = 1; i < bytes.length / 2 + 1; i++) {
          if (bytes[i] === CharCodes.EQUALS_SIGN) {
            continue;
          } else if (bytes[i] === CharCodes.LEFT_SQUARE_BRACKET) {
            str.push(...bytes.slice(i + 1, bytes.length - i - 1));
            break;
          } else {
            throw this.parserError('invalid long string delimiter');
          }
        }
        break;
      default:
        throw this.parserError('expected string');
    }

    const value = this.textDecoder.decode(new Uint8Array(str));
    return new StringExpression(raw.value, value);
  }

  async parseField(): Promise<Field | null> {
    if (this.consume('[')) {
      const key = await this.parseExpression();
      if (!key) {
        throw this.parserError('expected expression');
      }
      this.expect(']');
      this.expect('=');
      const value = await this.parseExpression();
      if (!value) {
        throw this.parserError('expected expression');
      }
      return new FieldExpressionKey(key, value);
    }

    const value = await this.parseExpression();
    if (!value) {
      return null;
    }
    // check if this is an array part or a record part
    if (
      value.expressionType === ExpressionType.PrefixExpression &&
      value.prefixExpressionType === PrefixExpressionType.Variable &&
      value.variablePrefixExpressionType === VariablePrefixExpressionType.Name &&
      this.consume('=')
    ) {
      const right = await this.parseExpression();
      if (!right) {
        throw this.parserError('expected expression');
      }
      return new FieldNameKey(value.name, right);
    } else {
      return new FieldArrayKey(value);
    }
  }

  async parseTableConstructorExpression(): Promise<TableConstructorExpression> {
    this.expect('{');
    const fields: Field[] = [];
    while (!this.consume('}')) {
      if (this.eof) {
        throw this.parserError("expected '}'");
      }

      const field = await this.parseField();
      if (!field) {
        throw this.parserError("expected '}'");
      }

      fields.push(field);
      if (!this.consume(',') && !this.consume(';')) {
        break;
      }
    }

    return new TableConstructorExpression(fields);
  }
}
