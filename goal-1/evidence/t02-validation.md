# T02｜工程与资料扫描验证记录

日期2026-10-16。范围：E02/P002工程子范围与资料校验工具；不证明任何Q/X游戏功能、规则引擎、存档或真人体验已经完成。

## 工程与依赖

从官方create-vite 9.2.1的react-ts模板选择性合入tsconfig、Vite配置和入口，不合入模板品牌图片、README或许可证，不覆盖既有资料。首次绝对输出路径被工具当成仓库内相对路径；已把本次工具新建目录移至临时目录，仅移除空父目录，再选择性合入。最终仓库不存在该临时var目录，无已有文件损失。

| 组件 | 精确版本 |
|---|---|
| Node / npm（实际运行） | 22.12.0 / 10.9.0 |
| React / React DOM | 19.3.1 / 19.3.1 |
| Vite / React插件 | 8.3.4 / 6.1.2 |
| TypeScript / Vitest | 6.0.2 / 5.0.5 |
| Node / React / React DOM类型包 | 22.20.5 / 19.3.0 / 19.3.0 |

核验[官方Vite指南](https://vite.dev/guide/)、[React指南](https://react.dev/learn/build-a-react-app-from-scratch)、[Vitest指南](https://vitest.dev/guide/)及npm注册表各包version/engines/peerDependencies。TypeScript使用官方模板的6.0系列基线；Node类型使用22主线。`.npmrc`启用save-exact与engine-strict，package-lock锁定依赖树；独立检查根依赖与每个直接包的锁定版本一致。

实际执行npm install后，以npm ci从锁文件重新安装成功。npm ls --depth=0无缺失/非法直接依赖；npm audit报告当前已知漏洞0，这只是本次依赖库扫描结果，不是完整安全验收。

## 实际检查

[统一检查原始输出](t02-check-output.txt)对应实际执行`npm run check`，退出0：

- typecheck：tsc -b通过。
- test:unit：1文件/1项React服务端渲染入口烟测通过，Node环境可编译执行TSX；不是游戏规则单测。
- test:docs：60项Python资料/工具测试通过，含新增9项扫描回归。原发布测试使用FakeCommands，打印的创建/推送未实际发生。
- check:docs：35份Markdown、22基础任务、原Q01—Q40及增量映射检查通过；原PNG明确0/3，text-only没有冒充正式资产验收。
- build：Vite 8.3.4实际完成生产构建，16模块；产物HTML、CSS、JS分别约0.62/1.07/220.62kB。产物保留在被忽略的dist目录，不提交。

资料扫描回归先在旧实现执行，复现嵌套node_modules被扫描及非法Markdown编码抛异常，修复后9项全部通过。现在os.walk在进入目录前剪枝；node_modules、dist、coverage、浏览器报告和明确缓存被排除，docs、planning、src/content、goal、普通子包和相似名称目录仍被检查。完整资产模式仍拒绝缺失原图。

## 实际服务与浏览器烟测

[HTTP检查记录](t02-http-smoke.json)：启动dev于127.0.0.1:5173、preview于127.0.0.1:4173；两入口、开发模块及生产JS/CSS共6个请求均为200。第二次占用5173的dev启动明确退出非0并提示端口占用，没有静默换端口。

通过Codex内置浏览器实际打开dev与生产预览，两个页面的可访问性树均出现：

```text
标题：重生2020：AI时代
开发预览 · 工程基线
首个可玩季度准备中
当前页面用于本地工程启动检查，尚不能开始或继续游戏。
将要展开的五条财富路线：A股AI股票、AI短视频、AI卖课、API中转站、DeepSeek生态与架空股权
```

这证明当前工程入口实际渲染，不代表目标视口/键盘/存读档/经营/整局验收。检查后关闭本轮临时标签，SIGINT结束两个本轮测试服务，均返回130。

## 审查与剩余范围

[杠精审查] 通过：脚手架没有覆盖资料；没有计数器或假现金/假存档冒充游戏；严格类型、直接模块引用、最小React依赖和本地监听已落地。新增测试检查真实扫描边界与入口执行，旧规划文件字节保留。README/AGENTS/技术08同步工程事实，不扩大结果声明。

后续T03实施钱/日期/行动并执行C03累计全面检查；T04实现命令和存档，T05内容执行，T09首季浏览器功能验收。原PNG、玩家招募、史实/供应资格与公开发布仍有独立待办。P/W状态不因工程烟测自动关闭。
