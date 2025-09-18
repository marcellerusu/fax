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
write/state/width(10)
write/state/height(10)
write/state/total-mines(10)

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
  total-mines := read/state/total-mines,
  width := read/state/width,
  height := read/state/height
end

write/html/body(<div class="board" />)
write/html/append(".board", repeat(height, <div class="row" />))
  when height := read/state/height
write/html/append(".row", repeat(width, <div class="cell" />))
  when width := read/state/width
`);

eval(code);
