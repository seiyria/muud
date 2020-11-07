import { Env, Validator } from './Parser';

export type ParserLogicFunction = ({ env, args }: { env?: Env, args?: any }) => Promise<string | string[]>;

export class Command {

  private syntax: string[];
  private logic: ParserLogicFunction;

  private caseSensitive = false;

  private trimArgDelimiters(arg: string): string {
    return arg.slice(1, arg.length - 1);
  }

  public setSyntax(prefixesOrSyntaxes: string[], syntax?: string): Command {
    if(syntax) {
      prefixesOrSyntaxes = prefixesOrSyntaxes.map(p => `${p} ${syntax}`);
    }

    this.syntax = prefixesOrSyntaxes;
    return this;
  }

  public setLogic(logic: ParserLogicFunction): Command {
    this.logic = logic;
    return this;
  }

  // if test mode is true, return true if lexemes will trigger this command
  // if test mode is falsey, execute command logic
  public async try(
    validators: Record<string, Validator>, 
    env: Env, 
    lexemes: string[], 
    testMode = false
  ): Promise<string | string[] | boolean> {

    if(!this.syntax) return false;

    // try each syntax form
    for(const index in this.syntax) {

      const syntaxLexemes = this.syntax[index].split(' ');

      // test submitted lexemes against this syntax
      let valid = this.trySyntaxKeywords(syntaxLexemes, lexemes);
      let result;

      // valid syntax pattern found... now see arg lexemes are proper
      if (valid) {

        // if the last syntax lexeme ends with an *, amalgamate execess
        // submitted lexemes to the submitted lexemes at the same
        // position as the last syntax lexeme
        const lastSyntaxLexemeIndex = syntaxLexemes.length - 1;
        if (syntaxLexemes[lastSyntaxLexemeIndex].match(/\*>$/)) {

          lexemes[lastSyntaxLexemeIndex] =
            lexemes
              .slice(lastSyntaxLexemeIndex, lexemes.length)
              .join(' ');
        }

        // see if the arguments given to the command are valid
        result = this.determineCommandArguments(validators, env, syntaxLexemes, lexemes);
        if (result.success === false) {
          if (result.message) {
            return result.message;
          }

          valid = false;
        }
      }

      if (valid) {

        // a bunch of condition stuff goes here

        if (testMode) {
          return true;
        }

        // do eval
        return await this.logic({ env, args: result.args });
      }
    }
  }

  private determineCommandArguments(
    validators: Record<string, Validator>, 
    env: Env, 
    syntaxLexemes: string[], 
    inputLexemes: string[]
  ): { success: boolean, message?: string, args?: any } {

    let lexemeToTest = 0;

    let lexemes = inputLexemes;

    let referenceData;
    let referenceType;
    let referenceName;

    let success = true;
    const args = {};

    for (const index in syntaxLexemes) {

      const lexeme = syntaxLexemes[index];

      if (lexeme[0] === '<') {

        // determine reference type
        referenceData = this.trimArgDelimiters(lexeme).split(':');
        referenceType = referenceData[0];

        // trim "<" and ">" from reference to determine reference type
        referenceName = (referenceData[1])
          ? referenceData[1]
          : referenceType;

        // if there's a validator, use it to test lexeme
        if (validators[referenceType]) {

          // need to return an object with success, value, and message
          // success determines whether validation was successful
          // value allows transformation of the lexeme
          // message allows a message to be passed back???
          const result = validators[referenceType](lexemes[lexemeToTest], env);
          if (result.success) {
            args[referenceName] = (result.value ===  undefined)
              ? lexemes[lexemeToTest]
              : result.value;
          
            } else {
            // if error is set to a string this message will be returned to the user
            if (result.message) {
              return { success: false, message: result.message };
            }
          }

        } else {

          if (referenceData.length === 1 || typeof lexemes[lexemeToTest] === referenceType) {
            args[referenceName] = lexemes[lexemeToTest];

          } else {
            // if error is simply true a generic error message will be returned to the user
            success = false;
          }
        }
      }

      lexemeToTest += 1;
    }

    return {
      success, 
      args
    };
  }

  private trySyntaxKeywords(syntaxLexemes: string[], submittedLexemes: string[]): boolean {

    let valid = true;
    let lexemeToTest = 0;
    let secondToLast = '';
    let index;

    for (index in syntaxLexemes) {

      let syntaxLexeme    = syntaxLexemes[index];
      let submittedLexeme = submittedLexemes[lexemeToTest];

      if (!this.caseSensitive) {
        syntaxLexeme    = (typeof syntaxLexeme === 'string')
          ? syntaxLexeme.toLowerCase()
          : syntaxLexeme;
        submittedLexeme = (typeof submittedLexeme === 'string')
          ? submittedLexeme.toLowerCase()
          : submittedLexeme;
      }

      // if lexeme doesn't reference an object, test as a keyword
      if (syntaxLexeme[0] !== '<' && (syntaxLexeme !== submittedLexeme)) {
        valid = false;
      }

      lexemeToTest++;
    }

    secondToLast = syntaxLexemes[index][(syntaxLexemes[index].length - 2)];

    // if final syntax lexeme didn't end with a * character and length of syntax
    // vs submitted is different then invalid
    if (secondToLast !== '*' && syntaxLexemes.length !== submittedLexemes.length) {
      valid = false;
    }

    return valid;
  }

}