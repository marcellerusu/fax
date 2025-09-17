type Span = { start: number; end: number };

type Token = (
  | { type: "/" }
  | { type: "(" }
  | { type: ")" }
  | { type: "#[" }
  | { type: "]" }
  | { type: "{" }
  | { type: "}" }
  | { type: "|" }
  | { type: "<" }
  | { type: ">" }
  | { type: "/>" }
  | { type: "</" }
  | { type: ":=" }
  | { type: "=" }
  | { type: "+" }
  | { type: "-" }
  | { type: ":" }
  | { type: "," }
  | { type: "." }
  | { type: "when" }
  | { type: "loop" }
  | { type: "return" }
  | { type: "continue" }
  | { type: "starting-with" }
  | { type: "if" }
  | { type: "else" }
  | { type: "end" }
  | { type: "true" }
  | { type: "false" }
  | { type: "number"; value: number }
  | { type: "id"; name: string }
  | { type: "string"; value: string }
) & { span: Span };

type ExtractTokenType<Type extends Token["type"]> = Type extends "number"
  ? { type: "number"; value: number; span: Span }
  : Type extends "id"
  ? { type: "id"; name: string; span: Span }
  : Type extends "string"
  ? { type: "string"; value: string; span: Span }
  : { type: Type; span: Span };

class Lexer {
  idx = 0;
  match: string | null = null;
  constructor(private program: string) {}

  test(pattern: string | RegExp): boolean {
    if (typeof pattern === "string") {
      if (this.program.slice(this.idx).startsWith(pattern)) {
        this.idx += pattern.length;
        this.match = pattern;
        return true;
      } else {
        return false;
      }
    } else {
      let result = this.program.slice(this.idx).match(pattern);
      if (!result || result.index !== 0) return false;
      this.match = result[0];
      this.idx += this.match.length;
      return true;
    }
  }

  span() {
    return { start: this.idx - this.match!.length, end: this.idx };
  }

  run() {
    let tokens: Token[] = [];
    while (this.idx < this.program.length) {
      if (this.test(/\s+/)) {
        continue;
      } else if (this.test("|")) {
        tokens.push({ type: "|", span: this.span() });
      } else if (this.test("(")) {
        tokens.push({ type: "(", span: this.span() });
      } else if (this.test(")")) {
        tokens.push({ type: ")", span: this.span() });
      } else if (this.test("/>")) {
        tokens.push({ type: "/>", span: this.span() });
      } else if (this.test("/")) {
        tokens.push({ type: "/", span: this.span() });
      } else if (this.test("</")) {
        tokens.push({ type: "</", span: this.span() });
      } else if (this.test("<")) {
        tokens.push({ type: "<", span: this.span() });
      } else if (this.test(">")) {
        tokens.push({ type: ">", span: this.span() });
      } else if (this.test("#[")) {
        tokens.push({ type: "#[", span: this.span() });
      } else if (this.test("]")) {
        tokens.push({ type: "]", span: this.span() });
      } else if (this.test("{")) {
        tokens.push({ type: "{", span: this.span() });
      } else if (this.test("}")) {
        tokens.push({ type: "}", span: this.span() });
      } else if (this.test(":=")) {
        tokens.push({ type: ":=", span: this.span() });
      } else if (this.test("=")) {
        tokens.push({ type: "=", span: this.span() });
      } else if (this.test(",")) {
        tokens.push({ type: ",", span: this.span() });
      } else if (this.test(".")) {
        tokens.push({ type: ".", span: this.span() });
      } else if (this.test(":")) {
        tokens.push({ type: ":", span: this.span() });
      } else if (this.test("+")) {
        tokens.push({ type: "+", span: this.span() });
      } else if (this.test("-")) {
        tokens.push({ type: "-", span: this.span() });
      } else if (this.test("loop")) {
        tokens.push({ type: "loop", span: this.span() });
      } else if (this.test("return")) {
        tokens.push({ type: "return", span: this.span() });
      } else if (this.test("continue")) {
        tokens.push({ type: "continue", span: this.span() });
      } else if (this.test("starting-with")) {
        tokens.push({ type: "starting-with", span: this.span() });
      } else if (this.test("when")) {
        tokens.push({ type: "when", span: this.span() });
      } else if (this.test("if")) {
        tokens.push({ type: "if", span: this.span() });
      } else if (this.test("else")) {
        tokens.push({ type: "else", span: this.span() });
      } else if (this.test("end")) {
        tokens.push({ type: "end", span: this.span() });
      } else if (this.test("true")) {
        tokens.push({ type: "true", span: this.span() });
      } else if (this.test("false")) {
        tokens.push({ type: "false", span: this.span() });
      } else if (this.test(/\d+/)) {
        tokens.push({
          type: "number",
          value: Number(this.match),
          span: this.span(),
        });
      } else if (this.test(/(\w|-)+/)) {
        tokens.push({ type: "id", name: this.match!, span: this.span() });
      } else if (this.test(/"(\\.|[^"\\])*"/)) {
        tokens.push({
          type: "string",
          value: this.match!.slice(1, -1),
          span: this.span(),
        });
      } else {
        console.log(this.program.slice(this.idx));
        throw "lex error";
      }
    }
    return tokens;
  }
}

