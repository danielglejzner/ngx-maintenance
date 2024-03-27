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
	PropertyAssignment,
	isPropertyAssignment,
} from 'typescript';

export const updateComponentTemplateTransformer = (html: string, targetClass: string): TransformerFactory<SourceFile> => {
	return (context: TransformationContext): (sourceFile: SourceFile) => SourceFile => {
		return (sourceFile: SourceFile): SourceFile => {
			const visitor: (node: Node) => Node = (node) => {
				if (isClassDeclaration(node) && node.name && node.name.text === targetClass) {
					const modifiers = node.modifiers?.map(decorator => {
						if (isDecorator(decorator) &&
							isCallExpression(decorator.expression) &&
							isIdentifier(decorator.expression.expression) &&
							decorator.expression.expression.text === 'Component') {
							const decoratorArgs = decorator.expression.arguments;
							if (decoratorArgs.length > 0 && isObjectLiteralExpression(decoratorArgs[0])) {
								const objectLiteralExpression = decoratorArgs[0];
								const updatedProperties = objectLiteralExpression.properties.map(property => {
									if (isPropertyAssignment(property) && isIdentifier(property.name) && property.name.text === 'template' ) {
										return factory.updatePropertyAssignment(property, property.name, factory.createStringLiteral(html.replace(/"/g, '')));
									}
									return property;
								});

								const updatedObjectLiteralExpression = factory.updateObjectLiteralExpression(objectLiteralExpression, updatedProperties);
								return factory.updateDecorator(decorator, factory.updateCallExpression(
									decorator.expression,
									decorator.expression.expression,
									decorator.expression.typeArguments,
									[updatedObjectLiteralExpression]
								));
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
						node.members,
					);
				}
				return visitEachChild(node, visitor, context);
			};
			return visitNode(sourceFile, visitor) as SourceFile;
		};
	};
};
