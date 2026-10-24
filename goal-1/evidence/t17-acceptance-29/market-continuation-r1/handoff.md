# 模型接缝交回

生产已冻结，精确identity见source-freeze.json，副本见source-final。原API签名和type union不变：

- marketSceneProgress(m,date,accountId,preferredId?)：绑定order有同source未付交收时phase='settlement'，entityId仍order.id，order原对象、settlement最早原款，nextDate原dueAt/current日限界；partial仍phase='partial'+原Cancel，nextDate取较早实际交收/撮合。没有新命令。
- playerThread(...)：market resultRefs/结果日期补同source已付settlement；carry与结果用同主体查询。work entityId=null仅认current quarter；原指定历史id不变。work-paid仍可能有原wait，不可统一按outcome actual判结束。
- seasonFocusAfterSave(...)：emptyfree同playing季度/personal原saved白名单加PlaceStockOrder，原四类保留。已有具体pin、无save/候选/只读/跨主体、AdvanceTime不因此改焦点。

修前第二红9逻辑红；修后25不同定向case全部通过（6市场＋19精选线程，28精选未执行单列）。完整stdout/stderr/argv/原时限/源前后都在本目录。未另重复全tsc，Root统一strict与UI累计；没有Chrome或完整Create新审核。

独立工作反例要区分：真实S2 Q2原档修前已通过，因为原投影只给本季employment；防御性历史rows反例是display-only且修前红，不能对外写正常bug复现。source/rules/money/P3/封存旧根未改。所有自有源码和证据现停止写入，供Root接线/统一验收。
