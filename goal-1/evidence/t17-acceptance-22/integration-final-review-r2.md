# S2集成定向复核 R2

本次只复核R1两处修缮，原R1保留修前事实。结论：读取时两处源码连接已收口，没有发现由这两处修缮带来的新确定冲突。

1. App.tsx:123对selectedFocus在当前已提交公开投影做playerThread匹配，:125将focusStatus invalid并入全局focusRequiresChoice，保存回调:87随之不推断；相同规则覆盖离开room后的原册/责任旁路。显选rememberFocus仍重新匹配实际source，再经原偏好gate。season-thread.ts另在推断前对previous invalid existing原样返回，模块不借真实交易修复旧pin。新增真实saved订单边界原默认5秒1/1过及strict0见season-model-r2；不把该项当整个App运行通过。
2. SceneJournal.tsx:39对job.id===firstOrder.jobId显式传quarter/personal/原contractId（无contract时原jobId）；planned/running不再按ai_video路线跳去另一业务。awaiting/review/delivered原专门contract行保留，其他经营job未被改成首单。App room导航遇quarter+recordId仍直达原QuarterPanel目标。

未改App/UI/SceneJournal，仅本代理被授权修helper/tests；本次复核未运行额外测试、浏览器、兼容或Git。视觉、实际Chrome、根App/日历定向与最终构建仍由根独立记录；不声称全游戏或人类验收。

读取时修后SHA-256：
```text
src/ui/App.tsx 45e4df359c0140fe913853c012fb7059b8defe5dab7b0b027f0e4d3c6da4e144
src/ui/SceneJournal.tsx 824cb239505e29654b152b8f9ebf4d6e973baa55e4c6006e41879825698092de
src/ui/season-thread.ts 7a811c0303f380cfb473d72978a921f97bf969d8a1775c79361608fe5bfe72c8
src/ui/season-thread.test.ts ecc49610c9b2324cff3952dd81865d07c2dfeff1a4eb86ce46d6dbcb01f1e665
```
