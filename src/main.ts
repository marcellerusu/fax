import "./style.css";
import { compile } from "./fax";
import { h, write, read, eff } from "./runtime";

let code = compile(`
write/state/count(0)
  
write/html/body(<div class="count">{count}</div>) when
  count := read/state/count

write/state/count(count + 1) when
  read/html/event/click(".count"),
  count := read/state/count
`);

eval(code);
