import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
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
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
  {
    // Node-context build/dev scripts (not bundled, run directly via `node`).
    files: ['scripts/**/*.js', 'logTest.js', 'seedEVM.js', 'public/download_bg.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Loaded via <script> tag before the Firebase compat SDK, outside the bundle.
    files: ['public/auth-guard.js'],
    languageOptions: {
      globals: { ...globals.browser, firebase: 'readonly' },
    },
  },
])
