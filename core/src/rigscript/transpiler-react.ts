/**
 * Lord of the Components - RigScript to React Transpiler
 *
 * Converts RigScript AST to React/JSX component code.
 */

import type {
  Program,
  Statement,
  Expression,
  IfStatement,
  ForStatement,
  RenderStatement,
  AssignmentStatement,
  LetStatement,
  CallExpression,
  MemberExpression,
  Identifier,
  Literal,
  BinaryExpression,
  UnaryExpression,
  TernaryExpression,
  ArrayExpression,
  ObjectExpression,
} from './types.js';

import { isBuiltin, transformToReact } from './builtins.js';

// =============================================================================
// TYPES
// =============================================================================

export interface TranspilerOptions {
  componentName?: string;
  typescript?: boolean;
  styled?: boolean; // Use styled-components
}

// =============================================================================
// TRANSPILER
// =============================================================================

export class ReactTranspiler {
  private indent: number = 0;
  private options: TranspilerOptions;
  private imports: Set<string> = new Set();
  private hooks: Set<string> = new Set();

  constructor(options: TranspilerOptions = {}) {
    this.options = {
      componentName: 'Component',
      typescript: true,
      styled: false,
      ...options,
    };
  }

  /**
   * Transpile RigScript AST to React component
   */
  transpile(program: Program): string {
    this.indent = 0;
    this.imports = new Set();
    this.hooks = new Set();

    // Generate component body
    const body = this.transpileStatements(program.body);

    // Generate imports
    const importStatements = this.generateImports();

    // Generate props interface
    const propsInterface = this.options.typescript
      ? this.generatePropsInterface()
      : '';

    // Generate component
    const componentDef = this.generateComponent(body);

    return [
      importStatements,
      '',
      propsInterface,
      '',
      componentDef,
    ].filter(Boolean).join('\n');
  }

  // ===========================================================================
  // IMPORTS
  // ===========================================================================

  private generateImports(): string {
    const lines: string[] = [];

    // React import
    const reactImports = ['FC'];
    if (this.hooks.has('useState')) reactImports.push('useState');
    if (this.hooks.has('useEffect')) reactImports.push('useEffect');
    if (this.hooks.has('useMemo')) reactImports.push('useMemo');
    lines.push(`import React, { ${reactImports.join(', ')} } from 'react';`);

    // Additional imports
    for (const imp of this.imports) {
      lines.push(imp);
    }

    return lines.join('\n');
  }

  // ===========================================================================
  // COMPONENT
  // ===========================================================================

  private generatePropsInterface(): string {
    const name = this.options.componentName;
    return `interface ${name}Props {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}`;
  }

  private generateComponent(body: string): string {
    const name = this.options.componentName;
    const propsType = this.options.typescript ? `: FC<${name}Props>` : '';

    return `export const ${name}${propsType} = (props) => {
  const { children, className, ...rest } = props;

  return (
${body}
  );
};

${name}.displayName = '${name}';`;
  }

  // ===========================================================================
  // STATEMENTS
  // ===========================================================================

  private transpileStatements(statements: Statement[]): string {
    return statements.map(stmt => this.transpileStatement(stmt)).join('\n');
  }

  private transpileStatement(stmt: Statement): string {
    switch (stmt.type) {
      case 'LetStatement':
        return this.transpileLet(stmt as LetStatement);
      case 'IfStatement':
        return this.transpileIf(stmt as IfStatement);
      case 'ForStatement':
        return this.transpileFor(stmt as ForStatement);
      case 'RenderStatement':
        return this.transpileRender(stmt as RenderStatement);
      case 'AssignmentStatement':
        return this.transpileAssignment(stmt as AssignmentStatement);
      case 'ExpressionStatement':
        return this.indented(this.transpileExpression((stmt as any).expression));
      default:
        return `// Unknown statement: ${(stmt as any).type}`;
    }
  }

  private transpileLet(stmt: LetStatement): string {
    const value = this.transpileExpression(stmt.value);
    return this.indented(`const ${stmt.name} = ${value};`);
  }

  private transpileIf(stmt: IfStatement): string {
    const condition = this.transpileExpression(stmt.condition);
    this.indent++;
    const thenBody = this.transpileStatements(stmt.then);
    this.indent--;

    if (stmt.else) {
      this.indent++;
      const elseBody = this.transpileStatements(stmt.else);
      this.indent--;
      return this.indented(`{${condition} ? (\n${thenBody}\n${this.pad()}) : (\n${elseBody}\n${this.pad()})}`);
    }

    return this.indented(`{${condition} && (\n${thenBody}\n${this.pad()})}`);
  }

