# planned支持等待标签最小修缮

原wholeperiod支持阶段按jobNext返回planned.startAt，但bound统一标为完成。只在bound按原supportJob.status区分planned开工/running完成；原nextDate/completeAt、outcome、target、命令和财务不改。

先补回归并保实际red。复用F04原命令+官方公开投影，实际服务开工/停止后捕获未来planned；原时钟推进到支持startAt的before阶段时仍planned，再同日snapshot后真实running。各阶段核对象/日期/成本/AP/原文不因纯投影改变。若Root原94已导出则只读绑定实际normal原期作为补充，不新跑完整Create。fixture与normal来源分标。原时限/断言/配置不改；只跑owned适用定向与strict，不浏览器/构建/矩阵/兼容。

原before源/红/绿及末hash保留，冻结后交Root新构建/实际图和原文统一审核；不把unit当修后Chrome通过。
