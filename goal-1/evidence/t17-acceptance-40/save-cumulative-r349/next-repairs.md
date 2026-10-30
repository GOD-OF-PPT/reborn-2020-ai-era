# C-B3发现后的原U6必接修缮（未实施）

本轮只修同签名纯解析反复工作，不把它当完整响应优化。用户最高优先级仍一屏游戏交互、短文案、清晰取舍和真实回响；所有兼容任务仍暂停，不开始U7。

## B4：先把真实计算与交互响应隔开

当前真实源main.tsx→browser-game.createBrowserGame直接new GameController→RunSession.submit，同步evaluateCommand/copyJson/codec.seal后才出现可await的Store事务；Store.prepare/load回读也做完整codec。游戏画面在这些同步段无法绘制新busy状态或回应停止，不是已有WebWorker变慢；仓库当前没有WebWorker实现。不能只加RAF/spinner、缩测试规模或提高超时冒修好。

正式路径先冻结客户端/执行器合同：run/actor/revision/同session/sequence/lease与原commandId相关联的请求响应，旧任务/旧人生/旧草稿回信不得发布；实际Store oncomplete之前不出现新结果。候选/冲突/原retry/readonly/重复命令/主窗口重进保持原权责。区分纯进度与原提交，不发送隐藏GameRun到UI作为新操作模型。新执行器错误不重算原candidate，不因为worker断开默默本地重做同命令。当前UI同步preview/clockCommitments还承担确认构造，不能只搬submit却把全部大档codec留主线程；必须清点真实同步消费者，给异步预览等待/取消/过期范围和原确认捕获提供成套接线。

先选一条原正常小循环做真实浏览器tracer：发起原确认→计算中画面仍能回应/保持短提示→只在原保存成功后真实费用/AP/反馈→同原candidate恢复/冷读。对这条路径检查原run/revision/钱/AP/历史全等和权限；再扩全部共享能力，不能以小循环冒整套搬迁已完。整屏不增加软件任务日志，不假播完成，不改现有游戏规则或免费行动。当前禁止原生离页/尺寸/兼容专项；原未保存保护仍为基本正确性，若改执行边界须保原行为，不借机启动兼容项目。

## B5：再减少无意义的逐日持久化

executePublicWait只持有公开View，当前nextDate没有反馈意义分类；它不能通过读隐藏timeline/facts或未来模拟预测结果跳日。必须在业务公开投影端定义最小可审接口，区分确定日常累计、已知任务开工/完成、可回应回信、到期义务与原季度/交付硬屏障；未知或无法核定保守停点。分类不能预先披露未读结果或隐藏风险，更不能把日常meter当每次需要玩家确认的新决定。

所有真实逐笔账/费用/期限和Core停点保；选到未来日期不等于自动执行新业务。原同命令完整结果、混合反馈/并行旧约、readonly/候选/retry/取消/跨季分别核，现有public-feedback/public-wait tests须按实际新合同承接。只有公开接口与完整当前经历齐后才改范围合并，不能直接把当前requested改targetDate来跨掉中间可回应变化。

B4/B5都属于原U6审查揭示的必接工作，不能因后续需要设计就关U6或goal。之后仍原短文案/closed生态终态/17动作5共享系统美术与正常2025board/最终U6全审，完整U7/U8/CUX12与U9后原组合/T17余/PNG0of3/真人0/P3正式62与22not_run/M01须明确恢复/T18最后。本文是审查发现与下一任务边界，未完成上述开发/验收。
