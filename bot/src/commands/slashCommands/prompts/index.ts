import { Command } from 'src/interfaces/Command';
import { randomPrompt } from './randomPrompt/randomPrompt';
import { twoCharPrompt } from './twoCharPrompt/twoCharPrompt';

export const promptCommandList: Command[] = [randomPrompt, twoCharPrompt];
