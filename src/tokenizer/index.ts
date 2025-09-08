import { CharCodes } from './char-codes.js';

export interface TokenizerState {
  get pos(): number;
  get lineNumber(): number;
  get columnNumber(): number;
}

export enum TokenType {
  Identifier = 'Identifier',
  Number = 'Number',
  String = 'String',
  Simple = 'Simple',
  Comment = 'Comment',
}

export class Token {
  constructor(
    private readonly mainString: string,
    public readonly start: number,
    public readonly end: number,
    public readonly lineNumber: number,
    public readonly columnNumber: number,
    public readonly type: TokenType,
  ) {
    this.length = end - start;
  }

  public readonly length: number;

  public get value() {
    return this.mainString.slice(this.start, this.end);
  }

  public is(value: string) {
    return value.length === this.end - this.start && this.mainString.startsWith(value, this.start);
  }

  public charCodeAt(index: number) {
    return this.mainString.charCodeAt(this.start + index);
  }

  public slice(start = 0, end = this.length) {
    if (end < 0) {
      end = this.length + end;
    }

    return this.mainString.slice(this.start + start, this.start + end);
  }
}

export class Tokenizer implements TokenizerState {
  constructor(
    public readonly input: string,
    public readonly tabSize = 2,
    public skipComments = true,
  ) {
    this.computeNextToken();
  }

  public lookahead: Token | null = null;

  protected skipWhile(condition: (char: number) => boolean) {
    const start = this.pos;
    let end = this.pos;
    while (end < this.input.length) {
      if (!condition(this.input.charCodeAt(end))) {
        break;
      }
      end++;
    }

    this.nextChar(end - start);
  }

  protected computeNextToken() {
    this.lookahead = null;
    this.eof = true;
    let tokenType = TokenType.Simple;
    const start = {
      pos: this.pos,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      token: null,
    };

    do {
      tokenType = TokenType.Simple;
      this.skipWhile(Tokenizer.isWhitespace);

      // Check EOF
      if (this.pos >= this.input.length) {
        return;
      }

      // We have a token next, determine what it is
      // Capture the state of the tokenizer
      start.pos = this.pos;
      start.lineNumber = this.lineNumber;
      start.columnNumber = this.columnNumber;

      const nextChar = this.nextChar();

      // This should ONLY increase the nextCharPos by the end of the switch statement
      switch (nextChar) {
        // >= <= == ~= > < =
        case CharCodes.EQUALS_SIGN:
        case CharCodes.LESS_THAN_SIGN:
        case CharCodes.GREATER_THAN_SIGN:
        case CharCodes.TILDE:
          // check for additional =
          if (this.peekChar() === CharCodes.EQUALS_SIGN) {
            this.nextChar();
          }
          break;
        // . .. ...
        case CharCodes.FULL_STOP:
          // check for additional .
          if (this.peekChar() === CharCodes.FULL_STOP) {
            this.nextChar();
            // check for additional .
            if (this.peekChar() === CharCodes.FULL_STOP) {
              this.nextChar();
            }
            // check for numbers
          } else if (Tokenizer.isValidDecimalChar(this.peekChar())) {
            this.processNumber(nextChar);
            tokenType = TokenType.Number;
          }
          break;

        // comments -- --longstring
        case CharCodes.HYPHEN_MINUS:
          // check for additional -
          if (this.peekChar() === CharCodes.HYPHEN_MINUS) {
            this.nextChar();
            tokenType = TokenType.Comment;
            // check for long string
            if (this.peekChar() !== CharCodes.LEFT_SQUARE_BRACKET || !this.processLongString(1)) {
              // skip until newline for single line comments
              this.skipWhile((c) => !Tokenizer.isNewLine(c));
            }
          }
          break;

        // default for 1 char tokens
        default:
          // Check for shebang
          if (start.pos === 0 && start.lineNumber === 1 && nextChar === CharCodes.NUMBER_SIGN) {
            // Shebang line, skip to end of line
            this.skipWhile((c) => !Tokenizer.isNewLine(c));
            tokenType = TokenType.Comment;
          }
          // check if it's part of an identifier or keyword
          else if (Tokenizer.isIdentifierStart(nextChar)) {
            tokenType = TokenType.Identifier;
            this.skipWhile(Tokenizer.isIdentifierPart);
          } else if (nextChar >= CharCodes.DIGIT_0 && nextChar <= CharCodes.DIGIT_9) {
            this.processNumber(nextChar);
            tokenType = TokenType.Number;
          } else if (nextChar == CharCodes.QUOTATION_MARK || nextChar == CharCodes.APOSTROPHE) {
            this.processSimpleString(nextChar);
            tokenType = TokenType.String;
          } else if (nextChar == CharCodes.LEFT_SQUARE_BRACKET && this.processLongString()) {
            tokenType = TokenType.String;
          }

          break;
      }
    } while (this.skipComments && tokenType === TokenType.Comment);

    this.eof = false;
    this.lookahead = new Token(this.input, start.pos, this.pos, start.lineNumber, start.columnNumber, tokenType);
  }

