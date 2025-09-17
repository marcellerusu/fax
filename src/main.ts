import "./style.css";
import { compile } from "./fax";
import { h, write, read, eff } from "./runtime";

let code = compile(`
write/html/body(
  <div class="board">
    {"hello from fax"}
  </div>
)
`);

eval(code);
