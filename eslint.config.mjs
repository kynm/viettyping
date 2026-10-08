import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import reactHooks from 'eslint-plugin-react-hooks';

// React Compiler is not enabled in this project. Surface its new migration
// diagnostics as warnings while keeping Rules of Hooks and TypeScript errors blocking.
const compilerDiagnostics = Object.fromEntries(
  Object.keys(reactHooks.configs.flat.recommended.rules)
    .filter((rule) => !['react-hooks/rules-of-hooks', 'react-hooks/exhaustive-deps'].includes(rule))
    .map((rule) => [rule, 'warn']),
);

export default [...nextVitals, ...nextTypescript, { rules: compilerDiagnostics }];