  // Points at the next byte to be read
  public pos = 0;
  public lineNumber = 1;
  public columnNumber = 1;

  protected static isValidHexChar(this: void, char: number) {
    return (
      (char >= CharCodes.DIGIT_0 && char <= CharCodes.DIGIT_9) ||
      (char >= CharCodes.LATIN_SMALL_A && char <= CharCodes.LATIN_SMALL_F) ||
      (char >= CharCodes.LATIN_CAPITAL_A && char <= CharCodes.LATIN_CAPITAL_F)
    );
  }

  protected static isValidBinaryChar(this: void, char: number) {
    return char === CharCodes.DIGIT_0 || char === CharCodes.DIGIT_1;
  }

  protected static isValidDecimalChar(this: void, char: number) {
    return char >= CharCodes.DIGIT_0 && char <= CharCodes.DIGIT_9;
  }

  protected static isWhitespace(this: void, char: number) {
    return (
      Tokenizer.isNewLine(char) ||
      char === CharCodes.SPACE ||
      char === CharCodes.TAB ||
      char === CharCodes.VERTICAL_TAB ||
      char === CharCodes.FORM_FEED
    );
  }

  protected static isNewLine(this: void, char: number) {
    return char === CharCodes.LINE_FEED || char === CharCodes.CARRIAGE_RETURN;
  }

  protected static isIdentifierStart(this: void, char: number) {
    return (
      (char >= CharCodes.LATIN_SMALL_A && char <= CharCodes.LATIN_SMALL_Z) ||
      (char >= CharCodes.LATIN_CAPITAL_A && char <= CharCodes.LATIN_CAPITAL_Z) ||
      char === CharCodes.UNDERSCORE ||
      /* LuaJIT */
      char >= 0x80
    );
  }

  protected static isIdentifierPart(this: void, char: number) {
    return Tokenizer.isIdentifierStart(char) || (char >= CharCodes.DIGIT_0 && char <= CharCodes.DIGIT_9);
  }

  public eof = false;

  /**
   * Advance the tokenizer by characters
   * @param count Number of RAW characters to advance - does not combine CRLF into a single newline
   * @returns The first character that was advanced over
   */
  protected nextChar(count = 1) {
    const pos = this.pos;
    for (let i = 0; i < count; i++) {
      const columnIncrease = this.peekChar() === CharCodes.TAB ? this.tabSize : 1;
      this.columnNumber += columnIncrease;
      const chr = this.input.charCodeAt(this.pos++);
      if (Tokenizer.isNewLine(chr)) {
        // CRLF check
        if (chr === CharCodes.CARRIAGE_RETURN && this.peekChar() === CharCodes.LINE_FEED) {
          this.pos++;
          i++;
        }
        this.lineNumber++;
        this.columnNumber = 1;
      }
    }

    return this.input.charCodeAt(pos);
  }

  protected peekChar(ahead = 0) {
    return this.input.charCodeAt(this.pos + ahead);
  }

