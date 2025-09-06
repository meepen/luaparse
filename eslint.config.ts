import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default defineConfig(
  {
    ignores: ['**/*.js', '**/*.js.map', '**/*.d.ts'],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      // This will automatically use your .prettierrc
      'prettier/prettier': 'error',
    },
  },
  // This disables rules that would conflict with Prettier
  prettierConfig,
);
