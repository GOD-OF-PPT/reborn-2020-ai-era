# B4：交互执行隔离与简短真实等待反馈

前轮a6f1bf85为progress，C-B3限定完成/349已STOP fullseal97，本轮唯一原U6内部B4，不开始U7/B5。全读goal三文件、349 next-repairs/准确源；用户文案堆积最高优先和A长日重启单屏流程保持，所有页面兼容开发测试0。不能只加spinner、搬一段evaluate后仍在主线程seal/export，或用测试假kernel冒响应修好。

## 真实入口与选定边界

当前main→browser-game直接GameController/RunSession，evaluate/copyJson/codec与Store.prepare同步；UI四处显示preview、Clock的commitments、App真实请求/确认、Storage检查导出同样触发完整处理。选定单个DedicatedWorker拥有原GameController+原Codec registry+Session+IndexedDb Store+原WebWriterAccess；这些原实现/规则/10MiB及逻辑预算不换。前台GameControllerPort结构接口只接受公开snapshot和原receipt/preview/clock/导出文本等原允许结果，不发送GameRun或隐藏未来作为UI新模型。原schema/rules/seed/RNG/钱/AP/日期/全部账与能力保持。

保原本地Controller作为作者/服务实现，不在普通浏览器失败时暗中回退到主线程重算。浏览器默认使用真实Worker；作者测试显式注入MessagePort harness，实际host/Controller/Codec/Store执行，不称harness等于Native Worker。DEV abort-*白名单与原隔离DB/predicate/trace留原行为，production不开开关，不自动换空DB掩盖旧档。

## RPC与权责

版本1/一次boot nonce/单调request与snapshot序列；严格方法白名单和参数/身份范围，查询绑定当前公开snapshot sequence、run/revision/阶段/权限/候选状态，迟回调不发布。原prepare产生的commandId、actor、run、expectedRevision、payload逐字传原Controller，Worker重新核原资格；读preview不获得提交权。启动/切人生/关闭/读库与写命令保持原互斥，控制stopWaiting/stopRoutineBatch/close不能被排在整段等待后而失效。每个实际保存以原Store transaction oncomplete后才发新结果，不将请求已发送或Worker算完称保存成功。响应在相应公开snapshot已应用后才完成UI Promise，旧run/session/sequence结果拒绝，不自动重发。

前台发起实际写/读库时立即反映busy并禁重复决定；Worker真正snapshot仍是原上次提交，候选/冲突/readOnly和旧日期/钱/AP保。失败Store保持同candidate，retry仍原Session.retry不evaluate；导出原candidate与旧保存均异步到Worker处理。Worker运行故障时冻结写操作、保最后已确认画面并明确未核实结果，不制造candidate/成功或自动执行原command；重新读取是显选原本机事实，不能把重启当原retry。进程崩溃与原页面崩溃一样可能失去尚未导出的内存候选；已明确导出的同身份候选文本可保前台buffer，不能把它自动恢复成已保存进度。正常Store故障与进程失联分别验证/说明，不能用后一项回避前一项的原候选恢复。

## 前台异步读与交互

四处显示预览使用有生命周期的React读取hook，命令/payload/公开scope变更即退休，旧组件卸载/改稿/换账户/换人生的回信不改新稿。原本地Controller同步路径保原作者消费者，远端路径await真实preview及clock后才构造原捕获确认；App以原workspace epoch、run/revision/阅读位置和意图序列核迟回调，查看/返回可取消未承诺意图，确认仍原同命令。不把一个按钮的await缓存变成所有按钮的资格，也不为任何payload填默认资源/日期。全局仅一句当前处理提示，原物件、旧责任、取消/停止和设置阅读仍可响应；不铺工作台日志、伪进度百分比或假完成。完整原确认、原页码、全部能力和减少动效/纯文本继续可用。

保原未保存提示的最小只读接口，主线程仍读needsUnsavedWarning注册原beforeunload处理；只为执行隔离必要接线，不新增原生离页/缩放/尺寸/移动或跨浏览器专项。Worker Web Locks沿原key，不能因API失败无保护写入；当前Chrome真实第二窗口只读/冷读为基本权限与保存验证，非兼容验收。

## 验证与限定完成

先正确transport/所有权/迟响应红测，再最小host/client；真实原Controller/Session/Store fakeIDB和原abortAfterHeadWrite确认正常存/真实put后abort/原candidate retry/backup/reader/cold/重复命令。异步UI核同一对象确认/取消/改稿/离开后的迟回信，忙时仍可阅读/设置/停止，保存后才新回响。协议/fatal/关停/sequence/未知方法/坏输入/过期run/actor/revision分别负例；不依赖真实秒数或任意延长原5秒unit限时。

