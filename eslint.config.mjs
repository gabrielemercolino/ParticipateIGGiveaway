import js from '@eslint/js';
import globals from 'globals';
import ts from 'typescript-eslint';

const tampermonkey = {
  GM: 'readonly',
  GM_xmlHttpRequest: 'readonly',
  GM_registerMenuCommand: 'readonly',
};

export default [
  { languageOptions: { globals: { ...globals.browser, ...tampermonkey } } },
  js.configs.recommended,
  ...ts.configs.recommended,
  { ignores: ['dist/'] },
];
