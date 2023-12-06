import { Command } from 'src/interfaces/Command';
import { hello } from './random/hello/handler';
import { help } from './help/help';
import { RandomOCGenerator } from './oc_generator/randomOCGenerator';
import { react } from './react';
import { promptCommandList } from './prompts';
import addrole from './addRole';

export const CommandList: Command[] = [
  ...promptCommandList,
  hello,
  help,
  react,
  RandomOCGenerator,
  addrole,
];
