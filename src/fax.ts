type Token =
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
  | { type: "if" }
  | { type: "else" }
  | { type: "end" }
  | { type: "true" }
  | { type: "false" }
  | { type: "num"; value: number }
  | { type: "id"; name: string }
  | { type: "string"; value: string };

type ExtractTokenType<Type extends Token["type"]> = Type extends "num"
  ? { type: "num"; value: number }
  : Type extends "id"
  ? { type: "id"; name: string }
  : Type extends "string"
  ? { type: "string"; value: string }
  : never;

class Lexer {
  #idx = 0;
  #match: string | null = null;
  constructor(private program: string) {}

  #test(pattern: string | RegExp): boolean {
    if (typeof pattern === "string") {
      if (this.program.slice(this.#idx).startsWith(pattern)) {
        this.#idx += pattern.length;
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

  run() {
    let tokens: Token[] = [];
    while (this.#idx < this.program.length) {
      if (this.#test(/\s+/)) {
        continue;
      } else if (this.#test("|")) {
        tokens.push({ type: "|" });
      } else if (this.#test("(")) {
        tokens.push({ type: "(" });
      } else if (this.#test(")")) {
        tokens.push({ type: ")" });
      } else if (this.#test("/>")) {
        tokens.push({ type: "/>" });
      } else if (this.#test("/")) {
        tokens.push({ type: "/" });
      } else if (this.#test("</")) {
        tokens.push({ type: "</" });
      } else if (this.#test("<")) {
        tokens.push({ type: "<" });
      } else if (this.#test(">")) {
        tokens.push({ type: ">" });
      } else if (this.#test("[")) {
        tokens.push({ type: "[" });
      } else if (this.#test("]")) {
        tokens.push({ type: "]" });
      } else if (this.#test("{")) {
        tokens.push({ type: "{" });
      } else if (this.#test("}")) {
        tokens.push({ type: "}" });
      } else if (this.#test("..")) {
        tokens.push({ type: ".." });
      } else if (this.#test(":=")) {
        tokens.push({ type: ":=" });
      } else if (this.#test("=")) {
        tokens.push({ type: "=" });
      } else if (this.#test(",")) {
        tokens.push({ type: "," });
      } else if (this.#test(".")) {
        tokens.push({ type: "." });
      } else if (this.#test(":")) {
        tokens.push({ type: ":" });
      } else if (this.#test("loop")) {
        tokens.push({ type: "loop" });
      } else if (this.#test("return")) {
        tokens.push({ type: "return" });
      } else if (this.#test("continue")) {
        tokens.push({ type: "continue" });
      } else if (this.#test("when")) {
        tokens.push({ type: "when" });
      } else if (this.#test("if")) {
        tokens.push({ type: "if" });
      } else if (this.#test("else")) {
        tokens.push({ type: "else" });
      } else if (this.#test("end")) {
        tokens.push({ type: "end" });
      } else if (this.#test("true")) {
        tokens.push({ type: "true" });
      } else if (this.#test("false")) {
        tokens.push({ type: "false" });
      } else if (this.#test(/\d+/)) {
        tokens.push({ type: "num", value: Number(this.#match) });
      } else if (this.#test(/(\w|-)+/)) {
        tokens.push({ type: "id", name: this.#match! });
      } else if (this.#test("+")) {
        tokens.push({ type: "+" });
      } else if (this.#test(/".*"/)) {
        tokens.push({ type: "string", value: this.#match!.slice(1, -1) });
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
  | { kind: "string"; value: string }
  | { kind: "range"; lhs: ASTNode; rhs: ASTNode }
  | { kind: "paren"; expr: ASTNode }
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

  parse_expr_1(): ASTNode {
    if (this.scan("id", "/")) {
      return this.parse_property_lookup();
    } else if (this.scan("num")) {
      return this.parse_number();
    } else if (this.scan("<", "id")) {
      return this.parse_jsx();
    } else if (this.scan("(")) {
      return this.parse_paren_expr();
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

  parse_expr(): ASTNode {
    let expr = this.parse_expr_1();
    if (this.scan("(")) {
      return this.parse_invoke(expr);
    } else if (this.scan("..")) {
      return this.parse_range(expr);
    } else {
      return expr;
    }
  }
  run(): ASTNode[] {
    return [this.parse_expr()];
  }
}

let program = `
0..10
`;

let tokens = new Lexer(program).run();
let ast = new Parser(tokens).run();

console.log(ast);
