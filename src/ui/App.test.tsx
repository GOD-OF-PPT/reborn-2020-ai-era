import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('application entry smoke test', () => {
  it('renders the Chinese project entry in the Node test environment', () => {
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('<main')
    expect(html).toContain('重生2020')
    expect(html).toContain('开始一段新人生')
    expect(html).toContain('人生愿望')
    expect(html).toContain('不会展示隐藏结果')
  })
})