type ASTNode =
  | { kind: "property_lookup"; chain: string[] }
  | { kind: "invoke"; lhs: ASTNode; args: ASTNode[] }
  | { kind: "number"; value: number }
  | { kind: "id"; name: string }
  | { kind: "string"; value: string }
  | { kind: "bool"; value: boolean }
  | { kind: "paren"; expr: ASTNode }
  | { kind: "attr_bag"; attrs: Record<string, ASTNode> }
  | { kind: "assign"; name: string; expr: ASTNode }
  | { kind: "return"; expr: ASTNode }
  | { kind: "continue"; args: ASTNode[] }
  | { kind: "eq"; lhs: ASTNode; rhs: ASTNode }
  | { kind: "plus"; lhs: ASTNode; rhs: ASTNode }
  | { kind: "minus"; lhs: ASTNode; rhs: ASTNode }
  | { kind: "loop"; args: ASTNode[]; body: ASTNode[] }
  | {
      kind: "jsx";
      element: string;
      attrs: Record<string, ASTNode>;
      children: ASTNode[];
    };

class Parser {
  idx = 0;
  constructor(private tokens: Token[]) {}

  scan(...patterns: Token["type"][]): boolean {
    if (patterns.length > this.tokens.length - this.idx) return false;
    let i = this.idx;
    for (let type of patterns) if (this.tokens[i++].type !== type) return false;
    return true;
  }

  consume<T extends Token["type"]>(pattern: T): ExtractTokenType<T> {
    if (this.tokens[this.idx].type !== pattern) {
      console.log("expected", pattern, "got", this.tokens[this.idx].type);
      throw "parse error";
    }
    return this.tokens[this.idx++] as ExtractTokenType<T>;
  }

  try_consume<T extends Token["type"]>(pattern: T): boolean {
    if (this.tokens[this.idx].type !== pattern) return false;
    this.idx++;
    return true;
  }

  parse_property_lookup(): ASTNode {
    let chain = [this.consume("id").name];
    while (this.try_consume("/")) chain.push(this.consume("id").name);
    return { kind: "property_lookup", chain };
  }

  parse_id(): ASTNode {
    let { name } = this.consume("id");
    return { kind: "id", name };
  }

  parse_number(): ASTNode {
    let { value } = this.consume("number");
    return { kind: "number", value };
  }

  private parse_jsx_attributes(
    ...end_tokens: ("/>" | ">" | "]")[]
  ): Record<string, ASTNode> {
    let attrs: Record<string, ASTNode> = {};
    while (!end_tokens.some((t) => this.scan(t))) {
      if (this.scan("{")) {
        this.consume("{");
        let { name } = this.consume("id");
        this.consume("}");
        attrs[name] = { kind: "id", name };
      } else {
        let { name } = this.consume("id");
        if (this.scan("=")) {
          this.consume("=");
          if (this.scan("{")) {
            this.consume("{");
            let expr = this.parse_expr();
            this.consume("}");
            attrs[name] = expr;
          } else {
            if (this.scan("string")) {
              attrs[name] = this.parse_string();
            } else if (this.scan("number")) {
              attrs[name] = this.parse_number();
            }
          }
        } else {
          attrs[name] = { kind: "bool", value: true };
        }
      }
    }
    return attrs;
  }

  parse_jsx(): ASTNode {
    this.consume("<");
    let { name } = this.consume("id");
    let attrs = this.parse_jsx_attributes("/>", ">");
    if (this.scan("/>")) {
      this.consume("/>");
      return { kind: "jsx", element: name, attrs, children: [] };
    } else {
      this.consume(">");
      let children: ASTNode[];
      if (this.scan("{")) {
        this.consume("{");
        children = [this.parse_expr()];
        this.consume("}");
      } else {
        children = [this.parse_jsx()];
      }
      this.consume("</");
      this.consume("id");
      this.consume(">");
      return { kind: "jsx", element: name, attrs, children };
    }
  }

