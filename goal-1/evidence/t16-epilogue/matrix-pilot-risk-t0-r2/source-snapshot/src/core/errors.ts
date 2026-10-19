export class RuleError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'RuleError'
    this.code = code
  }
}

export function requireRule(condition: unknown, code: string): asserts condition {
  if (!condition) throw new RuleError(code)
}
