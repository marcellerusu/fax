import "./style.css";
import { compile } from "./fax";
import {
  h,
  write,
  read,
  eff,
  repeat,
  replace,
  loop,
  get,
  rand_int,
  len,
} from "./runtime";

let code = compile(`
write/state/mines(loop |num-mines-left := total-mines, mines| {
  if num-mines-left = 0 then
    return(mines)
  else
    x := rand-int(width),
    y := rand-int(height),
    if get(mines, y, x) then
      continue(num-mines-left, mines)
    else
      continue(
        num-mines-left - 1,
        replace(mines, y, replace(get(mines, y), x, true))
      )
    end
  end
}) when
  mines := repeat(height, repeat(width, false)),
  total-mines := 9,
  width := 10,
  height := 10
end

write/html/body(repeat(len(mines), <div class="cell" />))
  when mines := read/state/mines
`);

eval(code);