  protected processSimpleString(quoteChar: number) {
    while (this.pos < this.input.length) {
      const nextChar = this.nextChar();
      if (nextChar === quoteChar) {
        return;
      } else if (nextChar === CharCodes.BACKSLASH) {
        this.nextChar();
      }
    }
    throw new Error(`expected '${String.fromCharCode(quoteChar)}' near <eof>`);
  }

  protected processLongString(index = 0): boolean {
    // First detect any = signs
    let equalsCount = 0;
    while (this.peekChar(index + equalsCount) === CharCodes.EQUALS_SIGN) {
      equalsCount++;
    }

    if (this.peekChar(index + equalsCount) !== CharCodes.LEFT_SQUARE_BRACKET) {
      return false;
    }

    // Consume the '='s
    for (let i = 0; i < index + equalsCount; i++) {
      this.nextChar();
    }

    // consume last '['
    this.nextChar();

    while (this.pos < this.input.length) {
      if (this.nextChar() === CharCodes.RIGHT_SQUARE_BRACKET) {
        // Check for matching number of equals signs
        let endEqualsCount = 0;
        for (endEqualsCount = 0; endEqualsCount < equalsCount && this.pos < this.input.length; endEqualsCount++) {
          if (this.peekChar() !== CharCodes.EQUALS_SIGN) {
            break;
          }
          // We can consume this either way as it will either be the end of the long string or part of the long string
          this.nextChar();
        }

        if (endEqualsCount === equalsCount && this.peekChar() === CharCodes.RIGHT_SQUARE_BRACKET) {
          // Consume the ']'
          this.nextChar();
          return true;
        }
      }
    }

    throw new Error('expected end of long string');
  }

  protected processNumber(nextChar: number) {
    // Tokenize numbers
    // Numbers can be either integers, decimals, hexadecimals (0xabcd) and can include decimals (0xabcd.ef),
    // exponents (1e10), binary (0b1010)

    let validCharChecker: (char: number) => boolean = Tokenizer.isValidDecimalChar;

    // Check if hex
    if (
      nextChar == CharCodes.DIGIT_0 &&
      (this.peekChar() === CharCodes.LATIN_SMALL_X || this.peekChar() == CharCodes.LATIN_CAPITAL_X)
    ) {
      // Skip the x
      this.nextChar();
      validCharChecker = Tokenizer.isValidHexChar;
    } else if (nextChar == CharCodes.DIGIT_0 && this.peekChar() === CharCodes.LATIN_SMALL_B) {
      // Skip the b
      this.nextChar();
      validCharChecker = Tokenizer.isValidBinaryChar;
    }

    // Check for valid characters
    this.skipWhile(validCharChecker);

    // Check for decimal
    if (this.peekChar() === CharCodes.FULL_STOP) {
      this.nextChar();
      this.skipWhile(validCharChecker);
    }

    // Normal numbers can have an exponent
    if (
      validCharChecker === Tokenizer.isValidDecimalChar &&
      (this.peekChar() === CharCodes.LATIN_SMALL_E || this.peekChar() === CharCodes.LATIN_CAPITAL_E)
    ) {
      this.nextChar();
      if (this.peekChar() === CharCodes.PLUS_SIGN || this.peekChar() === CharCodes.HYPHEN_MINUS) {
        this.nextChar();
      }
      this.skipWhile(Tokenizer.isValidDecimalChar);
    }
  }

  public getNext() {
    const next = this.lookahead;
    if (!next) {
      return null;
    }

    this.pos = next.end;
    this.computeNextToken();

    return next;
  }

  public skip() {
    this.getNext();
  }

  /**
   * Consumes a token if it matches the expected value.
   * @param expected The expected token value.
   * @returns The consumed token or null if it didn't match.
   */
  public consume(expected: string): Token | null {
    if (this.lookahead && this.lookahead.is(expected)) {
      return this.getNext();
    }
    return null;
  }

  public expect(expected: string) {
    const next = this.getNext();
    if (!next) {
      throw new Error(`expected '${expected}' near <eof>`);
    }
    if (!next.is(expected)) {
      throw new Error(`expected '${expected}' near '${next.value}' at ${next.lineNumber}:${next.columnNumber}`);
    }
  }
}
