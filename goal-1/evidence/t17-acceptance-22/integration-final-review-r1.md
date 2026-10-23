# S2正式集成只读独审 R1

结论：当前读取版本存在两处确定断点，已即时通知根；本代理未修改src、未运行测试/浏览器/Git/兼容。根cumulative-r1正在使用冻结源，R1登记问题不等于修复或最终验收。

1. **P2：loaded但公开重匹配失效，可被旁路保存重新指向。** App.tsx:124 的focusRequiresChoice只判偏好解析invalid/unavailable；OpeningMoment.tsx:47虽用thread.focusStatus显示重选，App.tsx:87保存回调仍可推断。可复核路径：shape合法、个人market entry(entityId=null)携无关manual-content businessId的偏好被loaded；原册实际PlaceStockOrder保存后，seasonFocusAfterSave把这个entry绑定成新order，App:91自动rememberFocus，绕过明确重选。必要修缮：全局门槛纳入新公开投影rematch invalid；纯helper也对invalid existing原样保留，不能借保存修复或换对象。根已确认，等待解除冻结后分工修复。
2. **P2：首单planned/running从随身日历走到AI视频，丢原合同。** SceneJournal.tsx:37只在awaiting_submission/review/delivered建quarter+contract目标；planned/running走:39通用operations.jobs。manual-content原route为ai_video（content/operations.ts:11），所以这条原工作导航到video且无recordId，近景会显示AI视频准备/其他作品。必要最小修缮：job.id===firstOrder.jobId时传quarter/personal/原contractId或jobId；也可扩专门首单行并从generic排重。其他业务原导航保留。

只读核对中未发现以下连接另有确定冲突：

- App:118按run/phase/quarter加载独立偏好；:125显选重新匹配当前公开投影；候选/冲突gate保旧焦点。保存失败/损坏原文与游戏保存状态分开。
- App:88先处理focus再检查activeTab，导航途中完成保存不会仅因离开原screen丢焦点；:116/:181传完整真实payload，:187原candidate retry沿failedScene原kind/payload。实际相邻提交还由纯helper核revision/receipt/saveStatus，读资料不执行关注推断。
- helper同目标命令返回原existing引用；App:91再比完整规范身份，避免Cancel/Stop/Interrupt同ID把旧季标签改本季。旁路或强制责任不替代已pin主对象。
- OpeningMoment:48—58独立优先pause/缺口/到期义务/强制事件/风险；处理后仍读原pin，普通新邀请不抢。SeasonRecollection:27不slice剩余责任，全部来源节点另有分页入口。
- OpeningMoment:80—95为实际结果或零AP提供原Clock出口；季末先留页，SeasonRecollection:14—18只沿原atQuarterEnd/nextQuarterDate与ClockAdvance。进入新季不自动WorkQuarter/交易/生活；终季原Ending入口与有限尾声保持。
- QuarterPanel:32—34对旧employment专属只读显示原payroll，不冒充新季工作；lifeWorkTarget带原jobId，完成/旧约定inspect直接原LifePanel；market同ID仍经NarrativeScene原目标/完成研究分支与原册。

此结论只覆盖源码连接语义。实际Chrome发现→选择→等待→回响→重进、故障/只读、视觉焦点和可理解度仍由根后续核验；不声称全游戏、人类试玩、性能或兼容通过。

读取时源码身份（SHA-256）：
```text
src/ui/App.tsx 958761bba2c787c3da9814407672cd457610c81b1ba45d78502405d5211dd4ee
src/ui/OpeningMoment.tsx 6b77a2771428a127ebbbd083dc04d4dbf151e2e34bdbb5b51c7bd33125d369bd
src/ui/CinematicRoom.tsx ca48734483b43a6e9aed492715931b0c7368e66e7e3e6fb23b2f40696ed77b94
src/ui/SeasonRecollection.tsx 4d1c4637865d466e3c4f7f3642fe9a150bee3d30a8f676f8d64bed1890f32b15
src/ui/SceneJournal.tsx 9a82cea17e0db0a127c2a221d3c407cccea3bd41e350c5601275a335146aa554
src/ui/QuarterPanel.tsx e033b3843ae6e162d41387eba946a66b63f2da4798e3f9f229ff68031c93ba94
src/ui/player-thread.ts 86aebb80798ff824b4dcfa1bbc3294d46699b76105d49904ce2965b24a7f234f
src/ui/season-thread.ts 17d0c1d0b436ffacd4aa7c280a5f5e781b5444b79c611b98b245554136c7ae68
src/ui/season-focus-preference.ts 7f4f06b6cee959e62c7c1470757e6ebc81fad295fe0d7b031397edce6235d340
```