  private transpileFor(stmt: ForStatement): string {
    const iterator = stmt.variable;
    const indexVar = stmt.index || 'index';
    const iterable = this.transpileExpression(stmt.iterable);
    this.indent++;
    const body = this.transpileStatements(stmt.body);
    this.indent--;

    return this.indented(`{${iterable}.map((${iterator}, ${indexVar}) => (\n${body}\n${this.pad()}))}`);
  }

  private transpileRender(stmt: RenderStatement): string {
    switch (stmt.method) {
      case 'element':
        return this.transpileRenderElement(stmt);
      case 'component':
        return this.transpileRenderComponent(stmt);
      case 'slot':
        return this.transpileRenderSlot(stmt);
      case 'text':
        return this.transpileRenderText(stmt);
      case 'html':
        return this.transpileRenderHtml(stmt);
      default:
        return `// Unknown render method: ${stmt.method}`;
    }
  }

  private transpileRenderElement(stmt: RenderStatement): string {
    const tagArg = stmt.args[0];
    const tag = tagArg?.type === 'Literal' ? String(tagArg.value) : 'div';
    const attrs = this.transpileRenderAttrs(stmt.children);

    if (stmt.children && stmt.children.length > 0) {
      const bodyContent = stmt.children.filter((s: Statement) => s.type !== 'AssignmentStatement');
      if (bodyContent.length > 0) {
        this.indent++;
        const children = this.transpileStatements(bodyContent);
        this.indent--;
        return this.indented(`<${tag}${attrs}>\n${children}\n${this.pad()}</${tag}>`);
      }
    }

    return this.indented(`<${tag}${attrs} />`);
  }

  private transpileRenderComponent(stmt: RenderStatement): string {
    const componentArg = stmt.args[0];
    const componentName = this.toPascalCase(
      componentArg?.type === 'Literal' ? String(componentArg.value) : 'Component'
    );
    this.imports.add(`import { ${componentName} } from './${componentName}';`);

    const attrs = this.transpileRenderAttrs(stmt.children);

    if (stmt.children && stmt.children.length > 0) {
      const bodyContent = stmt.children.filter((s: Statement) => s.type !== 'AssignmentStatement');
      if (bodyContent.length > 0) {
        this.indent++;
        const children = this.transpileStatements(bodyContent);
        this.indent--;
        return this.indented(`<${componentName}${attrs}>\n${children}\n${this.pad()}</${componentName}>`);
      }
    }

    return this.indented(`<${componentName}${attrs} />`);
  }

  private transpileRenderSlot(stmt: RenderStatement): string {
    const slotArg = stmt.args[0];
    const slotName = slotArg?.type === 'Literal' ? String(slotArg.value) : 'default';
    if (slotName === 'default') {
      return this.indented('{children}');
    }
    return this.indented(`{props.${slotName}}`);
  }

  private transpileRenderText(stmt: RenderStatement): string {
    const textArg = stmt.args[0];
    if (textArg) {
      const text = this.transpileExpression(textArg);
      return this.indented(`{${text}}`);
    }
    return '';
  }

  private transpileRenderHtml(stmt: RenderStatement): string {
    const htmlArg = stmt.args[0];
    if (htmlArg) {
      const html = this.transpileExpression(htmlArg);
      return this.indented(`<div dangerouslySetInnerHTML={{ __html: ${html} }} />`);
    }
    return '';
  }

  private transpileRenderAttrs(children: Statement[] | null): string {
    if (!children) return '';

    const attrs: string[] = [];

    for (const stmt of children) {
      if (stmt.type === 'AssignmentStatement') {
        const assign = stmt as AssignmentStatement;
        const target = assign.target;

        // Handle attrs.xxx assignments
        if (target.type === 'MemberExpression') {
          const member = target as MemberExpression;
          if (member.object.type === 'Identifier' &&
              (member.object as Identifier).name === 'attrs') {
            const propName = (member.property as Identifier).name;
            const value = this.transpileExpression(assign.value);

            // Special handling for class attribute
            if (propName === 'class' || propName === 'className') {
              attrs.push(`className={${value}}`);
            } else if (propName === 'for') {
              attrs.push(`htmlFor={${value}}`);
            } else {
              // Convert kebab-case to camelCase for React
              const reactProp = this.toCamelCase(propName);
              attrs.push(`${reactProp}={${value}}`);
            }
          }
        }
      }
    }

    if (attrs.length === 0) return '';
    return ' ' + attrs.join(' ');
  }

