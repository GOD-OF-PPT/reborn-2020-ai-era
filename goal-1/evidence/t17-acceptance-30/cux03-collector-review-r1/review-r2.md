# U3-V / C-UX03 独立源代码复核与五原 collector 终态（最终交接 R2）

后续源桥接：五 collector 执行及 collector-final-readback-r2 时，547源与UI R2完整相同。Root已解除冻结后的最终交接读回另见 src/ui/video-scene-object.css 一份新美术改动，其他546仍同；运行闭包不受该CSS影响，TS/测试未变。本报告不将旧UI/collector的547当作当前最终画面通过。新CSS、最终构建与当前Chrome由Root另核；准确新旧字节/SHA见handoff-readback-r2.json。旧review.md与两readback均保留，不覆盖或重跑。

本轮仅执行已授权五原 collector，及读取源码、登记、原检查终态和输出原文。没有改 production/test/scripts/config、主计划/登记/旧封存，没有启动 Vitest 收集或额外测试、book-layout、浏览器、几何或任何兼容检查，没有 stage/commit/push。所有调用保留原断言、时限、固定输入和隔离；五步骤串行，各自只启动一次。

## 原检查与继承层次

实际原全量文件名是 cux03-unit-r1，而非 cux03-all；当前根不存在 cux03-all*.result。原登记172配置文件，纳入171，唯一排除整个 src/ui/book-layout.test.ts。cux03-unit-r1.result.json 实际 exit 1、signal null、1982477ms；546源初末同。stdout为171文件=167过/4红，1080项=1076过/4红；四红均在UI（Today精确方向、FocusBook wrapper driver、视频动作名、推广running原标签），不是原非UI失败，也不冒称一次全绿。

cux03-ui-r2 为新的实际完整适用UI复验：84文件/522项全过，exit 0、signal null、642282ms，547源初末同；原book-layout整文件仍排除。本轮五collector并非重新执行这些UI检查。

