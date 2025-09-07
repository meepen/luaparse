import { PUCRio_v5_1_Parser } from './puc-rio-5-1.js';
import assert from 'node:assert';
import { StatementType } from '../../nodes/stat.js';
import { NodeType } from '../../node.js';
import { ExpressionType } from '../../nodes/exp.js';
import { FieldType } from '../../nodes/field.js';
import { PrefixExpressionType } from '../../nodes/exp/prefix-expression.js';
import { VariablePrefixExpressionType } from '../../nodes/exp/prefixexp/variable.js';
import { ArgumentsType } from '../../nodes/args.js';
import { FunctionCallPrefixExpressionType } from '../../nodes/exp/prefixexp/function-call.js';

function shouldContain<Type>(_actual: unknown, _expected: Type, _dataName = 'data'): _actual is Type {
  const list: [unknown, unknown, string][] = [[_actual, _expected, _dataName]];

  while (list.length > 0) {
    const [actual, expected, dataName] = list.pop()!;

    if (Array.isArray(expected)) {
      assert(Array.isArray(actual), `Expected ${dataName} to be an array`);
      assert.equal(actual.length, expected.length, `Expected ${dataName} to have length ${expected.length}`);
      for (let i = 0; i < expected.length; i++) {
        list.push([actual[i], expected[i], `${dataName}[${i}]`]);
      }
    } else if (typeof expected === 'object') {
      assert(typeof actual === 'object', `Expected ${dataName} to be an object`);
      const actualObject = actual as { [key: string]: unknown };
      const expectedObject = expected as { [key: string]: unknown };
      for (const key in expectedObject) {
        assert(key in actualObject, `Expected ${dataName} to have key ${key}`);
        list.push([actualObject[key], expectedObject[key], `${dataName}.${key}`]);
      }
    } else {
      assert(typeof actual === typeof expected, `Expected ${dataName} to be type ${typeof expected}`);
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
      assert(actual === expected, `Expected ${dataName} to be ${expected}, got ${actual}`);
    }
  }

  return true;
}

