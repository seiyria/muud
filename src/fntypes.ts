
export type Env = Record<string, any>;

export type ParserLogicFunction = ({ env: Env, args: any }) => Promise<string | string[]>;

export type Validator = (lexeme: string, env: Env) => { success: boolean, value?: any, message?: string };

export type LexemeTransform = (lexemes: string[], env: Env) => string[];