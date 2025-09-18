import "./style.css";
import { compile } from "./fax";
import { h, write, read, eff, repeat, replace, loop } from "./runtime";

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
//     if mines[y][x] then
//       continue(num-mines-left, mines)
//     else
//       continue(
//         num-mines-left - 1,
//         replace(mines, y, replace(mines[y], x, true))
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
write/state/count(loop |count := 0| {
  if count = 10 then
    return(count)
  else
    continue(count + 1)
  end
})

write/html/body(
  <div>
    <button class="minus">{"-"}</button>
    {count}
    <button class="plus">{"+"}</button>
  </div>
) when count := read/state/count

write/state/count(count + 1) when
  read/html/event/mousedown(".plus"),
  count := read/state/count
end

write/state/count(count - 1) when
  read/html/event/mousedown(".minus"),
  count := read/state/count
end
`);

eval(code);
