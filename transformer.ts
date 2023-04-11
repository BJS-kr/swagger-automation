import { readFileSync } from "fs";
import * as ts from "typescript";

const sourceFile = ts.createSourceFile(
  "file.ts",
  readFileSync("./test.ts").toString(),
  ts.ScriptTarget.Latest,
  true
);

const kinds = ts.SyntaxKind;

function getComment(
  propertyName: string,
  node: ts.Node,
  typeStore: Map<any, any>,
  isJSDoc: boolean
) {
  ts.forEachLeadingCommentRange(sourceFile.getText(), node.pos, (pos, end) => {
    const JSDocTag = ts.getJSDocTags(node)[0];
    const comment = isJSDoc
      ? {
          isJSDoc: true,
          tag: JSDocTag.tagName.escapedText,
          comment: JSDocTag.comment,
        }
      : {
          isDoubleSlash: true,
          comment: sourceFile
            .getText()
            .substring(pos, end)
            .split("//")[1]
            .trim(),
        };

    typeStore.get(propertyName).comment = comment;
  });
}

function getType(typeStore: Map<any, any>, sourceFile: ts.SourceFile) {
  return (child: ts.Node) => {
    if (!ts.isMethodDeclaration(child) && !ts.isMethodSignature(child)) {
      const firstChild = child.getChildAt(0);
      const isJSDoc = ts.isJSDoc(firstChild);
      const propertyName = child.getChildAt(isJSDoc ? 1 : 0).getText();
      const type = getNestedType(sourceFile, child.getChildAt(isJSDoc ? 3 : 2));

      typeStore.set(propertyName, {
        type,
        comment: null,
      });

      getComment(propertyName, child, typeStore, isJSDoc);
    }
  };
}

function getNestedType(
  sourceFile: ts.SourceFile,
  typeNode: ts.Node,
  types = new Map()
) {
  if (ts.isTypeLiteralNode(typeNode)) {
    typeNode.forEachChild(getType(types, sourceFile));

    return { isTypeLiteral: true, type: types };
  }
  if (ts.isTypeReferenceNode(typeNode)) {
    return { isTypeReference: true, type: typeNode.typeName.getText() };
  }
  return { isPrimitive: true, type: typeNode.getText() };
}

const propertyMap = new Map();
export function collectTypeMetadata(node: ts.Node): any {
  if (ts.isTypeAliasDeclaration(node)) {
    propertyMap.set(node.name.getText(), {
      isTypeAlias: true,
      type: getNestedType(sourceFile, node.type),
    });
  }

  if (
    (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) &&
    node.name
  ) {
    const declName = node.name.getText();
    propertyMap.set(declName, new Map());
    node.members.forEach(getType(propertyMap.get(declName), sourceFile));
  }

  ts.forEachChild(node, collectTypeMetadata);
}

collectTypeMetadata(sourceFile);
console.dir(propertyMap, { depth: null });
