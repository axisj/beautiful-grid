import type React from 'react';

const keywords = new Set([
  'as',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'interface',
  'let',
  'new',
  'of',
  'return',
  'switch',
  'throw',
  'try',
  'type',
  'typeof',
  'var',
  'while',
  'with',
  'yield',
]);

const literals = new Set(['false', 'null', 'true', 'undefined']);

type TokenKind =
  | 'comment'
  | 'function'
  | 'keyword'
  | 'literal'
  | 'number'
  | 'property'
  | 'punctuation'
  | 'string'
  | 'tag';

const makeToken = (kind: TokenKind, value: string, index: number): React.ReactNode => (
  <span className={`source-token source-token-${kind}`} key={`${index}-${kind}`}>
    {value}
  </span>
);

const readQuotedValue = (source: string, start: number) => {
  const quote = source[start];
  let index = start + 1;

  while (index < source.length) {
    if (source[index] === '\\') {
      index += 2;
      continue;
    }
    if (source[index] === quote) return index + 1;
    index += 1;
  }

  return source.length;
};

export function highlightPlaygroundSource(source: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let index = 0;

  while (index < source.length) {
    const rest = source.slice(index);
    const whitespace = rest.match(/^\s+/)?.[0];
    if (whitespace) {
      tokens.push(whitespace);
      index += whitespace.length;
      continue;
    }

    if (rest.startsWith('//')) {
      const value = rest.match(/^\/\/[^\n]*/)?.[0] ?? rest;
      tokens.push(makeToken('comment', value, index));
      index += value.length;
      continue;
    }

    if (rest.startsWith('/*')) {
      const end = source.indexOf('*/', index + 2);
      const value = source.slice(index, end === -1 ? source.length : end + 2);
      tokens.push(makeToken('comment', value, index));
      index += value.length;
      continue;
    }

    if (source[index] === '"' || source[index] === "'" || source[index] === '`') {
      const end = readQuotedValue(source, index);
      tokens.push(makeToken('string', source.slice(index, end), index));
      index = end;
      continue;
    }

    const customProperty = rest.match(/^--[a-z0-9-]+/i)?.[0];
    if (customProperty) {
      tokens.push(makeToken('property', customProperty, index));
      index += customProperty.length;
      continue;
    }

    const hexColor = rest.match(/^#[0-9a-f]{3,8}\b/i)?.[0];
    if (hexColor) {
      tokens.push(makeToken('literal', hexColor, index));
      index += hexColor.length;
      continue;
    }

    const number = rest.match(/^\b(?:0x[0-9a-f]+|\d+(?:\.\d+)?)(?:px|rem|em|vh|vw|dvh|%|ms|s)?\b/i)?.[0];
    if (number) {
      tokens.push(makeToken('number', number, index));
      index += number.length;
      continue;
    }

    const identifier = rest.match(/^[A-Za-z_$][\w$-]*/)?.[0];
    if (identifier) {
      const previous = source.slice(0, index).match(/(?:<\/?|\.)\s*$/)?.[0] ?? '';
      const next = source.slice(index + identifier.length).match(/^\s*(.)/)?.[1];
      const kind: TokenKind = keywords.has(identifier)
        ? 'keyword'
        : literals.has(identifier)
        ? 'literal'
        : previous.includes('<')
        ? 'tag'
        : next === '('
        ? 'function'
        : next === '=' || previous.trim() === '.'
        ? 'property'
        : 'punctuation';
      tokens.push(makeToken(kind, identifier, index));
      index += identifier.length;
      continue;
    }

    const punctuation = rest.match(/^[{}[\](),.;:<>/=+*?!|&-]+/)?.[0];
    if (punctuation) {
      tokens.push(makeToken('punctuation', punctuation, index));
      index += punctuation.length;
      continue;
    }

    tokens.push(source[index]);
    index += 1;
  }

  return tokens;
}
