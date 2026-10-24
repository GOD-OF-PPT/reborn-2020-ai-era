# U3-V模型交回（生产冻结）

仅两生产与新video-player-thread.test.ts改变；旧video-scene-progress.test.ts逐字未改。新stage：video-affiliate-window / video-platform-payment-wait / video-platform-collect / video-platform-paid。原VideoSceneProgress仅command union新增CollectVideoSettlement，payload原settlementId、confirm true；其余签名保持（Input只收窄实际读取的video/workbench字段）。

focused publication沿同work/channel查原publication与settlements：统计不是终点；带货原7日观察、未来应收wait、已到期明确原Collect、collectedAt实际结果分别显示。原平台GMV/应收/现金/费用分开，未称全账号结清。videoFocusOpen保持同对象未付原费用与平台待续；resultDate取同对象实际公开最近作业/提交/发布/统计/收取/下架日期，过滤未来。saved mapper核同run新revision/真实saved原receipt、拒候选/只读，Collect分别核原contract delivered→settled与原platform null→collected，再反查原publication/work/channel，不选latest/别单。

结果：首批2文件17/17（36.69s），最终new文件4/4（11.43s）；旧progress14项源与进度生产字节未在后批变更，18不同case分批，非一次最终18全跑。原红均保：正常错季逻辑红、fixture projector误用红（明确不是模型失败证明）、补正后的2平台逻辑红。正常新局/controller跨季发布；F02独立平台/商单真实命令、原phase world_update后原Collect，二者证据身份分开。只读/候选边界为public projection反例，不冒充本轮Native head.put abort。

全局严格类型/生产构建/Chrome仍由root统一。Root接VideoPanel共享稿及VideoThreadAction/Today，不得以此模型结果代替其接线或人类体验。原126引擎全范围由root基线/最终审核绑定，本子目录只核9原输入中的7只读项与owned源。

- src/ui/video-player-thread.ts 10532B SHA256 da72036aea631359cfa5831164110773c612a3f18e2a34ae6fbb74a4279af1b6
- src/ui/video-scene-progress.ts 25629B SHA256 47113682c0bccd794eea1b073569af182ed4ddfb14fd1335583f37364885885f
- src/ui/video-player-thread.test.ts 12432B SHA256 01ea2f2e466c039eaf3569e3a0fce99cb189cf2cd8f422f9719034df7938a1d3
- src/ui/video-scene-progress.test.ts 13641B SHA256 fc9dd02dc57f5c9a5dc49d03f685869a55cc33be706120728d40280f40c8d55e
