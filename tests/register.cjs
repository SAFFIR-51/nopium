const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript');
const original = Module._resolveFilename;
Module._resolveFilename = function(name, parent, ...rest) { return original.call(this, name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : name, parent, ...rest); };
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, file);