从固定351/942复制新冻结源，仅明确owned覆盖、不拷P3 overlay，所有改变源/type/build/HTTP逐字绑定。跑全部相关模型和改动UI实际消费者，原完整文件/超时/worker配置保持；旧红和分源检查分别保。大档以原正常规范记录单一输入重放原真实command完整canonical等值，不能导入未保存提案当进度。Chrome普通构建真实Worker启动、原QA DB330继续或另登记原输入，实际完整小循环中忙时操作UI回应，核钱/AP/日期/同对象回响、readonly/cold/backup及原文；截图/Node harness不冒人类理解/趣味或全性能。

原主5415现在351/129/原文82f3147a..，切换前实际读当前状态/全文保、不假定不动；只有新版本足够核齐才原origin更新，旧资产保，前后全字节同，0主人生业务/设置/书签。自有QA tabs/servers精确关而DB保，用户主server保可玩。原36完整producer（35+349）、P326/132marker/2symlink/旧19与35/input61B/未接线model/master原前缀+2304B插入保，不向旧STOP追加；混合masters/AGENTS/P3不stage。只本任务owned本地提交，逐blob/mode/path及post后terminal/STOP/fullseal，无push/deploy/新委派/外部消息/global memory写。

## 回滚与原目标

保原351构建与全部v1/v2/v3、用户DB/备份和已保存receipt，回滚仅本轮owned源码/入口与构建，绝不为了回退而删档。B4完成后B5才公开反馈意义/减少日常序列化，仍不得读隐藏队列或未来模拟/直接跳过原响应/费用/季度硬屏障。原U6短文案/closed生态终态/17动作5共享系统美术/normal2025board/最终全审、U7/U8/CUX12完整U4-B/U5/U6、U9后原组合/T17余/PNG0of3/真人0/P3正式62/22 not_run/M01须用户明确恢复/T18最后/goal ACTIVE全保。

[杠精审查] 计划把真正全部重处理入口、前台确认和失败/候选/权限/关停列入，不能只做Worker demo或把本任务绿替代全目标。RPC故障不能默默重算、制造存档或清候选，普通浏览器默认必须实际使用新执行器才算接线。所有页面兼容开发测试0。

补充实施合同：前台显示preview/clock用组件生命周期hook，复用原ScreenBook已经赋予按钮的inert状态，未显页不额外发预览；不改原分页/尺寸或几何规则，不加全局资格缓存。原本地Controller同步读保持，真正Worker路径全部异步。原Store失败后后台先发旧公开snapshot，再把同原exportCandidate产生的有界文本作为opaque recovery buffer给前台；不是GameRun新模型，不解析/不自动导入/不当进度。若Worker此后失联可导出这份已捕获原候选，正常活进程retry仍唯一原Session候选，进程恢复只显选读取物理档，不自动重算。控制RPC带原wait/routine请求ID，epoch更换/旧控制请求不影响新意图；每实际存完允许一次Worker任务让出，以处理已请求的停止，时间/费用与提交内容不变。

课程回归的现有准备边界：351原10/10、360整10超时/362整5红5绿、当前trace完整10/10均保；trace显示实际submit finite终态，主要重复原78→79准备/完整Codec，没发现read等待死锁。依AGENTS65，已用真实Controller/Session/Store实际保存同首例第二课程79/原钱AP保并独立351同命令整wire等值，course-prefix-r1完整sealed输入859444B/44cde9e2..；测试将这份真正规范79作共同起点，每case仍原Store.import/Controller/完整被测新命令/真实abort/retry和全部原UI断言，原78前史/seed/版本及钱AP资格不改，不延时、不删case、不把此作者优化说成产品性能。新输入只用于这些作者测试，不接正常资本305路径。

368实际等待画面发现：两处Clock按钮下重复SAVE_IN_PROGRESS说明，同时已有App全局处理状态。只对真正asynchronous Controller的该busy代码去掉重复small，保禁用、共享绑定理由及全局一句状态；资金、权限、原候选、冲突、失联等其它理由不合并。以原真实held Store状态核两个按钮仍禁、不能提交，局部资金理由仍可见；本地旧Controller说明不变。原Native368已发起一次Jul4等待，目前仍在活动，不重发、不换源、不刷新或关Worker来消除长等待；新修缮另冻结，真实存储终态核明后才更新QA源。

最终372冷读反馈补充：readonly/lifecycle读操作不写保存成功或保存中，仅沿原needsUnsavedWarning（实际写/候选/等待状态）区分一句记下与翻开；此分支只改显示，不控制命令或权限。原371核心/Worker/Codec不变，原333全后缀重放证据保，最终372工程/实际冷读按新源分列。
