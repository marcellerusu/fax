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

export function h(
  element: string,
  attrs: Record<string, any>,
  children: any[]
): HTMLElement {
  let elem = document.createElement(element);
  for (let key in attrs) elem.setAttribute(key, attrs[key]);
  elem.append(...children);
  return elem;
}

let currentEffect: Function | null = null;
export function eff(fn: Function) {
  currentEffect = fn;
  fn(); // run once to register dependencies
  currentEffect = null;
}

let _state: any = {};

export let write = {
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
  ) as Record<string, Function>,
  html: {
    body(html: HTMLElement) {
      document.body.innerHTML = "";
      document.body.append(html);
    },
  },
};

let _events: any = {};

export let read = {
  state: new Proxy(
    {},
    {
      get(_, name) {
        let [get, _set] = _state[name];
        return get();
      },
    }
  ),
  local_storage(key: string) {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  },
  html: {
    event: new Proxy(
      {},
      {
        get(_, event_name: string) {
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
              let [get, set] = createSignal<Event | null>(null);
              _events[event_name][query] = [get, set];
              document.addEventListener(event_name, (e) => {
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

export function repeat<T>(count: number, value: T): T[] {
  return Array.from({ length: count }, (_) => value);
}

export function replace(array: any[], idx: number, value: any) {
  let out = [];
  for (let i = 0; i < array.length; i++) {
    if (idx === i) {
      out[i] = value;
    } else {
      out[i] = array[i];
    }
  }
  return out;
}

export function loop(f: any, starting: any) {
  let result = f(...starting);
  while (result.kind === "continue") {
    result = f(...result.args);
  }
  if (result.kind !== "return") throw "invalid loop result";
  return result.value;
}
loop.return = function (value: any) {
  return { kind: "return", value };
};
loop.continue = function (...args: any) {
  return { kind: "continue", args };
};

export function get(array: any[], ...path: number[]) {
  let result = array;
  for (let idx of path) result = result[idx];
  return result;
}