  private transpileAssignment(stmt: AssignmentStatement): string {
    const target = this.transpileExpression(stmt.target);
    const value = this.transpileExpression(stmt.value);
    return this.indented(`const ${target} = ${value};`);
  }

  // ===========================================================================
  // EXPRESSIONS
  // ===========================================================================

  private transpileExpression(expr: Expression): string {
    switch (expr.type) {
      case 'Identifier':
        return this.transpileIdentifier(expr as Identifier);
      case 'Literal':
        return this.transpileLiteral(expr as Literal);
      case 'MemberExpression':
        return this.transpileMember(expr as MemberExpression);
      case 'CallExpression':
        return this.transpileCall(expr as CallExpression);
      case 'BinaryExpression':
        return this.transpileBinary(expr as BinaryExpression);
      case 'UnaryExpression':
        return this.transpileUnary(expr as UnaryExpression);
      case 'TernaryExpression':
        return this.transpileTernary(expr as TernaryExpression);
      case 'ArrayExpression':
        return this.transpileArray(expr as ArrayExpression);
      case 'ObjectExpression':
        return this.transpileObject(expr as ObjectExpression);
      default:
        return `/* Unknown expression: ${(expr as any).type} */`;
    }
  }

  private transpileIdentifier(expr: Identifier): string {
    const name = expr.name;

    // Map RigScript keywords to React equivalents
    if (name === 'props') return 'props';
    if (name === 'true') return 'true';
    if (name === 'false') return 'false';
    if (name === 'null') return 'null';

    return name;
  }

  private transpileLiteral(expr: Literal): string {
    if (typeof expr.value === 'string') {
      return `"${expr.value.replace(/"/g, '\\"')}"`;
    }
    return String(expr.value);
  }

  private transpileMember(expr: MemberExpression): string {
    const object = this.transpileExpression(expr.object);
    const property = expr.computed
      ? `[${this.transpileExpression(expr.property)}]`
      : `.${(expr.property as Identifier).name}`;

    return `${object}${property}`;
  }

  private transpileCall(expr: CallExpression): string {
    // Check if this is a builtin function call
    if (expr.callee.type === 'Identifier') {
      const funcName = expr.callee.name;
      if (isBuiltin(funcName)) {
        const args = expr.arguments.map(arg => this.transpileExpression(arg));
        const result = transformToReact(funcName, args);
        if (result !== null) {
          return result;
        }
      }
    }

    // Default: regular function call
    const callee = this.transpileExpression(expr.callee);
    const args = expr.arguments.map(arg => this.transpileExpression(arg)).join(', ');
    return `${callee}(${args})`;
  }

  private transpileBinary(expr: BinaryExpression): string {
    const left = this.transpileExpression(expr.left);
    const right = this.transpileExpression(expr.right);
    let operator: string = expr.operator;

    // Map operators
    if (operator === 'and') operator = '&&';
    if (operator === 'or') operator = '||';
    if (operator === '==') operator = '===';
    if (operator === '!=') operator = '!==';

    return `(${left} ${operator} ${right})`;
  }

  private transpileUnary(expr: UnaryExpression): string {
    const operand = this.transpileExpression(expr.argument);
    let operator: string = expr.operator;

    if (operator === 'not') operator = '!';

    return `${operator}${operand}`;
  }

  private transpileTernary(expr: TernaryExpression): string {
    const condition = this.transpileExpression(expr.condition);
    const consequent = this.transpileExpression(expr.consequent);
    const alternate = this.transpileExpression(expr.alternate);
    return `(${condition} ? ${consequent} : ${alternate})`;
  }

  private transpileArray(expr: ArrayExpression): string {
    const elements = expr.elements.map(e => this.transpileExpression(e)).join(', ');
    return `[${elements}]`;
  }

  private transpileObject(expr: ObjectExpression): string {
    const properties = expr.properties
      .map(p => `${p.key}: ${this.transpileExpression(p.value)}`)
      .join(', ');
    return `{ ${properties} }`;
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  private indented(text: string): string {
    return this.pad() + text;
  }

  private pad(): string {
    return '    '.repeat(this.indent);
  }

  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}

// =============================================================================
// HELPER FUNCTION
// =============================================================================

/**
 * Compile RigScript AST to React component
 */
export function compileToReact(
  ast: Program,
  options: TranspilerOptions = {}
): string {
  const transpiler = new ReactTranspiler(options);
  return transpiler.transpile(ast);
}
