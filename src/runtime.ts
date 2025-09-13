type Signal<T> = [() => T, (v: T) => void];
export function createSignal<T>(initial: T): Signal<T> {
  let value = initial;
  let listeners = new Set<Function>();

  function get(): T {
    if (currentEffect) listeners.add(currentEffect); // track who’s reading
    return value;
  }

  function set(newValue: T) {
    value = newValue;
    for (let fn of listeners) fn(); // re-run effects
  }

  return [get, set];
}

let currentEffect: Function | null = null;
function eff(fn: Function) {
  currentEffect = fn;
  fn(); // run once to register dependencies
  currentEffect = null;
}

let _state: any = {};

let write = {
  state: new Proxy(
    {},
    {
      get(_, name) {
        return (value: any) => {
          if (!_state[name]) {
            let [get, set] = createSignal(value);
            _state[name] = [get, set];
          } else {
            let [_get, set] = _state[name];
            set(value);
          }
        };
      },
    }
  ),
  html: {
    body(html: HTMLElement) {
      document.body.innerHTML = "";
      document.body.append(html);
    },
  },
};

let _events: any = {};

let read = {
  state: new Proxy(
    {},
    {
      get(_, name) {
        let [get, _set] = _state[name];
        return get();
      },
    }
  ),
  html: {
    event: new Proxy(
      {},
      {
        get(_, event_name) {
          return (query: string) => {
            if (_events[event_name]?.[query]) {
              let [get, set] = _events[event_name][query];
              // an event gets triggered
              // trigger all the effects
              // and then null out the event
              // (this will re-run the effects, but probably fine?)
              let value = get();
              if (value) set(null);
              return value;
            } else {
              _events[event_name] ??= {};
              let [get, set] = createSignal(null);
              _events[event_name][query] = [get, set];
              document.addEventListener("click", (e) => {
                if (!(e.target instanceof HTMLElement)) return;
                if (e.target!.matches(query)) set(e);
              });
              return get();
            }
          };
        },
      }
    ),
  },
};
