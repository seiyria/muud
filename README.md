# muud

A simple upgrade to [mingy](https://github.com/mcantelon/node-mingy) to support command aliases, promise, and array returns. For basic usage, you can see that repository.

It also strips out almost everything but Parsers and Validators. No Shell, no web server, no clients.

##  Install

`npm i muud`

## Differences From Mingy

There are a few, mostly syntactical:

* `args` and `env` are no longer passed in separately to the `logic` functions. You can find them as a single object on the `logic` function now. 
* You can return any value from the parser `logic` function, not just strings.
* `logic` functions can now be `async`.
* `logic` functions now _always_ return an array. You can return multiple messages back to the user in order this way, without any hacky workarounds.
* `Command#set()` has been split out into `setSyntax` and `setLogic`.
* You can pass an `Env` into `Parser#parse` to set a scoped `Env` for that specific run of the parser.
* You can now have multiple prefix aliases when setting command syntax, to avoid redundancy: `setSyntax(['go', 'travel'], '<string:direction>')`. This would expand into `go <string:direction>` and `travel <string:direction>`.

## Usage
```ts

import { Parser } from 'muud';

const parser = new Parser();

parser.setEnv('test', 1);

parser.addCommand('hello')
  .setSyntax(['hello'])
  .setLogic(async () => {
    return 'Hello!';
  });

parser.addCommand('go')
  .setSyntax(['go <string:direction>', 'go2 <string:direction>'])
  .setLogic(async ({ args }) => {
    return ['Went', args.direction];
  });

parser.addCommand('zoop')
  .setSyntax(['zoop1', 'zoop2'], 'suffix')
  .setLogic(async ({ env }) => {
    return ['zoop', env.test];
  });

const res1 = await parser.parse('hello');
console.log(res1);  // ['Hello!']

const res2 = await parser.parse('hello2');
console.log(res2);  // ['Hello2!', 'Yo!', 1]

const res3 = await parser.parse('go2 north');
console.log(res3);  // ['Went', 'north']

const res4 = await parser.parse('zoop1 suffix');
console.log(res4);  // ['zoop', 1]

const res5 = await parser.parse('zoop1 suffix', { test: 2 });
console.log(res5);  // ['zoop', 2]
```

# Contributing

Feel free to contribute features by sending a pull request.
