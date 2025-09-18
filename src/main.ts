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

// eff(() => {
//   let width = read.local_storage("width");
//   let height = read.local_storage("height");
//   let total_mines = read.local_storage("total-mines");
//   let mines = repeat(height, repeat(width, false));
//   write.state.mines(
//     loop(
//       (num_mines_left: any, mines: any) => {
//         if (num_mines_left === 0) {
//           return loop.return(mines);
//         } else {
//           let x = rand_int(width);
//           let y = rand_int(height);
//           if (mines[y][x]) {
//             return loop.continue(num_mines_left, mines);
//           } else {
//             return loop.continue(
//               num_mines_left - 1,
//               replace(mines, y, replace(mines[y], x, true))
//             );
//           }
//         }
//       },
//       [total_mines, mines]
//     )
//   );
// });

// write/state/mines(loop |num-mines-left := total-mines, mines| {
//   if num-mines-left = 0 then
//     return(mines)
//   else
//     x := rand-int(width),
//     y := rand-int(height),
//     if get(mines, y, x) then
//       continue(num-mines-left, mines)
//     else
//       continue(
//         num-mines-left - 1,
//         replace(mines, y, replace(get(mines, y), x, true))
//       )
//     end
//   end
// }) when
//   total-mines := read/local-storage("total-mines"),
//   mines := repeat(height, repeat(width, false)),
//   width := read/local-storage("width"),
//   height := read/local-storage("height")
// end

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
  total-mines := 9,
  width := 10,
  height := 10,
  mines := repeat(height, repeat(width, false))
end

write/html/body(repeat(len(mines), <div class="cell" />))
  when mines := read/state/mines

`);

eval(code);
