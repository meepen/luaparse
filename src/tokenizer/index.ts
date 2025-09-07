import { TextEncoder } from 'node:util';
import { CharCodes } from './char-codes.js';

type StringBytes = {
  readonly value: string;
  readonly bytes: Uint8Array;
};

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

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class Token implements StringBytes {
  constructor(
    private input: StringBytes,
    public start: number,
    public end: number,
    public lineNumber: number,
    public columnNumber: number,
    public type: TokenType,
  ) {}

  private _bytes?: Uint8Array;
  private _value?: string;

  get value(): string {
    if (this._value === undefined) {
      this._value = textDecoder.decode(this.bytes);
    }
    return this._value;
  }

  get bytes(): Uint8Array {
    if (this._bytes === undefined) {
      this._bytes = this.input.bytes.subarray(this.start, this.end);
    }
    return this._bytes;
  }
}

export function isValidHexChar(char: number) {
  return (
    (char >= CharCodes.DIGIT_0 && char <= CharCodes.DIGIT_9) ||
    (char >= CharCodes.LATIN_SMALL_A && char <= CharCodes.LATIN_SMALL_F) ||
    (char >= CharCodes.LATIN_CAPITAL_A && char <= CharCodes.LATIN_CAPITAL_F)
  );
}

function isValidBinaryChar(char: number) {
  return char === CharCodes.DIGIT_0 || char === CharCodes.DIGIT_1;
}

export function isValidDecimalChar(char: number) {
  return char >= CharCodes.DIGIT_0 && char <= CharCodes.DIGIT_9;
}

export class Tokenizer implements TokenizerState {
  constructor(
    value: string,
    public tabSize = 2,
    public skipComments = true,
  ) {
    this.input = {
      value,
      bytes: this.textEncoder.encode(value),
    };
  }

  readonly textEncoder = textEncoder;
  readonly textDecoder = textDecoder;

  public input: StringBytes;

  // Points at the next byte to be read
  public pos = 0;
  public lineNumber = 1;
  public columnNumber = 1;

  private _lookahead?: Token;

  private isWhitespace(char: number) {
    return (
      char === CharCodes.SPACE ||
      char === CharCodes.TAB ||
      char === CharCodes.VERTICAL_TAB ||
      char === CharCodes.FORM_FEED ||
      this.isNewLine(char)
    );
  }

  private isNewLine(char: number) {
    return char === CharCodes.LINE_FEED || char === CharCodes.CARRIAGE_RETURN;
  }

  private isIdentifierStart(char: number) {
    return (
      (char >= CharCodes.LATIN_SMALL_A && char <= CharCodes.LATIN_SMALL_Z) ||
      (char >= CharCodes.LATIN_CAPITAL_A && char <= CharCodes.LATIN_CAPITAL_Z) ||
      char === CharCodes.UNDERSCORE ||
      /* LuaJIT */
      char >= 0x80
    );
  }

  private isIdentifierPart(char: number) {
    return this.isIdentifierStart(char) || (char >= CharCodes.DIGIT_0 && char <= CharCodes.DIGIT_9);
  }

  get eof() {
    return this.pos >= this.input.bytes.length;
  }

  private nextChar(columnIncrease = 1) {
    this.columnNumber += columnIncrease;
    return this.input.bytes[this.pos++];
  }
  private peekChar(ahead = 0) {
    return this.input.bytes[this.pos + ahead];
  }

  private processSimpleString(quoteChar: number) {
    while (!this.eof) {
      const nextChar = this.nextChar();
      if (nextChar === quoteChar) {
        return;
      } else if (nextChar === CharCodes.BACKSLASH) {
        this.nextChar();
      }
    }
    throw new Error(`expected '${String.fromCharCode(quoteChar)}' near <eof>`);
  }

