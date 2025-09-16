type Span = { start: number; end: number };

type Token = (
  | { type: "/" }
  | { type: "(" }
  | { type: ")" }
  | { type: "{" }
  | { type: "}" }
  | { type: "[" }
  | { type: "]" }
  | { type: "|" }
  | { type: "<" }
  | { type: ">" }
  | { type: "/>" }
  | { type: "</" }
  | { type: ".." }
  | { type: ":=" }
  | { type: "=" }
  | { type: "+" }
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
  | { type: "num"; value: number }
  | { type: "id"; name: string }
  | { type: "string"; value: string }
) & { span: Span };

type ExtractTokenType<Type extends Token["type"]> = Type extends "num"
  ? { type: "num"; value: number; span: Span }
  : Type extends "id"
  ? { type: "id"; name: string; span: Span }
  : Type extends "string"
  ? { type: "string"; value: string; span: Span }
  : { type: Type; span: Span };

class Lexer {
  #idx = 0;
  #match: string | null = null;
  constructor(private program: string) {}

  #test(pattern: string | RegExp): boolean {
    if (typeof pattern === "string") {
      if (this.program.slice(this.#idx).startsWith(pattern)) {
        this.#idx += pattern.length;
        this.#match = pattern;
        return true;
      } else {
        return false;
      }
    } else {
      let result = this.program.slice(this.#idx).match(pattern);
      if (!result || result.index !== 0) return false;
      this.#match = result[0];
      this.#idx += this.#match.length;
      return true;
    }
  }

  span() {
    return { start: this.#idx - this.#match!.length, end: this.#idx };
  }

  run() {
    let tokens: Token[] = [];
    while (this.#idx < this.program.length) {
      if (this.#test(/\s+/)) {
        continue;
      } else if (this.#test("|")) {
        tokens.push({ type: "|", span: this.span() });
      } else if (this.#test("(")) {
        tokens.push({ type: "(", span: this.span() });
      } else if (this.#test(")")) {
        tokens.push({ type: ")", span: this.span() });
      } else if (this.#test("/>")) {
        tokens.push({ type: "/>", span: this.span() });
      } else if (this.#test("/")) {
        tokens.push({ type: "/", span: this.span() });
      } else if (this.#test("</")) {
        tokens.push({ type: "</", span: this.span() });
      } else if (this.#test("<")) {
        tokens.push({ type: "<", span: this.span() });
      } else if (this.#test(">")) {
        tokens.push({ type: ">", span: this.span() });
      } else if (this.#test("[")) {
        tokens.push({ type: "[", span: this.span() });
      } else if (this.#test("]")) {
        tokens.push({ type: "]", span: this.span() });
      } else if (this.#test("{")) {
        tokens.push({ type: "{", span: this.span() });
      } else if (this.#test("}")) {
        tokens.push({ type: "}", span: this.span() });
      } else if (this.#test("..")) {
        tokens.push({ type: "..", span: this.span() });
      } else if (this.#test(":=")) {
        tokens.push({ type: ":=", span: this.span() });
      } else if (this.#test("=")) {
        tokens.push({ type: "=", span: this.span() });
      } else if (this.#test(",")) {
        tokens.push({ type: ",", span: this.span() });
      } else if (this.#test(".")) {
        tokens.push({ type: ".", span: this.span() });
      } else if (this.#test(":")) {
        tokens.push({ type: ":", span: this.span() });
      } else if (this.#test("loop")) {
        tokens.push({ type: "loop", span: this.span() });
      } else if (this.#test("return")) {
        tokens.push({ type: "return", span: this.span() });
      } else if (this.#test("continue")) {
        tokens.push({ type: "continue", span: this.span() });
      } else if (this.#test("starting-with")) {
        tokens.push({ type: "starting-with", span: this.span() });
      } else if (this.#test("when")) {
        tokens.push({ type: "when", span: this.span() });
      } else if (this.#test("if")) {
        tokens.push({ type: "if", span: this.span() });
      } else if (this.#test("else")) {
        tokens.push({ type: "else", span: this.span() });
      } else if (this.#test("end")) {
        tokens.push({ type: "end", span: this.span() });
      } else if (this.#test("true")) {
        tokens.push({ type: "true", span: this.span() });
      } else if (this.#test("false")) {
        tokens.push({ type: "false", span: this.span() });
      } else if (this.#test(/\d+/)) {
        tokens.push({
          type: "num",
          value: Number(this.#match),
          span: this.span(),
        });
      } else if (this.#test(/(\w|-)+/)) {
        tokens.push({ type: "id", name: this.#match!, span: this.span() });
      } else if (this.#test("+")) {
        tokens.push({ type: "+", span: this.span() });
      } else if (this.#test(/"(\\.|[^"\\])*"/)) {
        tokens.push({
          type: "string",
          value: this.#match!.slice(1, -1),
          span: this.span(),
        });
      } else {
        console.log(this.program.slice(this.#idx));
        throw "lex error";
      }
    }
    return tokens;
  }
}

type ASTNode =
  | {
      kind: "property_lookup";
      chain: string[];
    }
  | { kind: "invoke"; lhs: ASTNode; args: ASTNode[] }
  | { kind: "number"; value: number }
  | { kind: "id"; name: string }
  | { kind: "string"; value: string }
  | { kind: "range"; lhs: ASTNode; rhs: ASTNode }
  | { kind: "paren"; expr: ASTNode }
  | { kind: "record"; entries: [ASTNode, ASTNode][] }
  | { kind: "array_literal"; elements: ASTNode[] }
  | { kind: "assign"; name: string; expr: ASTNode }
  | { kind: "return"; expr: ASTNode }
  | { kind: "continue-with-previous-args" }
  | { kind: "continue"; args: ASTNode[] }
  | { kind: "eq"; lhs: ASTNode; rhs: ASTNode }
  | { kind: "loop"; args: string[]; body: ASTNode[]; starting_with: ASTNode }
  | JSXNode;

type JSXNode = {
  kind: "jsx";
  element: string;
  attrs: Record<string, ASTNode>;
  children: JSXNode[];
};

class Parser {
  #idx = 0;
  constructor(private tokens: Token[]) {}

  scan(...patterns: Token["type"][]): boolean {
    if (patterns.length > this.tokens.length - this.#idx) return false;
    let i = this.#idx;
    for (let type of patterns) if (this.tokens[i++].type !== type) return false;
    return true;
  }

  consume<T extends Token["type"]>(pattern: T): ExtractTokenType<T> {
    if (this.tokens[this.#idx].type !== pattern) {
      console.log("expected", pattern, "got", this.tokens[this.#idx].type);
      throw "parse error";
    }
    return this.tokens[this.#idx++] as ExtractTokenType<T>;
  }

  try_consume<T extends Token["type"]>(pattern: T): boolean {
    if (this.tokens[this.#idx].type !== pattern) return false;
    this.#idx++;
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
    let { value } = this.consume("num");
    return { kind: "number", value };
  }

  parse_jsx(): JSXNode {
    this.consume("<");
    let { name } = this.consume("id");

    let attrs: Record<string, ASTNode> = {};
    while (!this.scan("/>")) {
      let { name } = this.consume("id");
      this.consume("=");
      let { value } = this.consume("string");
      attrs[name] = { kind: "string", value };
    }

    this.consume("/>");
    return { kind: "jsx", element: name, attrs, children: [] };
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

  parse_record(): ASTNode {
    let entries: [ASTNode, ASTNode][] = [];
    this.consume("{");
    while (!this.scan("}")) {
      let left: ASTNode, right: ASTNode;
      if (this.scan("id")) {
        left = this.parse_id();
      } else if (this.scan("string")) {
        left = this.parse_string();
      } else {
        throw "unsupported record key";
      }
      this.consume(":");
      right = this.parse_expr();
      entries.push([left, right]);
      if (this.scan("}")) continue;
      else this.consume(",");
    }
    this.consume("}");
    return { kind: "record", entries };
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
    if (this.scan("..")) {
      this.consume("..");
      this.consume(")");
      return { kind: "continue-with-previous-args" };
    } else {
      let args: ASTNode[] = [];
      while (!this.scan(")")) {
        args.push(this.parse_expr());
        if (this.scan(")")) continue;
        else this.consume(",");
      }
      this.consume(")");
      return { kind: "continue", args };
    }
  }

  parse_array_literal(): ASTNode {
    let elements: ASTNode[] = [];
    this.consume("[");
    while (!this.scan("]")) {
      elements.push(this.parse_expr());
      if (this.scan("]")) continue;
      else this.consume(",");
    }
    this.consume("]");
    return { kind: "array_literal", elements };
  }

  parse_expr_1(): ASTNode {
    if (this.scan("id", "/")) {
      return this.parse_property_lookup();
    } else if (this.scan("num")) {
      return this.parse_number();
    } else if (this.scan("string")) {
      return this.parse_string();
    } else if (this.scan("<", "id")) {
      return this.parse_jsx();
    } else if (this.scan("(")) {
      return this.parse_paren_expr();
    } else if (this.scan("{")) {
      return this.parse_record();
    } else if (this.scan("[")) {
      return this.parse_array_literal();
    } else if (this.scan("id", ":=")) {
      return this.parse_assign();
    } else if (this.scan("id")) {
      return this.parse_id();
    } else if (this.scan("return")) {
      return this.parse_return();
    } else if (this.scan("continue")) {
      return this.parse_continue();
    } else {
      console.log(this.tokens[this.#idx], this.tokens[this.#idx + 1]);
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

  parse_range(lhs: ASTNode): ASTNode {
    this.consume("..");
    let rhs = this.parse_expr();
    return { kind: "range", lhs, rhs };
  }

  parse_eq(lhs: ASTNode): ASTNode {
    this.consume("=");
    let rhs = this.parse_expr();
    return { kind: "eq", lhs, rhs };
  }

  parse_loop(): ASTNode {
    this.consume("loop");
    let args: string[] = [];
    this.consume("|");
    while (!this.scan("|")) {
      let { name } = this.consume("id");
      args.push(name);
      if (!this.scan("|")) this.consume(",");
    }
    this.consume("|");
    this.consume("{");
    let body = [this.parse_expr()];
    this.consume("}");
    this.consume("starting-with");
    let starting_with = this.parse_array_literal();
    return { kind: "loop", args, body, starting_with };
  }

  parse_expr(): ASTNode {
    if (this.scan("loop")) {
      return this.parse_loop();
    } else {
      let expr = this.parse_expr_1();
      if (this.scan("(")) {
        return this.parse_invoke(expr);
      } else if (this.scan("..")) {
        return this.parse_range(expr);
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
loop |num-mines-left, mines| {
  return(10)
} starting-with [1, 2]
`;

let tokens = new Lexer(program).run();
// console.log(tokens);
let ast = new Parser(tokens).run();
console.log(ast);
