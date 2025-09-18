eff(() => {
  let total_mines = 9;
  let width = 10;
  let height = 10;
  let mines = repeat(height, repeat(width, false));
  write.state.mines(
    loop(
      (num_mines_left, mines) => {
        if (num_mines_left === 0) {
          return loop.return(mines);
        } else {
          let x = rand_int(width);
          let y = rand_int(height);
          if (get(mines, y, x)) {
            return loop.continue(num_mines_left, mines);
          } else {
            return loop.continue(
              num_mines_left - 1,
              replace(mines, y, replace(get(mines, y), x, true))
            );
          }
        }
      },
      [total_mines, mines]
    )
  );
});
