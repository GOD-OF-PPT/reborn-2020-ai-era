import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/relay-critical-*.test.ts'],
    clearMocks: true,
    restoreMocks: true,
    maxWorkers: 2,
  },
})
