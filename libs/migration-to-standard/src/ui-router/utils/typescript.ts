import {
  Node,
  TransformerFactory,
  TransformationContext,
  SourceFile,
  visitNode,
  visitEachChild,
  isClassDeclaration,
  isDecorator,
  isCallExpression,
  isObjectLiteralExpression,
  isIdentifier,
  factory,
  isPropertyAssignment,
  isImportDeclaration,
  isStringLiteral,
  isMethodDeclaration,
  isConstructorDeclaration,
  ConstructorDeclaration,
  SyntaxKind,
  isSourceFile,
  NamedImports
} from 'typescript';

export const updateComponentTemplateTransformer = (
  html: string,
  targetClass: string
): TransformerFactory<SourceFile> => {
  return (
    context: TransformationContext
  ): ((sourceFile: SourceFile) => SourceFile) => {
    return (sourceFile: SourceFile): SourceFile => {
      const visitor: (node: Node) => Node = (node) => {
        if (
          isClassDeclaration(node) &&
          node.name &&
          node.name.text === targetClass
        ) {
          const modifiers = node.modifiers?.map((decorator) => {
            if (
              isDecorator(decorator) &&
              isCallExpression(decorator.expression) &&
              isIdentifier(decorator.expression.expression) &&
              decorator.expression.expression.text === 'Component'
            ) {
              const decoratorArgs = decorator.expression.arguments;
              if (
                decoratorArgs.length > 0 &&
                isObjectLiteralExpression(decoratorArgs[0])
              ) {
                const objectLiteralExpression = decoratorArgs[0];
                const updatedProperties =
                  objectLiteralExpression.properties.map((property) => {
                    if (
                      isPropertyAssignment(property) &&
                      isIdentifier(property.name) &&
                      property.name.text === 'template'
                    ) {
                      return factory.updatePropertyAssignment(
                        property,
                        property.name,
                        factory.createStringLiteral(html.replace(/"/g, ''))
                      );
                    }
                    return property;
                  });

                const updatedObjectLiteralExpression =
                  factory.updateObjectLiteralExpression(
                    objectLiteralExpression,
                    updatedProperties
                  );
                return factory.updateDecorator(
                  decorator,
                  factory.updateCallExpression(
                    decorator.expression,
                    decorator.expression.expression,
                    decorator.expression.typeArguments,
                    [updatedObjectLiteralExpression]
                  )
                );
              }
            }
            return decorator;
          });

          return factory.updateClassDeclaration(
            node,
            modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            node.members
          );
        }
        return visitEachChild(node, visitor, context);
      };
      return visitNode(sourceFile, visitor) as SourceFile;
    };
  };
};

export const uiOnParamsChangedMigration: TransformerFactory<Node> = (
  context
) => {
  const visitor = (node: Node): Node => {
    if (isSourceFile(node)) {
      let shouldAddImport = false;

      const checkVisitor = (childNode: Node): Node => {
        if (isClassDeclaration(childNode)) {
          const uiOnParamsChanged = childNode.members.find(
            (mem) =>
              isMethodDeclaration(mem) &&
              isIdentifier(mem.name) &&
              mem.name.escapedText === 'uiOnParamsChanged'
          );

          if (uiOnParamsChanged) {
            let constructor = childNode.members.find((mem) =>
              isConstructorDeclaration(mem)
            ) as ConstructorDeclaration;
            if (constructor) {
              const newParam = factory.createParameterDeclaration(
                [factory.createModifier(SyntaxKind.PrivateKeyword)],
                undefined,
                'activatedRoute',
                undefined,
                factory.createTypeReferenceNode('ActivatedRoute', []),
                undefined
              );

              constructor = factory.updateConstructorDeclaration(
                constructor,
                constructor.modifiers,
                [...constructor.parameters, newParam],
                constructor.body
              );

              const updatedMembers = childNode.members.map((mem) =>
                isConstructorDeclaration(mem) ? constructor : mem
              );
              return factory.updateClassDeclaration(
                childNode,
                childNode.modifiers,
                childNode.name,
                childNode.typeParameters,
                childNode.heritageClauses,
                updatedMembers
              );
            }
            shouldAddImport = true;
          }
        }
        return visitEachChild(childNode, checkVisitor, context);
      };

      node = visitEachChild(node, checkVisitor, context);

      if (shouldAddImport && isSourceFile(node)) {
        let foundImport = false;
        const updatedStatements = node.statements.map((stmt) => {
          if (
            isImportDeclaration(stmt) &&
            isStringLiteral(stmt.moduleSpecifier) &&
            stmt.moduleSpecifier.text === '@angular/router'
          ) {
            foundImport = true;
            const alreadyImported =
              (stmt.importClause?.namedBindings as NamedImports)?.elements.some(
                (element) => element.name.text === 'ActivatedRoute'
              );

			  if (!alreadyImported) {
				const updatedImportSpecifier = factory.createImportSpecifier(undefined, factory.createIdentifier('ActivatedRoute'));
  
				return factory.updateImportDeclaration(
				  stmt,
				  stmt.modifiers,
				  factory.updateImportClause(
					stmt.importClause,
					stmt.importClause?.isTypeOnly || false,
					stmt.importClause?.name,
					factory.updateNamedImports(
					  stmt.importClause.namedBindings,
					  [...stmt.importClause.namedBindings.elements, updatedImportSpecifier]
					)
				  ),
				  stmt.moduleSpecifier,
				  undefined // attributes parameter, currently not utilized for ECMAScript imports
				);
			  }
          }
          return stmt;
        });

        // If no import for '@angular/router' found, add a new import declaration
        if (!foundImport) {
          const newImportDeclaration = factory.createImportDeclaration(
            undefined,
            undefined,
            factory.createImportClause(
              false,
              undefined,
              factory.createNamedImports([
                factory.createImportSpecifier(
                  false,
                  undefined,
                  factory.createIdentifier('ActivatedRoute')
                ),
              ])
            ),
            factory.createStringLiteral('@angular/router')
          );
          updatedStatements.unshift(newImportDeclaration); // Add to the top
        }

        return factory.updateSourceFile(node, updatedStatements);
      }
    }

    return visitEachChild(node, visitor, context);
  };

  return (rootNode) => visitNode(rootNode, visitor);
};
