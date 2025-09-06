import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    typecheck: {
      tsconfig: 'tsconfig.test.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      all: true,
      include: ['src/**/*.ts', 'src/**/*.js'],
      exclude: ['src/**/*.test.ts', 'src/**/tests/**', 'src/**/*.d.ts'],
    },
  },
});
