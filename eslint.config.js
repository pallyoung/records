import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@phosphor-icons/react',
              message:
                'Import icons from src/shared/icons only. Direct third-party icon imports are forbidden in business code.',
            },
          ],
          patterns: [
            {
              group: ['@phosphor-icons/react/*'],
              message:
                'Import icons from src/shared/icons only. Direct third-party icon imports are forbidden in business code.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/icons/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
])