  parse_paren_expr(): ASTNode {
    this.consume("(");
    let expr = this.parse_expr();
    this.consume(")");
    return { kind: "paren", expr };
  }

  parse_string(): ASTNode {
    let { value } = this.consume("string");
    return { kind: "string", value };
  }

  parse_attr_bag(): ASTNode {
    this.consume("#[");
    let attrs = this.parse_jsx_attributes("]");
    this.consume("]");
    return { kind: "attr_bag", attrs };
  }

  parse_assign(): ASTNode {
    let { name } = this.consume("id");
    this.consume(":=");
    let expr = this.parse_expr();
    return { kind: "assign", name, expr };
  }

  parse_return(): ASTNode {
    this.consume("return");
    this.consume("(");
    let expr = this.parse_expr();
    this.consume(")");
    return { kind: "return", expr };
  }

  parse_continue(): ASTNode {
    this.consume("continue");
    this.consume("(");
    let args: ASTNode[] = [];
    while (!this.scan(")")) {
      args.push(this.parse_expr());
      if (this.scan(")")) continue;
      else this.consume(",");
    }
    this.consume(")");
    return { kind: "continue", args };
  }

  parse_true(): ASTNode {
    this.consume("true");
    return { kind: "bool", value: true };
  }

  parse_false(): ASTNode {
    this.consume("false");
    return { kind: "bool", value: false };
  }

  parse_expr_1(): ASTNode {
    if (this.scan("id", "/")) {
      return this.parse_property_lookup();
    } else if (this.scan("number")) {
      return this.parse_number();
    } else if (this.scan("string")) {
      return this.parse_string();
    } else if (this.scan("<", "id")) {
      return this.parse_jsx();
    } else if (this.scan("(")) {
      return this.parse_paren_expr();
    } else if (this.scan("#[")) {
      return this.parse_attr_bag();
    } else if (this.scan("id", ":=")) {
      return this.parse_assign();
    } else if (this.scan("id")) {
      return this.parse_id();
    } else if (this.scan("true")) {
      return this.parse_true();
    } else if (this.scan("false")) {
      return this.parse_false();
    } else if (this.scan("return")) {
      return this.parse_return();
    } else if (this.scan("continue")) {
      return this.parse_continue();
    } else {
      console.log(this.tokens[this.idx], this.tokens[this.idx + 1]);
      throw "parse expr_1 error";
    }
  }

  parse_invoke(lhs: ASTNode): ASTNode {
    this.consume("(");
    if (this.try_consume(")")) {
      return { kind: "invoke", lhs, args: [] };
    } else {
      let args = [this.parse_expr()];
      while (this.try_consume(",")) args.push(this.parse_expr());
      this.consume(")");
      return { kind: "invoke", lhs, args };
    }
  }

  parse_eq(lhs: ASTNode): ASTNode {
    this.consume("=");
    let rhs = this.parse_expr();
    return { kind: "eq", lhs, rhs };
  }

  parse_loop(): ASTNode {
    this.consume("loop");
    let args: ASTNode[] = [];
    this.consume("|");
    while (!this.scan("|")) {
      if (this.scan("id")) {
        args.push(this.parse_id());
      } else {
        args.push(this.parse_assign());
      }
      if (!this.scan("|")) this.consume(",");
    }
    this.consume("|");
    this.consume("{");
    let body = [this.parse_expr()];
    this.consume("}");
    return { kind: "loop", args, body };
  }

  parse_plus(lhs: ASTNode): ASTNode {
    this.consume("+");
    let rhs = this.parse_expr();
    return { kind: "plus", lhs, rhs };
  }

  parse_minus(lhs: ASTNode): ASTNode {
    this.consume("-");
    let rhs = this.parse_expr();
    return { kind: "minus", lhs, rhs };
  }

  parse_expr(): ASTNode {
    if (this.scan("loop")) {
      return this.parse_loop();
    } else {
      let expr = this.parse_expr_1();
      if (this.scan("(")) {
        return this.parse_invoke(expr);
      } else if (this.scan("+")) {
        return this.parse_plus(expr);
      } else if (this.scan("-")) {
        return this.parse_minus(expr);
      } else if (this.scan("=")) {
        return this.parse_eq(expr);
      } else {
        return expr;
      }
    }
  }

  run(): ASTNode[] {
    let ast = [];
    ast.push(this.parse_expr());
    return ast;
  }
}

let program = `
#[data-x="test" {class}]
`;

let tokens = new Lexer(program).run();
// console.log(tokens);
let ast = new Parser(tokens).run();
console.log(ast);
