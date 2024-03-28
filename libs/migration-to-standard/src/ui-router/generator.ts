import {
  getProjects,
  logger,
  readJson,
  Tree,
  visitNotIgnoredFiles,
} from '@nx/devkit';
import { GeneratorSchema } from './schema';
import { readFileSync } from 'fs';
import { exit } from 'process';
import { SourceFile, createSourceFile, ScriptTarget, isClassDeclaration, ClassDeclaration, isDecorator, Decorator, isCallExpression, isObjectLiteralExpression, PropertyAssignment, isIdentifier, Identifier, factory, TransformationResult, transform, TransformerFactory, createPrinter, NewLineKind } from 'typescript';
import { dirname, join, relative } from 'path';
import { migrateHtml, parseHtml, uiRouterAttribute } from './utils/html';
import { uiOnParamsChangedMigration, updateComponentTemplateTransformer } from './utils/typescript';

export async function Generator(tree: Tree, options: GeneratorSchema) {
  const packageJson = readJson(tree, 'package.json');
  const uiRouterPackage = packageJson['dependencies']['@uirouter/angular'];

  if (!uiRouterPackage) {
    logger.error(`No @uirouter/angular detected`);
    return exit(1);
  }

  const projects = getProjects(tree);

  const filesToMigrate = new Map<string, {
    ts: SourceFile, html?: {
      className: string,
      path: string,
      ast: ReturnType<typeof parseHtml>,
      content: string
    }
  }>()


  for (const project of projects.values()) {
    visitNotIgnoredFiles(tree, project.root, (path) => {
      if (!path.endsWith('.ts')) {
        return;
      }

      const fileContent = tree.read(path, 'utf8') || readFileSync(path, 'utf8');
      if (fileContent.includes('@uirouter') || fileContent.includes('@Component')) {
        const currentFile = createSourceFile(path, fileContent, ScriptTarget.ESNext);

        if (fileContent.includes('@Component')) {
          const allClassesInFile = currentFile.statements.filter(s => isClassDeclaration(s)) as ClassDeclaration[];


          allClassesInFile.forEach(async cls => {
            const angularComponent = cls.modifiers?.find(
              m => {
                if (isDecorator(m)
                  && isCallExpression(m.expression)
                  && isIdentifier(m.expression.expression))
                  return m.expression.expression.escapedText === 'Component'
              }
            ) as Decorator;
            // We know is a call Expression but using this for type checking and added protection!
            if (angularComponent && isCallExpression(angularComponent.expression) && isObjectLiteralExpression(angularComponent.expression.arguments[0])) {
              const componentArg = angularComponent?.expression?.arguments[0];

              // As component requires template or templateUrl, we dont they will always be 1 value. Here we need to be careful as template can support function but for now screw that because only edge cases uses this!
              const template = componentArg.properties.filter(p => ['template', 'templateUrl'].includes((p.name as Identifier).escapedText as string))[0] as PropertyAssignment;
              if ((template.name as Identifier).escapedText === 'template') {
                const htmlContent = (template.initializer as Identifier).text;
                if (uiRouterAttribute.some(attribute => htmlContent.includes(attribute))) {
                  filesToMigrate.set(
                    path,
                    {
                      ts: currentFile,
                      html: {
                        className: cls.name!.text,
                        path,
                        ast: parseHtml(htmlContent, path),
                        content: htmlContent
                      }
                    }
                  );
                }
              } else {
                // if it's templateUrl then we need to read the file relative to current file 🤮 but have to be careful because some people use absolute paths!
                const urlPath = (template.initializer as Identifier).text;
                let fullHtmlPath: string;

                // Determine the full path based on whether the URL path is relative or not
                if (urlPath.startsWith('./')) {
                  fullHtmlPath = join(dirname(path), urlPath);
                } else {
                  const htmlPath = relative(path, urlPath);
                  fullHtmlPath = join(dirname(path), htmlPath);
                }
                const htmlContent = tree.read(fullHtmlPath, 'utf8') || readFileSync(fullHtmlPath, 'utf8');

                if (uiRouterAttribute.some(attribute => htmlContent.includes(attribute))) {
                  filesToMigrate.set(
                    path,
                    {
                      ts: currentFile,
                      html: {
                        className: cls.name!.text,
                        path,
                        ast: parseHtml(htmlContent, fullHtmlPath),
                        content: htmlContent
                      }
                    }
                  );
                }

              }
            }
          })

          if (!filesToMigrate.get(path) && fileContent.includes('@uirouter')) {
            filesToMigrate.set(path, { ts: currentFile });
          }
        } else {
          if (fileContent.includes('@uirouter')) {
            filesToMigrate.set(path, { ts: currentFile });
          }
        }
      }
    });
  }

  for (const [filePath, { ts, html }] of filesToMigrate) {
    const transformers: TransformerFactory<any>[] = [
      uiOnParamsChangedMigration,
    ];
    if (html) {
      const result = migrateHtml(html.content, html.ast);
      if (filePath === html.path) {
        // add transformer to update the template
        transformers.push(updateComponentTemplateTransformer(result, html.className));
      } else {
        //  class doesn't use inline template
        tree.write(filePath, result);
      }
    }



    const transformResult: TransformationResult<SourceFile> = transform<SourceFile>(
      ts,
      transformers
    );

    const printer = createPrinter();
    tree.write(filePath, printer.printFile(transformResult.transformed[0]))
  }

}


export default Generator;
