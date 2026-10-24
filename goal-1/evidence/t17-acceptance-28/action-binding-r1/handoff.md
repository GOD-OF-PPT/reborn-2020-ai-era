# 原动作binding冻结交回

API：shared-action.ts导出SharedActionBinding {label,disabled,reason,activate}及makeSharedAction(p,label,activate,options?)。options={disabled?,reason?,canActivate?,allowReadOnly?}；canActivate为点击时最后纯检查。默认拒只读，仅纯UI选择/翻阅可明确allowReadOnly，仍拒候选/busy/conflict/陈旧或已替换snapshot。没有prepare/submit或新游戏命令路径。

CommandButton新增可选renderAction(binding,defaultNode)与rootRef；原preview/journeyIntent/理由显示和默认DOM保留，主按钮/物件能直接共用activate。activate重核当前源及原preview后只调用原request。Clock renderAction(binding)额外给caption/mainNode/reviewNode；mainNode保.command.clock-main>button与rootRef，custom直接return main，没有新增wrapper。Root桥接必须实际呈现mainNode/reviewNode；Space effect正文已字节核同。原已知支出projection run/revision/from检查、投影缺失force确认、“先核对”和默认clock DOM继续保留。

仅4owned文件，精确bytes/SHA/mode见source-freeze.json；10条跟踪依赖均同（包含core/session/game-types/锁/配置等），未改App/OpeningMoment/业务core/masters。没有浏览器/构建/兼容/book-layout/Git。

验证不能预报通过：unit-r1原3case默认5s超时、diagnostic-r1隔离仍setup6.39s超时，全部日志/测试前像保留。最终测试将重的真实装载移标准beforeAll、按原durable边界分9阶段，各默认5s/10s不变，temporary diagnostics已移除；尚未运行这个最终版本。Root指令停止新并行Node，所以最终shared-action.test.tsx由Root统一串行，冻结后仍须实绿及全类型/集成再算通过。Root中间tsc0不冒称本冻结源最终typecheck。

这些测试使用真实normal Create/controller/IndexedDB与原head.put abort/原retry、实际只读锁和正在保存；Clock采用实际500元首单开工支出及原clock projection，另有明确元数据失配boundary（不改preview.allowed/业务数值）；所有浏览器/Space/用户理解度另验。此后不再写production或test，Root可直接用本身份串行检查。