describe('PUCRio_v5_1_Parser', () => {
  describe('AstParser', () => {
    it('should have correct luaVersion', () => {
      const parser = new PUCRio_v5_1_Parser('a + b');
      assert.equal(parser.luaVersion, '5.1');
    });

    it('should have correct source', () => {
      const source = 'a + b';
      const parser = new PUCRio_v5_1_Parser(source);
      assert.equal(parser.source, source);
    });

    it('should should have a parse method', () => {
      const parser = new PUCRio_v5_1_Parser('a + b');
      assert.equal(typeof parser.parse, 'function');
    });
  });

  it('should parse a simple chunk', async () => {
    const parser = new PUCRio_v5_1_Parser('return');
    const chunk = await parser.parse();
    shouldContain(chunk, {
      body: [
        {
          type: NodeType.Statement,
          statementType: StatementType.ReturnStatement,
          children: [
            {
              type: NodeType.ExpressionList,
              children: [],
            },
          ],
        },
      ],
    });
  });

  describe('comments', () => {
    it('should skip comment', async () => {
      const parser = new PUCRio_v5_1_Parser('-- comment');
      const chunk = await parser.parse();
      shouldContain(chunk, {
        body: [],
      });
    });

    it('should skip comment in the middle of a statement', async () => {
      const parser = new PUCRio_v5_1_Parser('return --comment\n1');
      const chunk = await parser.parse();
      shouldContain(chunk, {
        body: [
          {
            type: NodeType.Statement,
            statementType: StatementType.ReturnStatement,
            children: [
              {
                type: NodeType.ExpressionList,
                children: [
                  {
                    type: NodeType.Expression,
                    expressionType: ExpressionType.NumberExpression,
                    raw: '1',
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  });

  describe('statements', () => {
    describe('do .. end', () => {
      it('should parse with empty body', async () => {
        const parser = new PUCRio_v5_1_Parser('do end');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.DoBlockEnd,
              children: [
                {
                  type: NodeType.Chunk,
                  children: [],
                },
              ],
            },
          ],
        });
      });
      it('should parse with a body', async () => {
        const parser = new PUCRio_v5_1_Parser('do return end');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.DoBlockEnd,
              children: [
                {
                  type: NodeType.Chunk,
                  children: [
                    {
                      type: NodeType.Statement,
                      statementType: StatementType.ReturnStatement,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });

    describe('while .. do .. end', () => {
      it('should parse with empty body', async () => {
        const parser = new PUCRio_v5_1_Parser('while true do end');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.WhileBlockEnd,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.TrueExpression,
                  children: [],
                },
                {
                  type: NodeType.Chunk,
                  children: [],
                },
              ],
            },
          ],
        });
      });
      it('should parse with a body', async () => {
        const parser = new PUCRio_v5_1_Parser('while true do return end');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.WhileBlockEnd,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.TrueExpression,
                  children: [],
                },
                {
                  type: NodeType.Chunk,
                  children: [
                    {
                      type: NodeType.Statement,
                      statementType: StatementType.ReturnStatement,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });

    describe('break', () => {
      it('should handle break', async () => {
        const parser = new PUCRio_v5_1_Parser('while true do break end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.WhileBlockEnd,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.TrueExpression,
                  children: [],
                },
                {
                  type: NodeType.Chunk,
                  children: [
                    {
                      type: NodeType.Statement,
                      statementType: StatementType.BreakStatement,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });

    describe('return', () => {
      it('should parse return with no values', async () => {
        const parser = new PUCRio_v5_1_Parser('return');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [],
                },
              ],
            },
          ],
        });
      });
      it('should parse return with 1 value', async () => {
        const parser = new PUCRio_v5_1_Parser('return 1');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.NumberExpression,
                      raw: '1',
                      value: 1,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse return with multiple values', async () => {
        const parser = new PUCRio_v5_1_Parser('return 1, 2, 3');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.NumberExpression,
                      raw: '1',
                      children: [],
                    },
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.NumberExpression,
                      raw: '2',
                      children: [],
                    },
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.NumberExpression,
                      raw: '3',
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });

    describe('if .. then .. elseif .. else .. end', () => {
      it('should parse with empty body', async () => {
        const parser = new PUCRio_v5_1_Parser('if true then end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.IfBlockEnd,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.TrueExpression,
                  children: [],
                },
                {
                  type: NodeType.Chunk,
                  children: [],
                },
              ],
            },
          ],
        });
      });
      it('should parse with empty body and elseif', async () => {
        const parser = new PUCRio_v5_1_Parser('if true then elseif true then end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.IfBlockEnd,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.TrueExpression,
                  children: [],
                },
                {
                  type: NodeType.Chunk,
                  children: [],
                },
                {
                  type: NodeType.ElseIfClause,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.TrueExpression,
                      children: [],
                    },
                    {
                      type: NodeType.Chunk,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with empty body and else', async () => {
        const parser = new PUCRio_v5_1_Parser('if true then else end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.IfBlockEnd,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.TrueExpression,
                  children: [],
                },
                {
                  type: NodeType.Chunk,
                  children: [],
                },
                {
                  type: NodeType.Chunk,
                  children: [],
                },
              ],
            },
          ],
        });
      });

      it('should parse with a return statement', async () => {
        const parser = new PUCRio_v5_1_Parser('if true then return end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.IfBlockEnd,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.TrueExpression,
                  children: [],
                },
                {
                  type: NodeType.Chunk,
                  children: [
                    {
                      type: NodeType.Statement,
                      statementType: StatementType.ReturnStatement,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should throw if missing expression in if', async () => {
        const parser = new PUCRio_v5_1_Parser('if then end');
        await assert.rejects(parser.parse(), 'Expected expression');
      });

      it('should throw if missing expression in elseif', async () => {
        const parser = new PUCRio_v5_1_Parser('if true then elseif then end');
        await assert.rejects(parser.parse(), 'Expected expression');
      });
    });

    describe('repeat ... until expression', () => {
      it('should parse with empty body', async () => {
        const parser = new PUCRio_v5_1_Parser('repeat until true');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.RepeatBlockEnd,
              children: [
                {
                  type: NodeType.Chunk,
                  children: [],
                },
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.TrueExpression,
                  children: [],
                },
              ],
            },
          ],
        });
      });
      it('should parse with a body', async () => {
        const parser = new PUCRio_v5_1_Parser('repeat return until true');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.RepeatBlockEnd,
              children: [
                {
                  type: NodeType.Chunk,
                  children: [
                    {
                      type: NodeType.Statement,
                      statementType: StatementType.ReturnStatement,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.TrueExpression,
                  children: [],
                },
              ],
            },
          ],
        });
      });
    });

    describe('for name = start, end [, step] do ... end', () => {
      it('should parse with empty body', async () => {
        const parser = new PUCRio_v5_1_Parser('for i = 1, 10 do end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ForDoBlockEnd,
              children: [
                {
                  type: NodeType.Name,
                  name: 'i',
                },
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.NumberExpression,
                  raw: '1',
                  children: [],
                },
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.NumberExpression,
                  raw: '10',
                  children: [],
                },
                {
                  type: NodeType.Chunk,
                  children: [],
                },
              ],
            },
          ],
        });
      });
      it('should parse with a body', async () => {
        const parser = new PUCRio_v5_1_Parser('for i = 1, 10 do return end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ForDoBlockEnd,
              children: [
                {
                  type: NodeType.Name,
                  name: 'i',
                },
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.NumberExpression,
                  raw: '1',
                  children: [],
                },
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.NumberExpression,
                  raw: '10',
                  children: [],
                },
                {
                  type: NodeType.Chunk,
                  children: [
                    {
                      type: NodeType.Statement,
                      statementType: StatementType.ReturnStatement,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with a step', async () => {
        const parser = new PUCRio_v5_1_Parser('for i = 1, 10, 2 do return end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ForDoBlockEnd,
              children: [
                {
                  type: NodeType.Name,
                  name: 'i',
                },
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.NumberExpression,
                  raw: '1',
                  children: [],
                },
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.NumberExpression,
                  raw: '10',
                  children: [],
                },
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.NumberExpression,
                  raw: '2',
                  children: [],
                },
                {
                  type: NodeType.Chunk,
                  children: [
                    {
                      type: NodeType.Statement,
                      statementType: StatementType.ReturnStatement,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should fail with a namelist instead of a name', async () => {
        const parser = new PUCRio_v5_1_Parser('for i, j = 1, 10 do end');
        await assert.rejects(parser.parse(), 'Expected name');
      });
    });

    describe('for namelist in explist do ... end', () => {
      it('should parse with empty body', async () => {
        const parser = new PUCRio_v5_1_Parser('for i in 1 do end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ForInBlockEnd,
              children: [
                {
                  type: NodeType.NameList,
                  children: [
                    {
                      type: NodeType.Name,
                      name: 'i',
                    },
                  ],
                },
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.NumberExpression,
                      raw: '1',
                      children: [],
                    },
                  ],
                },
                {
                  type: NodeType.Chunk,
                  children: [],
                },
              ],
            },
          ],
        });
      });
      it('should parse with a body', async () => {
        const parser = new PUCRio_v5_1_Parser('for i in 1 do return end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ForInBlockEnd,
              children: [
                {
                  type: NodeType.NameList,
                  children: [
                    {
                      type: NodeType.Name,
                      name: 'i',
                    },
                  ],
                },
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.NumberExpression,
                      raw: '1',
                      children: [],
                    },
                  ],
                },
                {
                  type: NodeType.Chunk,
                  children: [
                    {
                      type: NodeType.Statement,
                      statementType: StatementType.ReturnStatement,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should fail with no explist', async () => {
        const parser = new PUCRio_v5_1_Parser('for i in do end');
        await assert.rejects(parser.parse(), 'Expected expression');
      });
    });

    describe('last statements', () => {
      it('should fail to parse after a return', async () => {
        const parser = new PUCRio_v5_1_Parser('return 1; return 2;');
        await assert.rejects(parser.parse(), 'Expected end of input');
      });
      it('should fail to parse after a break', async () => {
        const parser = new PUCRio_v5_1_Parser('break; return 2;');
        await assert.rejects(parser.parse(), 'Expected end of input');
      });
    });

    describe('local', () => {
      describe('declarations', () => {
        it('should parse without initializer', async () => {
          const parser = new PUCRio_v5_1_Parser('local a');
          const chunk = await parser.parse();

          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.LocalVariableDeclaration,
                children: [
                  {
                    type: NodeType.NameList,
                    children: [
                      {
                        type: NodeType.Name,
                        name: 'a',
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('should parse with initializer', async () => {
          const parser = new PUCRio_v5_1_Parser('local a = 1');
          const chunk = await parser.parse();

          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.LocalVariableDeclaration,
                children: [
                  {
                    type: NodeType.NameList,
                    children: [
                      {
                        type: NodeType.Name,
                        name: 'a',
                      },
                    ],
                  },
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.NumberExpression,
                        raw: '1',
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('parse with multiple initializers', async () => {
          const parser = new PUCRio_v5_1_Parser('local a, b = 1, 2');
          const chunk = await parser.parse();

          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.LocalVariableDeclaration,
                children: [
                  {
                    type: NodeType.NameList,
                    children: [
                      {
                        type: NodeType.Name,
                        name: 'a',
                      },
                      {
                        type: NodeType.Name,
                        name: 'b',
                      },
                    ],
                  },
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.NumberExpression,
                        raw: '1',
                        children: [],
                      },
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.NumberExpression,
                        raw: '2',
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('should fail with bad namelist', async () => {
          const parser = new PUCRio_v5_1_Parser('local 1');
          await assert.rejects(parser.parse(), 'Expected name');
        });
        it('should fail with no namelist', async () => {
          const parser = new PUCRio_v5_1_Parser('local ');
          await assert.rejects(parser.parse(), 'Expected name');
        });
        it('should fail with bad explist', async () => {
          const parser = new PUCRio_v5_1_Parser('local a = ');
          await assert.rejects(parser.parse(), 'Expected expression');
        });
      });

      describe('function declarations', () => {
        it('should parse', async () => {
          const parser = new PUCRio_v5_1_Parser('local function test() end');
          const chunk = await parser.parse();

          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.LocalFunctionDeclaration,
                children: [
                  {
                    type: NodeType.Name,
                    name: 'test',
                  },
                  {
                    type: NodeType.FuncBody,
                    children: [
                      {
                        type: NodeType.ParameterList,
                        vararg: false,
                        children: [
                          {
                            type: NodeType.NameList,
                            children: [],
                          },
                        ],
                      },
                      {
                        type: NodeType.Chunk,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('should parse with arguments', async () => {
          const parser = new PUCRio_v5_1_Parser('local function test(a) end');
          const chunk = await parser.parse();

          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.LocalFunctionDeclaration,
                children: [
                  {
                    type: NodeType.Name,
                    name: 'test',
                  },
                  {
                    type: NodeType.FuncBody,
                    children: [
                      {
                        type: NodeType.ParameterList,
                        children: [
                          {
                            type: NodeType.NameList,
                            children: [
                              {
                                type: NodeType.Name,
                                name: 'a',
                              },
                            ],
                          },
                        ],
                      },
                      {
                        type: NodeType.Chunk,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('should parse with inner statements', async () => {
          const parser = new PUCRio_v5_1_Parser('local function test() return 1 end');
          const chunk = await parser.parse();

          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.LocalFunctionDeclaration,
                children: [
                  {
                    type: NodeType.Name,
                    name: 'test',
                  },
                  {
                    type: NodeType.FuncBody,
                    children: [
                      {
                        type: NodeType.ParameterList,
                        vararg: false,
                        children: [
                          {
                            type: NodeType.NameList,
                            children: [],
                          },
                        ],
                      },
                      {
                        type: NodeType.Chunk,
                        children: [
                          {
                            type: NodeType.Statement,
                            statementType: StatementType.ReturnStatement,
                            children: [
                              {
                                type: NodeType.ExpressionList,
                                children: [
                                  {
                                    type: NodeType.Expression,
                                    expressionType: ExpressionType.NumberExpression,
                                    raw: '1',
                                    children: [],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });

        it('should fail with no name', async () => {
          const parser = new PUCRio_v5_1_Parser('local function ');
          await assert.rejects(parser.parse(), 'Expected name');
        });
        it('should fail without parentheses', async () => {
          const parser = new PUCRio_v5_1_Parser('local function test end');
          await assert.rejects(parser.parse(), "Expected '('");
        });

        it('should fail with bad parameter list', async () => {
          const parser = new PUCRio_v5_1_Parser('local function test(1) end');
          await assert.rejects(parser.parse(), 'Expected name');
        });
      });
    });

    describe('assignment', () => {
      it('should parse with 1 variable', async () => {
        const parser = new PUCRio_v5_1_Parser('a = 1');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.Assignment,
              children: [
                {
                  type: NodeType.VariableList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'a',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.NumberExpression,
                      raw: '1',
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should parse with multiple variables', async () => {
        const parser = new PUCRio_v5_1_Parser('a, b = 1, 2');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.Assignment,
              children: [
                {
                  type: NodeType.VariableList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'a',
                        },
                      ],
                    },
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'b',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.NumberExpression,
                      raw: '1',
                      children: [],
                    },
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.NumberExpression,
                      raw: '2',
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should parse with weird variables', async () => {
        const parser = new PUCRio_v5_1_Parser('a().b = 1');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.Assignment,
              children: [
                {
                  type: NodeType.VariableList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Member,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.PrefixExpression,
                          prefixExpressionType: PrefixExpressionType.FunctionCall,
                          functionCallPrefixExpressionType: FunctionCallPrefixExpressionType.Normal,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.PrefixExpression,
                              prefixExpressionType: PrefixExpressionType.Variable,
                              variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                              children: [
                                {
                                  type: NodeType.Name,
                                  name: 'a',
                                },
                              ],
                            },
                            {
                              type: NodeType.Arguments,
                              argumentsType: ArgumentsType.ExpressionList,
                              children: [
                                {
                                  type: NodeType.ExpressionList,
                                  children: [],
                                },
                              ],
                            },
                          ],
                        },
                        {
                          type: NodeType.Name,
                          name: 'b',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.NumberExpression,
                      raw: '1',
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should parse with mismatched variables and values', async () => {
        const parser = new PUCRio_v5_1_Parser('a, b = 1');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.Assignment,
              children: [
                {
                  type: NodeType.VariableList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'a',
                        },
                      ],
                    },
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'b',
                        },
                      ],
                    },
                  ],
                },
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.NumberExpression,
                      raw: '1',
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should fail with bad explist', async () => {
        const parser = new PUCRio_v5_1_Parser('a = ');

        await assert.rejects(parser.parse(), 'Expected expression');
      });
    });
  });

  describe('functions', () => {
    describe('statements', () => {
      it('should parse', async () => {
        const parser = new PUCRio_v5_1_Parser('function test() end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionDeclaration,
              children: [
                {
                  type: NodeType.FunctionName,
                  name: {
                    type: NodeType.Name,
                    name: 'test',
                  },
                  indexers: [],
                  methodName: undefined,
                },
                {
                  type: NodeType.FuncBody,
                  children: [
                    {
                      type: NodeType.ParameterList,
                      vararg: false,
                      children: [
                        {
                          type: NodeType.NameList,
                          children: [],
                        },
                      ],
                    },
                    {
                      type: NodeType.Chunk,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with an argument', async () => {
        const parser = new PUCRio_v5_1_Parser('function test(a) end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionDeclaration,
              children: [
                {
                  type: NodeType.FunctionName,
                  name: {
                    type: NodeType.Name,
                    name: 'test',
                  },
                  indexers: [],
                  methodName: undefined,
                },
                {
                  type: NodeType.FuncBody,
                  children: [
                    {
                      type: NodeType.ParameterList,
                      children: [
                        {
                          type: NodeType.NameList,
                          children: [
                            {
                              type: NodeType.Name,
                              name: 'a',
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: NodeType.Chunk,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with multiple arguments', async () => {
        const parser = new PUCRio_v5_1_Parser('function test(a, b) end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionDeclaration,
              children: [
                {
                  type: NodeType.FunctionName,
                  name: {
                    type: NodeType.Name,
                    name: 'test',
                  },
                  indexers: [],
                  methodName: undefined,
                },
                {
                  type: NodeType.FuncBody,
                  children: [
                    {
                      type: NodeType.ParameterList,
                      children: [
                        {
                          type: NodeType.NameList,
                          children: [
                            {
                              type: NodeType.Name,
                              name: 'a',
                            },
                            {
                              type: NodeType.Name,
                              name: 'b',
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: NodeType.Chunk,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with an inner statement', async () => {
        const parser = new PUCRio_v5_1_Parser('function test() return 1 end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionDeclaration,
              children: [
                {
                  type: NodeType.FunctionName,
                  name: {
                    type: NodeType.Name,
                    name: 'test',
                  },
                  indexers: [],
                  methodName: undefined,
                },
                {
                  type: NodeType.FuncBody,
                  children: [
                    {
                      type: NodeType.ParameterList,
                      vararg: false,
                      children: [
                        {
                          type: NodeType.NameList,
                          children: [],
                        },
                      ],
                    },
                    {
                      type: NodeType.Chunk,
                      children: [
                        {
                          type: NodeType.Statement,
                          statementType: StatementType.ReturnStatement,
                          children: [
                            {
                              type: NodeType.ExpressionList,
                              children: [
                                {
                                  type: NodeType.Expression,
                                  expressionType: ExpressionType.NumberExpression,
                                  raw: '1',
                                  children: [],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with indexed names', async () => {
        const parser = new PUCRio_v5_1_Parser('function test.a.b() end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionDeclaration,
              children: [
                {
                  type: NodeType.FunctionName,
                  name: {
                    type: NodeType.Name,
                    name: 'test',
                  },
                  indexers: [
                    {
                      type: NodeType.Name,
                      name: 'a',
                    },
                    {
                      type: NodeType.Name,
                      name: 'b',
                    },
                  ],
                  methodName: undefined,
                },
                {
                  type: NodeType.FuncBody,
                  children: [
                    {
                      type: NodeType.ParameterList,
                      vararg: false,
                      children: [
                        {
                          type: NodeType.NameList,
                          children: [],
                        },
                      ],
                    },
                    {
                      type: NodeType.Chunk,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with method names', async () => {
        const parser = new PUCRio_v5_1_Parser('function test:a() end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionDeclaration,
              children: [
                {
                  type: NodeType.FunctionName,
                  name: {
                    type: NodeType.Name,
                    name: 'test',
                  },
                  indexers: [],
                  methodName: {
                    type: NodeType.Name,
                    name: 'a',
                  },
                },
                {
                  type: NodeType.FuncBody,
                  children: [
                    {
                      type: NodeType.ParameterList,
                      vararg: false,
                      children: [
                        {
                          type: NodeType.NameList,
                          children: [],
                        },
                      ],
                    },
                    {
                      type: NodeType.Chunk,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with method names and indexers', async () => {
        const parser = new PUCRio_v5_1_Parser('function test.a:b() end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionDeclaration,
              children: [
                {
                  type: NodeType.FunctionName,
                  name: {
                    type: NodeType.Name,
                    name: 'test',
                  },
                  indexers: [
                    {
                      type: NodeType.Name,
                      name: 'a',
                    },
                  ],
                  methodName: {
                    type: NodeType.Name,
                    name: 'b',
                  },
                },
                {
                  type: NodeType.FuncBody,
                  children: [
                    {
                      type: NodeType.ParameterList,
                      vararg: false,
                      children: [
                        {
                          type: NodeType.NameList,
                          children: [],
                        },
                      ],
                    },
                    {
                      type: NodeType.Chunk,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with only varargs', async () => {
        const parser = new PUCRio_v5_1_Parser('function test(...) end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionDeclaration,
              children: [
                {
                  type: NodeType.FunctionName,
                  name: {
                    type: NodeType.Name,
                    name: 'test',
                  },
                  indexers: [],
                  methodName: undefined,
                },
                {
                  type: NodeType.FuncBody,
                  children: [
                    {
                      type: NodeType.ParameterList,
                      vararg: true,
                      children: [
                        {
                          type: NodeType.NameList,
                          children: [],
                        },
                      ],
                    },
                    {
                      type: NodeType.Chunk,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse names and varargs', async () => {
        const parser = new PUCRio_v5_1_Parser('function test(a, b, ...) end');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionDeclaration,
              children: [
                {
                  type: NodeType.FunctionName,
                  name: {
                    type: NodeType.Name,
                    name: 'test',
                  },
                  indexers: [],
                  methodName: undefined,
                },
                {
                  type: NodeType.FuncBody,
                  children: [
                    {
                      type: NodeType.ParameterList,
                      vararg: true,
                      children: [
                        {
                          type: NodeType.NameList,
                          children: [
                            {
                              type: NodeType.Name,
                              name: 'a',
                            },
                            {
                              type: NodeType.Name,
                              name: 'b',
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: NodeType.Chunk,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });

    describe('expressions', () => {
      it('should parse', async () => {
        const parser = new PUCRio_v5_1_Parser('return function() end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.FunctionExpression,
                      children: [
                        {
                          type: NodeType.FuncBody,
                          children: [
                            {
                              type: NodeType.ParameterList,
                              vararg: false,
                              children: [
                                {
                                  type: NodeType.NameList,
                                  children: [],
                                },
                              ],
                            },
                            {
                              type: NodeType.Chunk,
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with arguments', async () => {
        const parser = new PUCRio_v5_1_Parser('return function(a) end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.FunctionExpression,
                      children: [
                        {
                          type: NodeType.FuncBody,
                          children: [
                            {
                              type: NodeType.ParameterList,
                              children: [
                                {
                                  type: NodeType.NameList,
                                  children: [
                                    {
                                      type: NodeType.Name,
                                      name: 'a',
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              type: NodeType.Chunk,
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with inner statements', async () => {
        const parser = new PUCRio_v5_1_Parser('return function() return 1 end');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.FunctionExpression,
                      children: [
                        {
                          type: NodeType.FuncBody,
                          children: [
                            {
                              type: NodeType.ParameterList,
                              vararg: false,
                              children: [
                                {
                                  type: NodeType.NameList,
                                  children: [],
                                },
                              ],
                            },
                            {
                              type: NodeType.Chunk,
                              children: [
                                {
                                  type: NodeType.Statement,
                                  statementType: StatementType.ReturnStatement,
                                  children: [
                                    {
                                      type: NodeType.ExpressionList,
                                      children: [
                                        {
                                          type: NodeType.Expression,
                                          expressionType: ExpressionType.NumberExpression,
                                          raw: '1',
                                          children: [],
                                        },
                                      ],
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });

    describe('call statements', () => {
      it('should parse', async () => {
        const parser = new PUCRio_v5_1_Parser('test()');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionCall,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.PrefixExpression,
                  prefixExpressionType: PrefixExpressionType.FunctionCall,
                  functionCallPrefixExpressionType: FunctionCallPrefixExpressionType.Normal,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'test',
                        },
                      ],
                    },
                    {
                      type: NodeType.Arguments,
                      argumentsType: ArgumentsType.ExpressionList,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse multiple calls', async () => {
        const parser = new PUCRio_v5_1_Parser('test() test2()');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionCall,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.PrefixExpression,
                  prefixExpressionType: PrefixExpressionType.FunctionCall,
                  functionCallPrefixExpressionType: FunctionCallPrefixExpressionType.Normal,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'test',
                        },
                      ],
                    },
                    {
                      type: NodeType.Arguments,
                      argumentsType: ArgumentsType.ExpressionList,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionCall,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.PrefixExpression,
                  prefixExpressionType: PrefixExpressionType.FunctionCall,
                  functionCallPrefixExpressionType: FunctionCallPrefixExpressionType.Normal,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'test2',
                        },
                      ],
                    },
                    {
                      type: NodeType.Arguments,
                      argumentsType: ArgumentsType.ExpressionList,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with table arguments', async () => {
        const parser = new PUCRio_v5_1_Parser('test{}');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionCall,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.PrefixExpression,
                  prefixExpressionType: PrefixExpressionType.FunctionCall,
                  functionCallPrefixExpressionType: FunctionCallPrefixExpressionType.Normal,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'test',
                        },
                      ],
                    },
                    {
                      type: NodeType.Arguments,
                      argumentsType: ArgumentsType.TableConstructor,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.TableConstructorExpression,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with string arguments', async () => {
        const parser = new PUCRio_v5_1_Parser('test"test"');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionCall,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.PrefixExpression,
                  prefixExpressionType: PrefixExpressionType.FunctionCall,
                  functionCallPrefixExpressionType: FunctionCallPrefixExpressionType.Normal,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'test',
                        },
                      ],
                    },
                    {
                      type: NodeType.Arguments,
                      argumentsType: ArgumentsType.String,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.StringExpression,
                          raw: '"test"',
                          value: 'test',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse when parenthesized', async () => {
        const parser = new PUCRio_v5_1_Parser('(test)()');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionCall,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.PrefixExpression,
                  prefixExpressionType: PrefixExpressionType.FunctionCall,
                  functionCallPrefixExpressionType: FunctionCallPrefixExpressionType.Normal,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.ParenthesizedExpression,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.PrefixExpression,
                          prefixExpressionType: PrefixExpressionType.Variable,
                          variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                          children: [
                            {
                              type: NodeType.Name,
                              name: 'test',
                            },
                          ],
                        },
                      ],
                    },
                    {
                      type: NodeType.Arguments,
                      argumentsType: ArgumentsType.ExpressionList,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should parse with argument', async () => {
        const parser = new PUCRio_v5_1_Parser('test(1)');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionCall,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.PrefixExpression,
                  prefixExpressionType: PrefixExpressionType.FunctionCall,
                  functionCallPrefixExpressionType: FunctionCallPrefixExpressionType.Normal,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'test',
                        },
                      ],
                    },
                    {
                      type: NodeType.Arguments,
                      argumentsType: ArgumentsType.ExpressionList,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              value: 1,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should parse with multiple arguments', async () => {
        const parser = new PUCRio_v5_1_Parser('test(1, 2)');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionCall,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.PrefixExpression,
                  prefixExpressionType: PrefixExpressionType.FunctionCall,
                  functionCallPrefixExpressionType: FunctionCallPrefixExpressionType.Normal,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'test',
                        },
                      ],
                    },
                    {
                      type: NodeType.Arguments,
                      argumentsType: ArgumentsType.ExpressionList,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              value: 1,
                            },
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              value: 2,
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should parse with test(t, {n=4,2,3})', async () => {
        const parser = new PUCRio_v5_1_Parser('test(t, {n=4,2,3})');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.FunctionCall,
              children: [
                {
                  type: NodeType.Expression,
                  expressionType: ExpressionType.PrefixExpression,
                  prefixExpressionType: PrefixExpressionType.FunctionCall,
                  functionCallPrefixExpressionType: FunctionCallPrefixExpressionType.Normal,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.Variable,
                      variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                      children: [
                        {
                          type: NodeType.Name,
                          name: 'test',
                        },
                      ],
                    },
                    {
                      type: NodeType.Arguments,
                      argumentsType: ArgumentsType.ExpressionList,
                      children: [
                        {
                          type: NodeType.ExpressionList,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.PrefixExpression,
                              prefixExpressionType: PrefixExpressionType.Variable,
                              variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                              children: [
                                {
                                  type: NodeType.Name,
                                  name: 't',
                                },
                              ],
                            },
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.TableConstructorExpression,
                              children: [
                                {
                                  type: NodeType.Field,
                                  fieldType: FieldType.NameExpression,
                                  children: [
                                    {
                                      type: NodeType.Name,
                                      name: 'n',
                                    },
                                    {
                                      type: NodeType.Expression,
                                      expressionType: ExpressionType.NumberExpression,
                                      raw: '4',
                                      value: 4,
                                    },
                                  ],
                                },
                                {
                                  type: NodeType.Field,
                                  fieldType: FieldType.Expression,
                                  children: [
                                    {
                                      type: NodeType.Expression,
                                      expressionType: ExpressionType.NumberExpression,
                                      raw: '2',
                                      value: 2,
                                    },
                                  ],
                                },
                                {
                                  type: NodeType.Field,
                                  fieldType: FieldType.Expression,
                                  children: [
                                    {
                                      type: NodeType.Expression,
                                      expressionType: ExpressionType.NumberExpression,
                                      raw: '3',
                                      value: 3,
                                    },
                                  ],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });
  });

  describe('expressions', () => {
    describe('prefix', () => {
      describe('variables', () => {
        it('should parse member accessors', async () => {
          const parser = new PUCRio_v5_1_Parser('return a.b');
          const chunk = await parser.parse();

          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.ReturnStatement,
                children: [
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.PrefixExpression,
                        prefixExpressionType: PrefixExpressionType.Variable,
                        variablePrefixExpressionType: VariablePrefixExpressionType.Member,
                        children: [
                          {
                            type: NodeType.Expression,
                            expressionType: ExpressionType.PrefixExpression,
                            prefixExpressionType: PrefixExpressionType.Variable,
                            variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                            children: [
                              {
                                type: NodeType.Name,
                                name: 'a',
                              },
                            ],
                          },
                          {
                            type: NodeType.Name,
                            name: 'b',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('should parse indexed accessors', async () => {
          const parser = new PUCRio_v5_1_Parser('return a[1]');
          const chunk = await parser.parse();

          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.ReturnStatement,
                children: [
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.PrefixExpression,
                        prefixExpressionType: PrefixExpressionType.Variable,
                        variablePrefixExpressionType: VariablePrefixExpressionType.Index,
                        children: [
                          {
                            type: NodeType.Expression,
                            expressionType: ExpressionType.PrefixExpression,
                            prefixExpressionType: PrefixExpressionType.Variable,
                            variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                            children: [
                              {
                                type: NodeType.Name,
                                name: 'a',
                              },
                            ],
                          },
                          {
                            type: NodeType.Expression,
                            expressionType: ExpressionType.NumberExpression,
                            raw: '1',
                            children: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
      });
      it('should parse function calls', async () => {
        const parser = new PUCRio_v5_1_Parser('return a()');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.FunctionCall,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.PrefixExpression,
                          prefixExpressionType: PrefixExpressionType.Variable,
                          variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                          children: [
                            {
                              type: NodeType.Name,
                              name: 'a',
                            },
                          ],
                        },
                        {
                          type: NodeType.Arguments,
                          argumentsType: ArgumentsType.ExpressionList,
                          children: [
                            {
                              type: NodeType.ExpressionList,
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse function method calls', async () => {
        const parser = new PUCRio_v5_1_Parser('return a:b()');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.FunctionCall,
                      functionCallPrefixExpressionType: FunctionCallPrefixExpressionType.Method,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.PrefixExpression,
                          prefixExpressionType: PrefixExpressionType.Variable,
                          variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                          children: [
                            {
                              type: NodeType.Name,
                              name: 'a',
                            },
                          ],
                        },
                        {
                          type: NodeType.Name,
                          name: 'b',
                        },
                        {
                          type: NodeType.Arguments,
                          argumentsType: ArgumentsType.ExpressionList,
                          children: [
                            {
                              type: NodeType.ExpressionList,
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse variable indexed function calls', async () => {
        const parser = new PUCRio_v5_1_Parser('return a[1]()');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.FunctionCall,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.PrefixExpression,
                          prefixExpressionType: PrefixExpressionType.Variable,
                          variablePrefixExpressionType: VariablePrefixExpressionType.Index,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.PrefixExpression,
                              prefixExpressionType: PrefixExpressionType.Variable,
                              variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                              children: [
                                {
                                  type: NodeType.Name,
                                  name: 'a',
                                },
                              ],
                            },
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '1',
                              children: [],
                            },
                          ],
                        },
                        {
                          type: NodeType.Arguments,
                          argumentsType: ArgumentsType.ExpressionList,
                          children: [
                            {
                              type: NodeType.ExpressionList,
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse variable method function calls', async () => {
        const parser = new PUCRio_v5_1_Parser('return a.b:c()');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.PrefixExpression,
                      prefixExpressionType: PrefixExpressionType.FunctionCall,
                      functionCallPrefixExpressionType: FunctionCallPrefixExpressionType.Method,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.PrefixExpression,
                          prefixExpressionType: PrefixExpressionType.Variable,
                          variablePrefixExpressionType: VariablePrefixExpressionType.Member,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.PrefixExpression,
                              prefixExpressionType: PrefixExpressionType.Variable,
                              variablePrefixExpressionType: VariablePrefixExpressionType.Name,
                              children: [
                                {
                                  type: NodeType.Name,
                                  name: 'a',
                                },
                              ],
                            },
                            {
                              type: NodeType.Name,
                              name: 'b',
                            },
                          ],
                        },
                        {
                          type: NodeType.Name,
                          name: 'c',
                        },
                        {
                          type: NodeType.Arguments,
                          argumentsType: ArgumentsType.ExpressionList,
                          children: [
                            {
                              type: NodeType.ExpressionList,
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });

    describe('unary operations', () => {
      it('should parse with -', async () => {
        const parser = new PUCRio_v5_1_Parser('return -1');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.UnaryOperationExpression,
                      operator: '-',
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.NumberExpression,
                          raw: '1',
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with or', async () => {
        const parser = new PUCRio_v5_1_Parser('return true or false');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.BinaryOperationExpression,
                      operator: 'or',
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.TrueExpression,
                          children: [],
                        },
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.FalseExpression,
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with ^', async () => {
        const parser = new PUCRio_v5_1_Parser('return 1 ^ 2');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.BinaryOperationExpression,
                      operator: '^',
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.NumberExpression,
                          raw: '1',
                          children: [],
                        },
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.NumberExpression,
                          raw: '2',
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });

    describe('binary operations', () => {
      it('should parse with +', async () => {
        const parser = new PUCRio_v5_1_Parser('return 1 + 2');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.BinaryOperationExpression,
                      operator: '+',
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.NumberExpression,
                          raw: '1',
                          children: [],
                        },
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.NumberExpression,
                          raw: '2',
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should properly parse with + and -', async () => {
        const parser = new PUCRio_v5_1_Parser('return 1 + 2 - 3');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.BinaryOperationExpression,
                      operator: '-',
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.BinaryOperationExpression,
                          operator: '+',
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '1',
                              children: [],
                            },
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '2',
                              children: [],
                            },
                          ],
                        },
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.NumberExpression,
                          raw: '3',
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
    });

    describe('literals', () => {
      it('should parse false', async () => {
        const parser = new PUCRio_v5_1_Parser('return false');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.FalseExpression,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should parse true', async () => {
        const parser = new PUCRio_v5_1_Parser('return true');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.TrueExpression,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should parse nil', async () => {
        const parser = new PUCRio_v5_1_Parser('return nil');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.NilExpression,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should parse ...', async () => {
        const parser = new PUCRio_v5_1_Parser('return ...');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.VarargExpression,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      describe('strings', () => {
        describe('simple', () => {
          it('should parse with double quotes', async () => {
            const parser = new PUCRio_v5_1_Parser('return "test"');
            const chunk = await parser.parse();
            shouldContain(chunk, {
              body: [
                {
                  type: NodeType.Statement,
                  statementType: StatementType.ReturnStatement,
                  children: [
                    {
                      type: NodeType.ExpressionList,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.StringExpression,
                          raw: '"test"',
                          value: 'test',
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            });
          });
          it('should parse with single quotes', async () => {
            const parser = new PUCRio_v5_1_Parser("return 'test'");
            const chunk = await parser.parse();
            shouldContain(chunk, {
              body: [
                {
                  type: NodeType.Statement,
                  statementType: StatementType.ReturnStatement,
                  children: [
                    {
                      type: NodeType.ExpressionList,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.StringExpression,
                          raw: "'test'",
                          value: 'test',
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            });
          });
          it('should escape characters', async () => {
            const parser = new PUCRio_v5_1_Parser('return "test\\n\n"');
            const chunk = await parser.parse();
            shouldContain(chunk, {
              body: [
                {
                  type: NodeType.Statement,
                  statementType: StatementType.ReturnStatement,
                  children: [
                    {
                      type: NodeType.ExpressionList,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.StringExpression,
                          raw: '"test\\n\n"',
                          value: 'test\n\n',
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            });
          });
          it('should not parse bad escapes', async () => {
            const parser = new PUCRio_v5_1_Parser('return "test\\H\n"');
            await assert.rejects(parser.parse());
          });
          it('should fail on unterminated string', async () => {
            const parser = new PUCRio_v5_1_Parser('return "test\\H\n\\"');
            await assert.rejects(parser.parse());
          });
          it('should escape hexadecimals', async () => {
            const parser = new PUCRio_v5_1_Parser('return "\\x0A\\xfF"');
            const chunk = await parser.parse();
            shouldContain(chunk, {
              body: [
                {
                  type: NodeType.Statement,
                  statementType: StatementType.ReturnStatement,
                  children: [
                    {
                      type: NodeType.ExpressionList,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.StringExpression,
                          raw: '"\\x0A\\xfF"',
                          value: new TextDecoder().decode(new Uint8Array([0x0a, 0xff])),
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            });
          });
          it('should escape decimals', async () => {
            const parser = new PUCRio_v5_1_Parser('return "\\1\\10\\255"');
            const chunk = await parser.parse();
            shouldContain(chunk, {
              body: [
                {
                  type: NodeType.Statement,
                  statementType: StatementType.ReturnStatement,
                  children: [
                    {
                      type: NodeType.ExpressionList,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.StringExpression,
                          raw: '"\\1\\10\\255"',
                          value: new TextDecoder().decode(new Uint8Array([1, 10, 255])),
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            });
          });
        });

        describe('long', () => {
          it('should parse with double brackets', async () => {
            const parser = new PUCRio_v5_1_Parser('return [[test]]');
            const chunk = await parser.parse();
            shouldContain(chunk, {
              body: [
                {
                  type: NodeType.Statement,
                  statementType: StatementType.ReturnStatement,
                  children: [
                    {
                      type: NodeType.ExpressionList,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.StringExpression,
                          raw: '[[test]]',
                          value: 'test',
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            });
          });
          it('should parse with double brackets and equals', async () => {
            const parser = new PUCRio_v5_1_Parser('return [==[test]==]');
            const chunk = await parser.parse();
            shouldContain(chunk, {
              body: [
                {
                  type: NodeType.Statement,
                  statementType: StatementType.ReturnStatement,
                  children: [
                    {
                      type: NodeType.ExpressionList,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.StringExpression,
                          raw: '[==[test]==]',
                          value: 'test',
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            });
          });
          it('should not escape characters', async () => {
            const parser = new PUCRio_v5_1_Parser('return [[test\\n\n]]');
            const chunk = await parser.parse();
            shouldContain(chunk, {
              body: [
                {
                  type: NodeType.Statement,
                  statementType: StatementType.ReturnStatement,
                  children: [
                    {
                      type: NodeType.ExpressionList,
                      children: [
                        {
                          type: NodeType.Expression,
                          expressionType: ExpressionType.StringExpression,
                          raw: '[[test\\n\n]]',
                          value: 'test\\n\n',
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            });
          });
          it('should not parse mismatched brackets', async () => {
            const parser = new PUCRio_v5_1_Parser('return [[test]');
            await assert.rejects(parser.parse());
          });
          it('should not parse mismatched levels of equals', async () => {
            const parser = new PUCRio_v5_1_Parser('return [=[test]==]');
            await assert.rejects(parser.parse());
          });
        });
      });

      describe('numbers', () => {
        it('should parse normally', async () => {
          const parser = new PUCRio_v5_1_Parser('return 1');
          const chunk = await parser.parse();
          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.ReturnStatement,
                children: [
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.NumberExpression,
                        raw: '1',
                        value: 1,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('should parse with exponent', async () => {
          const parser = new PUCRio_v5_1_Parser('return 1e2');
          const chunk = await parser.parse();
          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.ReturnStatement,
                children: [
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.NumberExpression,
                        raw: '1e2',
                        value: 100,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('should parse decimals', async () => {
          const parser = new PUCRio_v5_1_Parser('return 1.2');
          const chunk = await parser.parse();
          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.ReturnStatement,
                children: [
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.NumberExpression,
                        raw: '1.2',
                        value: 1.2,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('should parse decimals with exponents', async () => {
          const parser = new PUCRio_v5_1_Parser('return 1.2e3');
          const chunk = await parser.parse();

          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.ReturnStatement,
                children: [
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.NumberExpression,
                        raw: '1.2e3',
                        value: 1200,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('should parse with negative exponents', async () => {
          const parser = new PUCRio_v5_1_Parser('return 56e-2');
          const chunk = await parser.parse();

          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.ReturnStatement,
                children: [
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.NumberExpression,
                        raw: '56e-2',
                        value: 0.56,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('should parse with plus-prefixed exponents', async () => {
          const parser = new PUCRio_v5_1_Parser('return 56e+2');
          const chunk = await parser.parse();

          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.ReturnStatement,
                children: [
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.NumberExpression,
                        raw: '56e+2',
                        value: 5600,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('should parse hexadecimals', async () => {
          const parser = new PUCRio_v5_1_Parser('return 0xdeadbEef');
          const chunk = await parser.parse();

          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.ReturnStatement,
                children: [
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.NumberExpression,
                        raw: '0xdeadbEef',
                        value: 0xdeadbeef,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
        it('should parse hexadecimals with decimals', async () => {
          const parser = new PUCRio_v5_1_Parser('return 0xdead.bEef');
          const chunk = await parser.parse();
          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.ReturnStatement,
                children: [
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.NumberExpression,
                        raw: '0xdead.bEef',
                        value: 0xdead + 0xbeef * 16 ** -4,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });

        it('should parse 0', async () => {
          const parser = new PUCRio_v5_1_Parser('return 0');
          const chunk = await parser.parse();
          shouldContain(chunk, {
            body: [
              {
                type: NodeType.Statement,
                statementType: StatementType.ReturnStatement,
                children: [
                  {
                    type: NodeType.ExpressionList,
                    children: [
                      {
                        type: NodeType.Expression,
                        expressionType: ExpressionType.NumberExpression,
                        raw: '0',
                        value: 0,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          });
        });
      });
    });

    describe('tables', () => {
      it('should parse when empty', async () => {
        const parser = new PUCRio_v5_1_Parser('return {}');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.TableConstructorExpression,
                      children: [],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with 1 array part', async () => {
        const parser = new PUCRio_v5_1_Parser('return {1}');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.TableConstructorExpression,
                      children: [
                        {
                          type: NodeType.Field,
                          fieldType: FieldType.Expression,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '1',
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with 1 array part and trailing seperator', async () => {
        const parser = new PUCRio_v5_1_Parser('return {1, }');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.TableConstructorExpression,
                      children: [
                        {
                          type: NodeType.Field,
                          fieldType: FieldType.Expression,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '1',
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with multiple array parts', async () => {
        const parser = new PUCRio_v5_1_Parser('return {1, 2; true}');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.TableConstructorExpression,
                      children: [
                        {
                          type: NodeType.Field,
                          fieldType: FieldType.Expression,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '1',
                              children: [],
                            },
                          ],
                        },
                        {
                          type: NodeType.Field,
                          fieldType: FieldType.Expression,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '2',
                              children: [],
                            },
                          ],
                        },
                        {
                          type: NodeType.Field,
                          fieldType: FieldType.Expression,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.TrueExpression,
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with an expression key', async () => {
        const parser = new PUCRio_v5_1_Parser('return {[1] = 2}');
        const chunk = await parser.parse();
        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.TableConstructorExpression,
                      children: [
                        {
                          type: NodeType.Field,
                          fieldType: FieldType.ExpressionExpression,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '1',
                              children: [],
                            },
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '2',
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with multiple expression keys', async () => {
        const parser = new PUCRio_v5_1_Parser('return {[1] = 2, [3] = 4; [true] = 6}');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.TableConstructorExpression,
                      children: [
                        {
                          type: NodeType.Field,
                          fieldType: FieldType.ExpressionExpression,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '1',
                              children: [],
                            },
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '2',
                              children: [],
                            },
                          ],
                        },
                        {
                          type: NodeType.Field,
                          fieldType: FieldType.ExpressionExpression,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '3',
                              children: [],
                            },
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '4',
                              children: [],
                            },
                          ],
                        },
                        {
                          type: NodeType.Field,
                          fieldType: FieldType.ExpressionExpression,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.TrueExpression,
                              children: [],
                            },
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '6',
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with a name key', async () => {
        const parser = new PUCRio_v5_1_Parser('return {test = 2}');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.TableConstructorExpression,
                      children: [
                        {
                          type: NodeType.Field,
                          fieldType: FieldType.NameExpression,
                          children: [
                            {
                              type: NodeType.Name,
                              name: 'test',
                            },
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '2',
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });
      it('should parse with a name key and a array key', async () => {
        const parser = new PUCRio_v5_1_Parser('return {test = 2, 3}');
        const chunk = await parser.parse();

        shouldContain(chunk, {
          body: [
            {
              type: NodeType.Statement,
              statementType: StatementType.ReturnStatement,
              children: [
                {
                  type: NodeType.ExpressionList,
                  children: [
                    {
                      type: NodeType.Expression,
                      expressionType: ExpressionType.TableConstructorExpression,
                      children: [
                        {
                          type: NodeType.Field,
                          fieldType: FieldType.NameExpression,
                          children: [
                            {
                              type: NodeType.Name,
                              name: 'test',
                            },
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '2',
                              children: [],
                            },
                          ],
                        },
                        {
                          type: NodeType.Field,
                          fieldType: FieldType.Expression,
                          children: [
                            {
                              type: NodeType.Expression,
                              expressionType: ExpressionType.NumberExpression,
                              raw: '3',
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });
      });

      it('should fail on unterminated table', async () => {
        const parser = new PUCRio_v5_1_Parser('return {');
        await assert.rejects(parser.parse());
      });
      it('should fail on unterminated field', async () => {
        const parser = new PUCRio_v5_1_Parser('return {[');
        await assert.rejects(parser.parse());
      });
      it('should fail on unterminated expression field', async () => {
        const parser = new PUCRio_v5_1_Parser('return {[1]=');
        await assert.rejects(parser.parse());
      });
    });
  });
});
