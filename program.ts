import * as ts from "typescript";
import { showAST } from "./showAST";

const program = ts.createProgram(["./test.ts"] as const, {
  target: ts.ScriptTarget.ES2015,
  module: ts.ModuleKind.CommonJS,
  strict: true,
  noImplicitAny: true,
  noImplicitThis: true,
  noImplicitReturns: true,
  noFallthroughCasesInSwitch: true,
  noUnusedLocals: true,
  noUnusedParameters: true,
  noImplicitUseStrict: true,
  noEmitOnError: true,
  noEmit: true,
  strictNullChecks: true,
  strictFunctionTypes: true,
  strictPropertyInitialization: true,
  noImplicitOverride: true,
  noPropertyAccessFromIndexSignature: true,
  experimentalDecorators: true,
  emitDecoratorMetadata: true,
  allowJs: true,
  checkJs: true,
  allowSyntheticDefaultImports: true,
  esModuleInterop: true,
});

program
  .getSourceFiles()
  .filter((sourceFile) => !sourceFile.fileName.includes(".d.ts"))
  .forEach((sourceFile, i) => {
    console.log(i, "번째 파일");
    showAST(sourceFile);
  });
