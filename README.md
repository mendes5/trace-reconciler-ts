# Todo
 - [x] Be able to keep context between invocations
 - [x] Build a "trace object" in the first run, and update it in follow up calls
 - [x] Use the trace object to properly call destructors or to skip destructors for memoized code-paths. 
 - [x] Cleanup/dispose system for inactive branches 
 - [x] Memo plugin
 - [x] Support async generators
 - [ ] Support sync generators
 - [x] Custom yield handlers via plugins
 - [x] Ref plugin
 - [x] Use plugin
 - [x] Keyed for iterators
 - [ ] React integration
 - [ ] TypeScript

# Generator styles:

```js
var createBuffer = r(function*() {
  const buffer = device.createBuffer();

  yield buffer;

  buffer.destroy();
});

var createBuffer = r(function*() {
  try {
    const buffer = device.createBuffer();
    yield  buffer;
  } finally {
    this.return.destroy();
  }
});

var createBuffer = r(function*() {
  try {
    while (true) {
      const buffer = device.createBuffer();
      yield  buffer;
    }
  } finally {
    this.return.destroy();
  }
});

var createBuffer = r(function*() {
  try {
    const buffer = device.createBuffer();
    while (true) {
      yield buffer;
      buffer.update();
    }
  } finally {
    this.return.destroy();
  }
});

```