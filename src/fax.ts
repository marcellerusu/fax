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
      } else if (this.#test("/")) {
        tokens.push({ type: "/" });
      } else if (this.#test("|")) {
        tokens.push({ type: "|" });
      } else if (this.#test("(")) {
        tokens.push({ type: "(" });
      } else if (this.#test(")")) {
        tokens.push({ type: ")" });
      } else if (this.#test("<")) {
        tokens.push({ type: "<" });
      } else if (this.#test(">")) {
        tokens.push({ type: ">" });
      } else if (this.#test("/>")) {
        tokens.push({ type: "/>" });
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
  | { kind: "number"; value: number };

class Parser {
  #idx = 0;
  constructor(private tokens: Token[]) {}

  scan(...patterns: Token["type"][]): boolean {
    let i = this.#idx;
    for (let type of patterns) if (this.tokens[i++].type !== type) return false;
    return true;
  }

  consume<T extends Token["type"]>(pattern: T): ExtractTokenType<T> {
    if (this.tokens[this.#idx].type !== pattern) throw "parse error";
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

  parse_expr_1(): ASTNode {
    if (this.scan("id", "/")) {
      return this.parse_property_lookup();
    } else if (this.scan("num")) {
      return this.parse_number();
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

  parse_expr(): ASTNode {
    let expr = this.parse_expr_1();
    if (this.scan("(")) {
      return this.parse_invoke(expr);
    } else {
      return expr;
    }
  }
  run(): ASTNode[] {
    return [this.parse_expr()];
  }
}

let program = `write/local-storage("width", 10) when read/local-storage("width", nil)
write/local-storage("height", 10) when read/local-storage("height", nil)
write/local-storage("total-mines", 9) when read/local-storage("height", nil)

write/state/mines(loop |num-mines-left, mines| {
  if num-mines-left = 0
    return(mines)
  else
    x := rand-int(width),
    y := rand-int(height),
    if mines[y][x] then
      continue(..)
    else 
      continue(
        num-mines-left - 1,
        [ ..mines | [y] = [ ..mines[y] | [x] = true ] ]
      )
    end
  end
} starting-with [
  read/local-storage("total-mines"),
  (0..height).fill((0..width).fill(false))
]) when
  width := read/local-storage("width"),
  height := read/local-storage("height")
end

write/html/body(<div class="board" />)
write/html/append(.board, (0..10).fill(<span class="row" />))
write/html/append(.row, (0..10).fill(<div class="cell" />))

write/html/attr(
  .row:nth-child(y) .cell:nth-child(x),
  { "data-x": x, "data-y": y, class/mine: read/state/mines[y][x] }
)

write/html/attr(.cell[data-x={x}][data-y={y}], { "data-count": count }) when
  count := read/html/len(
    .cell[data-x={(x - 1)..(x + 1)}][data-y={(y - 1)..(y + 1)}].mine:not(
      [data-x={x}][data-y={y}]
    )
  )
end

write/html/append(.cell, <Flag />)
write/html/append(.cell.mine, <Mine />)
write/html/append(.cell[data-count={count}], <Number {count} />) when count > 0

assert_eq(read/html/len(.cell.mine), read/local-storage("total-mines"),
  "num of mines must always equal settings"
)

write/html/class/add(.cell[data-x={xs}][data-y={ys}]:not(.open), "open"),
write/html/event/expand(
  .cell[data-x={xs}][data-y={ys}]:not(.open, [data-x={x}][data-y={y}])
) when
  xs := (x - 1)..(x + 1),
  ys := (y - 1)..(y + 1),
  read/html/event/(click|expand)(.cell[data-x={x}][data-y={y}][data-count={count}]),
  read/html/len(.cell[data-x={xs}][data-y={ys}].flagged) = count
end

write/html/class/add(.cell[data-x={x}][data-y={y}], "open") when  
  read/html/event/click(.cell[data-x={x}][data-y={y}]:not(.open))
end
`;

let tokens = new Lexer(program).run();
// let ast = new Parser(tokens).run();

console.log(tokens);
