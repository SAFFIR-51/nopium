// Node 24 runtime API; @types/node in this project targets Node 20.
declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): {
      get(...params: (string | number)[]): Record<string, unknown> | undefined;
      all(...params: (string | number)[]): Record<string, unknown>[];
      run(...params: (string | number)[]): unknown;
    };
  }
}