计数修正：不能将原1080减当前522得558。R1→UI R2的四个变化测试，其 post-cux-repair-r1/*.before.txt 原文均逐 bytes/hash/mode 匹配原546冻结：OpeningMoment仅补原driver wrapper展开，Today保原断言并明确四方向；video-player-thread与video-scene-result各新增一个真实边界case。因此原UI520、当前UI522；原非UI560是以这两项精确源差分和原1080总数推导，原87非UI文件都在原同次通过文件中。560不是另一次非UI运行的独立报告数字，更不把87/560与新84/522合写成一次新171/1082通过。原4红、后续定向红/绿及UI复验各保自身身份。

## 可继承非UI证据的绑定条件

non-ui-inheritance-r1.json 保留全部依赖表、旧测试原文匹配和 source delta。原87非UI测试 bytes/hash/mode 当前全同。读取TypeScript语法树，递归追踪相对 import/export（含动态字符串import，?raw回到真实原文件）：保守含类型闭包291，排除纯类型边后的运行闭包276，无未解析相对引用。R1→R2的10处源差异全部位于UI；运行闭包与这些差异交集为空。保守闭包唯一差异 video-scene-progress 仅来自 game-types 和 video-scene-draft 的 import type，不据此假称运行代码改变。

不能只绑定87个测试文件：它们确有EndingStage/JourneyPanel/CommandButton等UI的SSR运行依赖。继承须同时保原全文结果、546源冻结、原登记、运行依赖、锁/配置/原运行环境、73原登记脚本和55原字面证据输入。当前73脚本和55输入均 bytes/hash/mode 同；前述运行依赖源均在原冻结/脚本/原raw绑定内。schema12等旧原文测试继续保拒绝/历史身份，不变成当前schema13成功新局；P3的protocol-only测试不等于正式62关键原文或22例行执行。

## 五原 collector 的实际执行

| 原步骤 | 实际exit / signal | wall ms | 产物 / 声明snapshot | 限定身份 |
|---|---|---:|---:|---|
| kernel r1 | 0 / null | 1203 | 3 / 2 | Q01独立会计fixture；确定性重复；现金2700000分、投资1100000分、4点已用 |
| save r1 | 0 / null | 1772 | 5 / 4 | base registry/codec、命令幂等与陈旧版本、独立fact/RNG；历史T04另列 |
| first-order r1 | 0 / null | 14640 | 15 / 14 | 7个固定正常Create首季分支，含实际工资/生活、成功/拒绝/略过/过期/中断/未交付 |
| market r1 | 0 / null | 5767 | 11 / 10 | 1个正常Q01 + 4个原独立市场fixture；成交/费用/交收/部分撤单/缺报价/股息 |
| video r1 | 0 / null | 40043 | 7 / 6 | 1个独立F02（37命令）+ 两背景正常原前史（各63命令），无赠资格/钱或删步骤 |

全部41个产物保原始输出，36份声明snapshot逐实际文件 SHA 与记录相等；各报告声明 sourceHashes 全部匹配当前原文件。五原进程都已真实terminal，没有仅凭目录存在/日志出现认通过。每次547源 before/after完全同，五套执行时冻结又与UI R2的547完整相同（后续CSS已变，见本R2首段）；runner/guard的extraSame均true。补充输入 inventory-before139份（73脚本、55原raw及planning/旧T04原JSON/JPG、storage HTML、runner/imported lib、guard/锁/配置等去重）在终态读回时无字节/模式变化。详见 collector-final-readback-r2.json，内含结果/日志/冻结/每产物完整SHA。

金额仍按原样本解释：首单成功技术4280000分/内容3680000分含先WorkQuarter工资与生活，与Chrome仅接单的2680000分路径不是同一玩法前缀；不改原期望去迎合另一条路径。市场4个fixture不冒正常行情/页面兼容。视频F02收入900000、成本465000、利润435000、现金2435000分是独立三单会计例；两正常背景各从实际Create挣得资格、首发布收入0、实际两次发布，不把F02利润或预设权限交给正常玩家。

save内T04 native46/46只读取原JSON/JPG引用，原脚本字段明确 historical_report_only_not_reexecuted_for_current_sources；本轮没有重跑原生IDB/两标签/head.put abort/物理旧新/原retry。first-order/market的Q33标签也不自动补成Session/IndexedDB/Chrome故障证据。原collector快照主动尾LF保留，不混入Chrome实际导出buffer角色。

## 当前源代码独立阅读

本轮阅读VideoThreadAction、VideoEncounter、video-continuity、VideoPublicationTerms、video-player-thread、video-scene-progress、video-scene-result、VideoSceneChoice、两draft helper、App视频工作区/成功回调/导航、OpeningMoment/Today/Narrative接线和共享CommandButton/action守卫。以上源码读取时均在原547绑定内，随后仅见首段所列CSS后续变化；这不是对全部547文件穷尽审计。

- 房间与视频路线复用VideoThreadAction；作品物件和主念头共用同 binding.activate，真正动作仍CommandButton原预览/confirm；等待仍ClockAdvance及当前日历屏障。history分支回Today仅UI选择，结果页的下一单/素材/资源/日期仍显选，原完整册通过同目标onInspect可达。该结构没有另建加钱/免费完成或假生命周期。
- App视频保存回调先比run/screen/account/open/epoch/完整videoTargetKey，实际saved才用原公开差分跟随新作品，跨目标/账户/重开不会沿旧回调合掉新册。草稿按run/account/channel/work/contract/marketing隔离，章节仅阅读页；controlled target由父持有，不在A→B→外选A时复活旧localTarget。关闭/浏览不发原游戏命令。
- helper将已安排/实际制作/人工核对/亲手提交/客户复核/返工/谈判/验收/实际实收分开，有限退出保原成本、保护预款与欠费；结果差分守run、连续revision、真实saved、当前receipt、非candidate/readOnly/busy和公开原金额来源。测量回响不是现金收据。
- 原affiliate确定缺口已在当前公开模型与结果里加 qualified 且 cohortId非空；没有资格或零受众不虚造额外订单观察。原发布说明在选择页和原确认共用VideoPublicationTerms，以当前可见已读批准/实际资格/七日统计窗说明“不补发收入”，未知或未读回信不伪造批准。正常无资格与独立F02合资格后当日下架零播放分别保身份。

本次限定阅读未发现需新增阻断的确定实现bug。此结论只覆盖上述代码与身份，不能据静态阅读/绿测推断按钮当前画面可点、完整客户返工链已经Chrome验过或真人已经理解/觉得有趣；Root当前Chrome、候选故障、完整Create审核及最后新图按各自真实记录另核，不预勾。

## 保留的失败与边界

1. 初输入inventory预检将guard直接调用到尚不存在的新目录，实际ENOENT，尚未创建文件或启动collector；已在input-before.json明确记录，按既有父root guard→mkdir fresh→子guard继续，没有重启collector。
2. collector-final-readback-r1.json读回脚本遗漏九个根配置行的可选gitMode字段，用JSON对象形状比较产生九项伪漂移；原件保留。r2读取已存在的同五终态/原输出，按预期元数据形状及单独规范化bytes/hash/mode双核，证实无源漂移；没有重跑五collector或改源来掩盖。r2包含原r1完整SHA和原因。
3. 不宣称新171全绿、新Native通过、24季整体、正式P3 62/22、C-UX03所有业务/艺术已最终通过、原PNG/真人/兼容或goal完成。无新位图/声音/依赖/外部服务；兼容开发和测试0。

[杠精审查] 本子任务限定通过：五原真实终态和全部输出原字节已逐项读回；原全量4红、当前UI与继承非UI分层，纠正558计数陷阱及读回metadata伪差异，不把旧native或fixture当当前正常/浏览器验收。证据表可供Root最终合并，但不替代Root当前Chrome和完整任务收口。

4. 最终handoff-r1已经如实列新CSS sourceMismatches，但复制了前一时点all547SourceInitialFinalCurrentEqual的true；r2逐份重读明确execution-time同、present-source已有CSS差异，并保留r1。没有据此重跑旧collector/TS测试或认新CSS已验。
