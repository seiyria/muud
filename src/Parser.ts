import { Command } from './Command';
import { Env, LexemeTransform, Validator } from './fntypes';


export class Parser {

  private commands: Record<string, Command> = {};
  private env: Env = {};
  private validators: Record<string, Validator> = {};
  private lexemeTransforms: LexemeTransform[] = [];

  public addCommand(name: string): Command {
    if(this.commands[name]) throw new Error(`You already have a command named ${name}.`);

    const command = new Command();
    this.commands[name] = command;
    return command;
  }

  public addValidator(name: string, validator: Validator): void {
    this.validators[name] = validator;
  }

  public addLexemeTransform(logic: LexemeTransform): void {
    this.lexemeTransforms.push(logic);
  }

  public setEnv(prop: string, value: any): void {
    this.env[prop] = value;
  }

  private cleanInput(input: string): string {

    // server shell sends extra junk
    input = input.replace('\r\n', '\n');

    // remove trailing newline
    if (input.slice(-1) === '\n') {
      input = input.slice(0, input.length - 1);
    }

    // remove redundant spaces
    while (input.indexOf('  ') !== -1) {
      input = input.replace('  ', ' ');
    }

    return input;
  }

  public async parse(input: string, scopedEnv?: Env): Promise<string | string[]> {
    input = this.cleanInput(input);

    const lexemes = input.split(' ');
    const result = await this.parseLexemes(lexemes, scopedEnv);

    return result.flat();
  }

  private async parseLexemes(lexemes: string[], scopedEnv?: Env): Promise<string[]> {

    const mergedEnv = Object.assign({}, this.env, scopedEnv || {});

    const output = [];

    // cycle through plugins
    for (const index in this.lexemeTransforms) {
      lexemes = this.lexemeTransforms[index](lexemes, mergedEnv);
    }

    // cycle through commands looking for syntax match
    const validCommands = this.validCommands(lexemes);
    for (const index in validCommands) {

      const command = validCommands[index];

      const result = await command.try(this.validators, mergedEnv, lexemes, false);

      if (result) {
        output.push(result);
        return output;
      }
    }

    return output;
  }

  private validCommands(lexemes: string[]): Command[] {

    const commands = [];

    // cycle through commands looking for syntax match
    for (const index in this.commands) {

      const command = this.commands[index];

      // we clone lexemes because if the last syntax lexeme has a wildcard the
      // submitted lexeme corresponding to the last syntax lexeme ends up
      // getting subsequent submitted lexemes added to it
      if (command.try(this.validators, this.env, this.clone(lexemes), true)) {
        commands.push(command);
      }
    }

    return commands;
  }

  private clone(obj): typeof obj {
    const newObj = (obj instanceof Array) ? [] : {};

    for (const i in obj) {
      if (i == 'clone') continue;
      if (obj[i] && typeof obj[i] === 'object') {
        newObj[i] = this.clone(obj[i]);
      } else {
        newObj[i] = obj[i];
      }
    } 

    return newObj;
  }

}
