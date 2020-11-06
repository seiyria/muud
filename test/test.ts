

import { Parser } from '../src/Parser';

const parser = new Parser();

parser.setEnv('test', 1);

parser.addCommand('hello')
  .setSyntax(['hello'])
  .setLogic(async () => {
    return 'Hello!';
  });

parser.addCommand('hello2')
  .setSyntax(['hello2'])
  .setLogic(async ({ env }) => {
    return ['Hello2!', 'Yo!', env.test];
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

(async () => {
  const res0 = await parser.parse('test');
  console.log(res0);

  const res1 = await parser.parse('hello');
  console.log(res1);

  const res2 = await parser.parse('hello2');
  console.log(res2);

  const res3 = await parser.parse('go2 north');
  console.log(res3);

  const res4 = await parser.parse('zoop1 suffix');
  console.log(res4);

  const res5 = await parser.parse('zoop1 suffix', { test: 2 });
  console.log(res5);
})();