import * as ts from "typescript";

const kinds = ts.SyntaxKind;

export function showAST(node: ts.Node, parent: ts.Node | null = null) {
  if (!node || !parent) return;
  console.log("\x1b[33m%s\x1b[0m", parent && parent.getText());
  console.log(node.getText());
  console.log("\x1b[36m%s\x1b[0m", kinds[node.kind], "\n");
  node.getChildren().forEach((child) => showAST(child, node));
}
