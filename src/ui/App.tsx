const routeNames = ['A股AI股票', 'AI短视频', 'AI卖课', 'API中转站', 'DeepSeek生态与架空股权']

export default function App() {
  return (
    <main className="opening">
      <p className="eyebrow">开发预览 · 工程基线</p>
      <h1>重生2020<span>AI时代</span></h1>
      <p className="premise">生活重来一次，你会把时间押在哪里？</p>

      <section className="notice" aria-labelledby="preview-status">
        <h2 id="preview-status">首个可玩季度准备中</h2>
        <p>当前页面用于本地工程启动检查，尚不能开始或继续游戏。</p>
      </section>

      <section className="directions" aria-labelledby="route-heading">
        <h2 id="route-heading">将要展开的五条财富路线</h2>
        <ul>{routeNames.map((name) => <li key={name}>{name}</li>)}</ul>
      </section>

      <p className="footnote">单人策略游戏 · 模拟经营与明确标识的架空分支</p>
    </main>
  )
}