  private processLongString(index = 0): boolean {
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

    while (!this.eof) {
      if (this.nextChar() === CharCodes.RIGHT_SQUARE_BRACKET) {
        // Check for matching number of equals signs
        let endEqualsCount = 0;
        for (endEqualsCount = 0; endEqualsCount < equalsCount && !this.eof; endEqualsCount++) {
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

  private processNumber(nextChar: number) {
    // Tokenize numbers
    // Numbers can be either integers, decimals, hexadecimals (0xabcd) and can include decimals (0xabcd.ef),
    // exponents (1e10), binary (0b1010)

    let validCharChecker: (char: number) => boolean = isValidDecimalChar;

    // Check if hex
    if (
      nextChar == CharCodes.DIGIT_0 &&
      (this.peekChar() === CharCodes.LATIN_SMALL_X || this.peekChar() == CharCodes.LATIN_CAPITAL_X)
    ) {
      // Skip the x
      this.nextChar();
      validCharChecker = isValidHexChar;
    } else if (nextChar == CharCodes.DIGIT_0 && this.peekChar() === CharCodes.LATIN_SMALL_B) {
      // Skip the b
      this.nextChar();
      validCharChecker = isValidBinaryChar;
    }

    // Check for valid characters
    while (validCharChecker(this.peekChar())) {
      this.nextChar();
    }

    // Check for decimal
    if (this.peekChar() === CharCodes.FULL_STOP) {
      this.nextChar();
      while (validCharChecker(this.peekChar())) {
        this.nextChar();
      }
    }

    // Normal numbers can have an exponent
    if (
      validCharChecker === isValidDecimalChar &&
      (this.peekChar() == CharCodes.LATIN_SMALL_E || this.peekChar() == CharCodes.LATIN_CAPITAL_E)
    ) {
      this.nextChar();
      if (this.peekChar() === CharCodes.PLUS_SIGN || this.peekChar() === CharCodes.HYPHEN_MINUS) {
        this.nextChar();
      }
      while (isValidDecimalChar(this.peekChar())) {
        this.nextChar();
      }
    }
  }

  get lookahead(): Token | undefined {
    if (this._lookahead !== undefined) {
      return this._lookahead;
    }
    while (this.pos < this.input.bytes.length) {
      if (!this.isWhitespace(this.peekChar())) {
        break;
      }
      const nextChar = this.nextChar(this.peekChar() === CharCodes.TAB ? this.tabSize : 1);
      if (this.isNewLine(nextChar)) {
        // CRLF check
        if (nextChar === CharCodes.CARRIAGE_RETURN && this.peekChar() === CharCodes.LINE_FEED) {
          this.nextChar();
        }
        this.lineNumber++;
        this.columnNumber = 1;
      }
    }

    // Check EOF
    if (this.pos >= this.input.bytes.length) {
      return undefined;
    }

    // We have a token next, determine what it is
    // Capture the state of the tokenizer
    const start = {
      pos: this.pos,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      token: null,
    };

    const nextChar = this.nextChar();
    let tokenType = TokenType.Simple;

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
            while (!this.eof && !this.isNewLine(this.peekChar())) {
              this.nextChar();
            }
          }
        }
        break;

      // default for 1 char tokens
      default:
        // Check for shebang
        if (start.pos === 0 && start.lineNumber === 1 && nextChar === CharCodes.NUMBER_SIGN) {
          // Shebang line, skip to end of line
          while (!this.eof && !this.isNewLine(this.peekChar())) {
            this.nextChar();
          }
          tokenType = TokenType.Comment;
        }
        // check if it's part of an identifier or keyword
        else if (this.isIdentifierStart(nextChar)) {
          tokenType = TokenType.Identifier;
          while (this.isIdentifierPart(this.peekChar())) {
            this.nextChar();
          }
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

    if (this.skipComments && tokenType === TokenType.Comment) {
      // Skip the comment
      return this.lookahead;
    }

    return (this._lookahead = new Token(
      this.input,
      start.pos,
      this.pos,
      start.lineNumber,
      start.columnNumber,
      tokenType,
    ));
  }

  private getNext() {
    const next = this.lookahead;
    if (!next) {
      return null;
    }

    this.pos = next.end;
    delete this._lookahead;

    return next;
  }

  get next(): Token | null {
    return this.getNext();
  }

  skip() {
    this.getNext();
  }

  consume(expected: string) {
    if (this.lookahead?.value === expected) {
      return this.next;
    }
  }

  expect(expected: string) {
    const next = this.next;
    if (!next) {
      throw new Error(`expected '${expected}' near <eof>`);
    }
    if (next.value !== expected) {
      throw new Error(`expected '${expected}' near '${next.value}' at ${next.lineNumber}:${next.columnNumber}`);
    }
  }
}
