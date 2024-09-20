import * as fs from 'fs';
import * as path from 'path';
const pluralize = require('pluralize');

const urlTemplates = `C:/Users/rc/Desktop/project test/scripter/generator/template`

// entrada esperada "warehouseItems"

interface Templates {
  controller: string;
  module: string;
  service: string;
  entity: string;
  dto: string;
}

interface typeName {
  kebab: string,
  className: string,
  instanceName: string
}

function camelToKebab(str: string) {
  console.log(str)
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

function processTemplate(template: string, entityName: string, entityNamePascal: string, entityNameKebab: string): string {
  return template.replace(/\{\$name\}/g, entityName).replace(/\{\$nameM\}/g, entityNamePascal).replace(/\{\$nameKebab\}/g, entityNameKebab);
}

function modifyModule(mainPath: string, entityNamePascal: string, entityNameKebab: string): void {
  try {

    const files = fs.readdirSync(mainPath);
    const moduleFile = files.find(file => file.endsWith('.module.ts'));
    if (!moduleFile) {
      throw new Error('No se encontró ningún archivo que termine con .module.ts en el directorio de salida.');
    }

    const moduleFilePath = path.join(outputPath, moduleFile);

    let content = fs.readFileSync(moduleFilePath, 'utf8');

    const firstImportIndex = content.lastIndexOf('import ');

    if (firstImportIndex === -1) {
      throw new Error('No se encontró ningún import dentro del archivo de módulo.');
    }

    const firstimportStatement = `import { ${entityNamePascal}Module } from './${entityNameKebab}/${entityNameKebab}.module';\n`;
    content = content.slice(0, firstImportIndex) + firstimportStatement + content.slice(firstImportIndex);

    fs.writeFileSync(moduleFilePath, content);

    const importsStartIndex = content.indexOf('imports: [') + 'imports: ['.length;
    const importsEndIndex = content.indexOf(']', importsStartIndex);

    if (importsStartIndex === -1 || importsEndIndex === -1) {
      throw new Error('No se encontró la sección de imports en el archivo de módulo.');
    }

    const importStatement = `\t\t${entityNamePascal}Module,\n`;
    content = content.slice(0, importsEndIndex) + importStatement + content.slice(importsEndIndex);

    fs.writeFileSync(moduleFilePath, content);

    console.log(`Se ha modificado ${moduleFile} para importar ${entityNamePascal}Module al final de los imports.`);

  } catch (error) {
    console.error('Error al modificar el archivo de módulo:', error);
  }
}

function generateFiles(mainPath: string, entityName: string): void {
  const pluralWord: string = pluralize.plural(entityName);
  const names: typeName = {
    className: `${pluralWord.slice(0, 1).toUpperCase()}${pluralWord.slice(1)}`,
    instanceName: pluralWord,
    // kebab: pluralWord
    kebab: camelToKebab(pluralWord)
  }
  console.log("names", names)

  // console.log("kebabCase(pluralWord, false) ",kebabCase(pluralWord, false) )
  const outputPath = path.join(mainPath, names.kebab);
  fs.mkdirSync(outputPath, { recursive: true });

  const templates: Templates = {
    controller: fs.readFileSync(path.join(urlTemplates, 'controller.template.hbs'), 'utf8'),
    module: fs.readFileSync(path.join(urlTemplates, 'module.template.hbs'), 'utf8'),
    service: fs.readFileSync(path.join(urlTemplates, 'service.template.hbs'), 'utf8'),
    entity: fs.readFileSync(path.join(urlTemplates, 'entity.template.hbs'), 'utf8'),
    dto: fs.readFileSync(path.join(urlTemplates, 'dto.template.hbs'), 'utf8'),
  };

  const files = {
    controller: `${names.kebab}.controller.ts`,
    module: `${names.kebab}.module.ts`,
    service: `${names.kebab}.service.ts`,
    entity: `${names.kebab}.entity.ts`,
    dto: `${names.kebab}.dto.ts`,
  };

  const entityFolder = path.join(outputPath, 'entity');
  fs.mkdirSync(entityFolder, { recursive: true });

  fs.writeFileSync(path.join(outputPath, files.controller), processTemplate(templates.controller, names.instanceName, names.className, names.kebab));
  fs.writeFileSync(path.join(outputPath, files.module), processTemplate(templates.module, names.instanceName, names.className, names.kebab));
  fs.writeFileSync(path.join(outputPath, files.service), processTemplate(templates.service, names.instanceName, names.className, names.kebab));
  fs.writeFileSync(path.join(entityFolder, files.entity), processTemplate(templates.entity, names.instanceName, names.className, names.kebab));
  fs.writeFileSync(path.join(entityFolder, files.dto), processTemplate(templates.dto, names.instanceName, names.className, names.kebab));


  console.log(`Files generated at ${outputPath}:
  - ${files.controller}
  - ${files.module}
  - ${files.service}
  - ${files.entity}
  - ${files.dto}
  `)

  modifyModule(mainPath, names.className, names.kebab)
}

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: ts-node generate-entity-files.ts <outputPath> <entityName>');
  process.exit(1);
}




const [outputPath, entityName] = args;
generateFiles(outputPath, entityName);

// cd Desktop/project\ test/scripter/generator/
// ts-node generator-nest-entities "C:/Users/rc/Desktop/project test/nest/generic_result-nest/src/main"



// C:\Users\rc\Desktop\project test\nest\generic_result-nest\src\main