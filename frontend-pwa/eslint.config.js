import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // generated build output — not source; pwa plugin emits the service worker here
  globalIgnores(['dist', 'dev-dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // screens receive a uniform { isOnline, params } prop bag from the router,
      // so unused *props* are expected; still catch unused imports and locals.
      'no-unused-vars': ['error', { args: 'none', varsIgnorePattern: '^[A-Z_]' }],
      // advisory (perf hints + dev-only fast-refresh), not correctness bugs:
      // surfaced as warnings so they don't block ci.
      'react-hooks/set-state-in-effect': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
])
