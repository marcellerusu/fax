import "./style.css";
import { compile } from "./fax";
import { h, write, read, eff } from "./runtime";

let code = compile(`
write/state/on(true)
  
write/html/body(
  <div class="board">
    {"hello from fax"}
  </div>
) when read/state/on = false

write/state/on(false)
`);

eval(code);
