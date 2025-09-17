import "./style.css";
import { compile } from "./fax";
import { h, write, read, eff } from "./runtime";

let code = compile(`
write/state/count(0)
  
write/html/body(
  <div>
    <button class="minus">{"+"}</button>
    {count}
    <button class="plus">{"+"}</button>
  </div>) when count := read/state/count

write/state/count(count + 1) when
  read/html/event/click(".plus"),
  count := read/state/count

write/state/count(count - 1) when
  read/html/event/click(".minus"),
  count := read/state/count
`);

eval(code);
