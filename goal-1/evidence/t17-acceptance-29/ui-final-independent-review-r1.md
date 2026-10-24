# U2 最终UI独立代码复核R1

结论：当前最终源码未发现尚未处理的确定阻断。此前待交付被Today遮挡与企业新单关注丢失均已核修后接线；本次发现的旧季综合原账标签断点按Root单独授权最小修缮并定向通过。Native仍进行，不以本结论替代真实点击、保存故障、视觉或真人验收。

| 核对项 | 当前源码实证与界限 |
| --- | --- |
| 今天与原书签分离 | CinematicRoom41–43只设置/清理DayPerspective；OpeningMoment118–121将打开Today、返回原focus与显选prepare/choose分开。只翻今天不onFocus；TodayScene26–27仅明确选原对象或life/market方向才改UI关注，命令另confirm。显选后的free是新准备方向，不承诺取消选择会自动恢复最初旧pin。 |
| run/revision与等待后回响 | day-perspective7–9只读同run的committed receipts。AdvanceTime/ChooseEvent保Today；五类原新安排成功回执才退出；候选没有新receipt。父43/本地92 effect清无效marker，渲染也即时核helper，不靠effect后才隔离新run。TodayScene39原feedback保持独立来源。 |
| 历史与仍待续 | DayThreadAction15–21先处理history/result导航，current/carry原command/wait继续。OpeningMoment174不在history生成continuation，222–223历史/结果02为原inspect，物件同primary/dayPrimary绑定。不能由首笔工资/正持仓断言整轮结束；原未付卖款仍同order等待原dueAt。 |
| 日期与AP | TodayScene37–41显示实际date/quarter，54费用/点/天数取公开life.work，仅说明核对的条件；命令是原StartLifeWork。Today wait经原playableAdvanceDate。OpeningMoment171/226使0AP free/market仍有原安全Clock，history/责任/交付/年代边界仍优先；无续约、返行动或免费交易。 |
| 责任override | OpeningMoment118/206明确!responsibility；CinematicRoom41 pause/delivery回原focus；TodayScene33自身保护不显示普通新安排/Clock；SeasonRecollection28待交付标签明确回原作品。保自身Submit主操作特例，并未用该特例放行Today。缺口/风险/强制事件仍原moment优先。 |
| 企业市场显选 | season-thread106–109只允许原saved候选、空personal/free、同季，且payload.accountId精确等实际candidate并属受控账户，才允许显选企业新Plan/Place接原实体。具体旧pin/未知身份/候选/只读保存不因此被普通旁路抢走。 |
| 只读/候选/旧闭包 | shared-action19–37当场复核同snapshot/run/revision、saving/busy/candidate/conflict；稳定read_only只允许纯UI阅读。原CommandButton/Clock仍preview与原request权限。Today及留页继续关注按钮用同来源guard；改变UI偏好不获得游戏写权。候选仍旧日期/金额/对象，无新收据。 |
| 留页实际动词 | SeasonRecollection13–16/32分阅读季度与实际今天，37把当前未完责任独立列出；旧季度不显示下一季Clock。新增真实标签修缮：29/39综合入口明确转看今天（currentQuarter）的全部安排与原账，旧季具体有据节点仍上方并携原ID；不再用旧季完整原账标题跳今天的live安排。 |
| 同物件与焦点 | TodayScene30/40/45主念头与物件同primary.activate；OpeningMoment同dayPrimary binding。TodayScene21–23的local h1/imperative ref与focus effect仅服务阅读焦点，不改变源/权限；R3实际聚焦证明仍以Root原证据为准，本审未操作浏览器。 |

本次唯一必要修缮验证：historical-ledger-label-r1保原前像/命令源绑定，SeasonRecollection.test.tsx原7+新1整文件8/8，exit0、wall19297ms（Vitest16.87s）、8源初末同；原断言/时限不动。新项从正常WorkQuarter真实跨至Q2后读Q1，三原工资ID/日期仍在，两综合按钮标明今天Q2，无旧季跨季Clock，raw和当前4AP不变。仅SSR/组件证据，不声称实际按钮已点；Root将重建最新生产并继续Native。未跑其它测试、类型、兼容或Git。

仍待：最新构建下该综合入口与日期/账户原生读回；正常工作/生活/投资跨季、候选/物理旧新/原retry的最终原文范围与全Create审核；实际纸页密度/接触、无提示真人理解与趣味。旧P3正式62/22、旧PNG与暂停兼容/全goal均未因本审关闭。

本次读取的最终生产身份（模式均644）：

| 文件 | bytes | SHA256 |
| --- | --- | --- |
| src/ui/TodayScene.tsx | 9323 | 73ddf39cc45aa47bce07455757fa87bacf488a84205580f9f4b62671adc23a26 |
| src/ui/OpeningMoment.tsx | 43273 | 00a1054919d946f2eab1c746f4fa4ce240fddd2ab1917f62e4e4f35dd55c3b4a |
| src/ui/DayThreadAction.tsx | 2408 | 649fec9bbd53579194ea5622a30d067f456395073130f8737ca0a4098c3f258c |
| src/ui/CinematicRoom.tsx | 15429 | 74f62b05dd966a7d9858b63dd392e4fe709f8010054da3dfbb331db6781e8102 |
| src/ui/day-perspective.ts | 700 | 5f485a6df5e58f678fd09f868aff992cd553283eec4440f21fefdaecf6e9087d |
| src/ui/SeasonRecollection.tsx | 7560 | bbb5f6a6637b65bb5ab39bfed0bee30526b8546b82591ba6ab4dceaae7d40927 |
| src/ui/today-thread.ts | 8202 | 8fdc693ac9e0b5c221424d50b1007daf8f553bf340ac23be84e2982625c94f33 |
| src/ui/season-thread.ts | 49560 | afd39e3e38eff0eb9fa02e71cc3d5437592775753e962c49e1efe5aa1b166811 |
| src/ui/shared-action.ts | 2290 | 5562777df4ccdacbd266f29835571e0c18d1977424cf12816ae39fd2cf6e42b7 |

[杠精审查] 原确定缺陷逐项处理，未靠删能力/改规则/日期AP/虚构完成收口；标签修缮只改SeasonRecollection和其1项测试，原审R1/旧红/旧证据不覆。此后本owner不再改源。
