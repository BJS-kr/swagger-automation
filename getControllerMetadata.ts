import { readFileSync } from "fs";
import * as ts from "typescript";

const sourceFile = ts.createSourceFile(
  "file.ts",
  readFileSync("./test.ts").toString(),
  ts.ScriptTarget.Latest,
  true
);

function getControllerPath(node: ts.ClassDeclaration) {
  const decorator = ts.getDecorators(node);
  if (decorator) {
    const expression = decorator[0].expression;
    if (ts.isCallExpression(expression)) {
      const argument = expression.arguments[0];
      if (ts.isStringLiteral(argument)) {
        return argument.text;
      }
    }
  }
}

function getControllerMethods(node: ts.ClassDeclaration) {
  const methods = new Map();

  node.forEachChild((child) => {
    if (ts.isMethodDeclaration(child) && hasMethodDecorator(child)) {
      const method = {
        name: child.name?.getText(),
        path: getMethodPath(child),
        parameters: getMethodParameters(child),
        httpMethod: getHttpMethod(child),
        returnType: getReturnType(child),
      };

      methods.set(method.name, method);
    }
  });

  return methods;
}

function getReturnType(node: ts.MethodDeclaration) {
  const returnType = node.type?.getText() || "unknown";
  return {
    returnType,
    isPrimitive:
      returnType === "string" ||
      returnType === "number" ||
      returnType === "boolean" ||
      returnType === "symbol",
  };
}

function hasMethodDecorator(node: ts.MethodDeclaration) {
  const decorator = ts.getDecorators(node);
  if (decorator)
    return (
      decorator.some((decorator) => {
        const expression = decorator.expression;
        return (
          ts.isCallExpression(expression) &&
          ts.isIdentifier(expression.expression) &&
          (expression.expression.text === "Get" ||
            expression.expression.text === "Post" ||
            expression.expression.text === "Put" ||
            expression.expression.text === "Patch" ||
            expression.expression.text === "Delete")
        );
      }) ?? false
    );

  return false;
}

function getHttpMethod(node: ts.MethodDeclaration) {
  const decorator = ts.getDecorators(node);
  if (decorator) {
    const expression = decorator[0].expression;
    if (ts.isCallExpression(expression)) {
      const identifier = expression.expression;
      if (ts.isIdentifier(identifier)) {
        return identifier.text;
      }
    }
  }
}

function getMethodPath(node: ts.MethodDeclaration) {
  const decorator = ts.getDecorators(node);
  if (decorator) {
    const expression = decorator[0].expression;
    if (ts.isCallExpression(expression)) {
      const argument = expression.arguments[0];
      if (argument && ts.isStringLiteral(argument)) {
        return argument.text;
      }
    }
  }
}

function getMethodParameters(node: ts.MethodDeclaration) {
  const parameters = new Map();

  node.forEachChild((child) => {
    if (ts.isParameter(child) && hasParameterDecorator(child)) {
      const type = getParameterType(child) || "unknown";

      const parameter = {
        name: child.name?.getText(),
        type,
        isPrimitive:
          type === "string" ||
          type === "number" ||
          type === "boolean" ||
          type === "symbol",
      };

      parameters.set(parameter.name, parameter);
    }
  });

  return parameters;
}

function hasParameterDecorator(node: ts.ParameterDeclaration) {
  const decorator = ts.getDecorators(node);
  if (decorator)
    return (
      decorator.some((decorator) => {
        const expression = decorator.expression;
        return (
          ts.isCallExpression(expression) &&
          ts.isIdentifier(expression.expression) &&
          (expression.expression.text === "Body" ||
            expression.expression.text === "Query" ||
            expression.expression.text === "Param")
        );
      }) ?? false
    );

  return false;
}

function getParameterType(node: ts.ParameterDeclaration) {
  const type = node.type;
  if (type) {
    return type.getText();
  }
}

function getControllerMetadata(node: ts.Node): any {
  if (ts.isClassDeclaration(node) && hasControllerDecorator(node)) {
    const controller = {
      name: node.name?.getText(),
      path: getControllerPath(node),
      methods: getControllerMethods(node),
    };

    return controller;
  }

  return ts.forEachChild(node, getControllerMetadata);
}

function hasControllerDecorator(node: ts.ClassDeclaration): boolean {
  const decorator = ts.getDecorators(node);
  if (decorator)
    return (
      decorator.some((decorator) => {
        const expression = decorator.expression;
        return (
          ts.isCallExpression(expression) &&
          ts.isIdentifier(expression.expression) &&
          expression.expression.text === "Controller"
        );
      }) ?? false
    );

  return false;
}

console.dir(getControllerMetadata(sourceFile), { depth: null });
