# S1正常三路径与最小接缝

本轮只读AGENTS、root21三文件、docs36及下列当前源码/测试；未运行游戏、测试、浏览器或Git，未修改src。以下是源码导出的预期与待实施按钮映射，不是三路径已实测。后续集成以root21固定的新实际源身份重核；原P3不在本审查中扩展。

## 共通入口与金额基线

Home的“开始一段新人生”→背景/愿望→“下一步：看看本季的选择”→三种安排→“开始新人生”，调用controller.newLife，最后一项必须在完整Create保存后才进入App。profile保存wishId/approach，不自动工作、接单或买股。两背景均初始30000元，1月1日生活费4000已处理，初始现金/可花26000元、本人共享4AP；技术/内容工资分别为每整月8000/6000元。来源：src/ui/Home.tsx、src/application/game-controller.ts、src/content/bootstrap.ts。当前RoomMoment未按approach分首幕，投资/自由仍可见首单，这是S1要替换的表现入口。

## A：首单，最短实际闭环

独立新局approach=first_order，不需要先工作、研究或创业。RoomMoment→CommandButton→App.request→原preview/确认→submit→Session已提交view。

| 当前按钮/阶段 | 原命令与载荷 | 公开日期、资源与真实结果 |
| --- | --- | --- |
| “接下这笔手工单”→“就这样决定 →” | StartFirstOrder {} | 1月1日确认；报价1300、制作500、1AP，1月5—19日。此时只预留500和1AP：现金26000、可花25500、可用3/预留1/已用0。 |
| “等到这份作品开工 · 2020-01-05” | AdvanceTime {date:'2020-01-05'} | 到真实开工才付款500并执行1AP；现金25500、预留0、已用1。原ClockAdvance保留“先核对”，不强造每次必弹窗。 |
| “等作品做完 · 2020-01-19” | AdvanceTime {date:'2020-01-19'} | awaiting_submission，完成制作但收入/回款仍0；原交付屏障保留。 |
| “把作品交给客户”→原确认 | SubmitDelivery {contractId:本单实际ID} | 1月19日亲手提交，0新增AP/费用，status=review；不能只等到1月20日当作已提交。 |
| “等客户复核 · 2020-01-20” | AdvanceTime {date:'2020-01-20'} | 原customer_response和collection可在同次原子提交完成；实收1300、成本500、净800、个人现金26800。无额外“收款”命令或可停留的中间应收。 |

工作可另点“先保留这一季的工作”→WorkQuarter {}，占2AP且月末才发薪；它不是首单前提。拒绝/跳过用DeclineOffer/SkipOffer {offerId:'manual-first-2020'}；过期不补收入。CancelContract {contractId}开工前释放预留，开工后保留成本/AP；InterruptJob {jobId}也不退款。逾期提交仍按DELIVERY_DEADLINE_MISSED处理，取消/保留作品不是成功。来源：src/ui/RoomMoment.tsx、src/core/first-order.ts、src/content/first-order.ts、src/core/operations.ts。

## B：投资，委托到后续撮合即可持有

独立新局approach=investment。当前可走“机遇”→“走进A股AI股票”（ARIA；画面为“走进这一幕”）→NarrativeScene的“选择一份模拟委托”。表单实际名为MarketSceneChoice，不存在独立MarketOrderChoice导出；S1可直接复用此组件。

| 当前按钮/显选字段 | 原命令 | 预期 |
| --- | --- | --- |
| “这次使用的账户”选个人；“选择模拟标的 · 衡川算力”→“填写买卖条件 →”；“买入这只股票”，100股、限119.88元、有效至2020-01-10 | 本地MarketSceneDraft，尚无命令 | quoteId读取当时公开值，正常1月1日为initial-2020-01-01；到期载荷是SIM-CP-2020-01-10，不能传裸日期。显选/返回不占钱/AP，不泄露下一价格。 |
| “核对并提交买单”→“就这样决定 →” | PlaceStockOrder {accountId:'personal',symbol:'SIM-AI01',side:'buy',quantity:100,limitPriceFen:11988,quoteId:当前值,validUntil:'SIM-CP-2020-01-10'} | 0AP；只冻结12000元（11988本金＋最低佣金12），现金26000不变、可花14000；pending且fills为空。 |
| “等这份委托的下一次撮合 · 2020-01-10” | AdvanceTime {date:'2020-01-10'} | 当前正常内容在该点有119.88覆盖价和足量：100股实际成交、买费12、现金14000，持仓成本12000、市值11988。此为测试预期，只在实际推进后揭示，不写进开场提示。 |
| 持有/翻阅本委托与持仓，仍有下一步 | 不要求卖出 | 1月10日持有100、当日可售0；原股交收到1月11日才可售100。买入没有卖款应收，不能用“现金回款”庆祝。 |

“只预留为计划，暂不下单”用PlanStockOrder，再由“提交这份模拟委托”用SubmitStockOrder {orderId,quoteId}移动同一预留；最短路径可直接Place，不必先Plan。挂单余量用CancelStockOrder {orderId}，释放冻结不是收入。未成交/撤单/持有均可结束本次尝试，不要求盈利或清仓；已知研究可选ResearchMarket {definitionId:'market-overview'}，0元/1AP/1日，不是基础模拟交易前提。来源：src/ui/MarketSceneChoice.tsx、src/ui/market-scene-progress.ts、src/core/market.ts、src/core/market-projection.ts、src/content/market.ts。

## C：自由，七天休整为最短真实反馈

独立新局approach=free。当前“环顾房间，想想别的可能”→“床边 · 生活”→NarrativeScene“留七天给自己”→“留出七天休整”→原确认，调用StartLifeWork {kind:'rest',personId:null,reference:null}。1月1日起、0元、1AP，状态running而非已完成；现金26000、可用3/已用1。“等到这次安排完成”的原ClockAdvance→AdvanceTime {date:'2020-01-08'}，实际completed/result=rested，仍26000元、已用1AP，不返AP、不加关系或收入。原册另有“确认留出七天休整”，同一命令；不需要先设SetLifePriority，不需要认识新人物或创业。lifeMode必须保留rest，不能回到默认唐萤活动。

工作是另一条合法自由循环：“先保留这一季的工作”/“查看这季的工作安排”→WorkQuarter {}，0即时费用、2AP；1月1日确认并实际在岗到1月31日，AdvanceTime到原月末才有8000/6000工资，现金34000/32000。中间若出现原暂停/决定就走原处理，不把章节翻页当完成。为缩短S1当前窗口验证可先采用休整闭环，工作作为受影响定向回归。来源：src/ui/NarrativeScene.tsx、src/ui/LifePanel.tsx、src/ui/life-scene-progress.ts、src/content/life.ts、src/application/life.test.ts。

## 最小同对象导航与防误报

- App.navigate当前会清video/course目标并把lifeMode重置person；NarrativeScene的marketSelection仅在本组件保存run|account上下文；marketSceneProgress收到不存在的preferredId会静默改选，RoomMoment又只抓active市场/生活事项，成交/休整完成后容易丢焦点。S1将当前线程放在App本次导航状态，至少携带runId、screen、accountId、businessId（可空）、entityKind/entityId与当前公开阶段；市场用原order/position/settlement ID，生活用rest选择及创建后实际job ID，首单用合同/任务实际ID。阶段每次从当前已提交记录重算，不冻结旧阶段。
- 打开同对象原册时传该身份，返回仍定位它；命令提交前仍controller.prepare原revision、重新preview。旧目标跨run、账户不受控、对象消失或不可公开时显示invalidfocus原因及显式重选，不偷偷换个人账户/最新作品，不以nextStep=null当完成。查看、选择偏好和返回不执行规则命令；S1不做S2的持久关注sidecar，不写run/profile或改schema13。
- 强制中断单独决定当前显示：Session未保存/冲突/只读→真实pause/现金缺口/交付屏障→原线程。保留被打断目标，处理后重新核有效性再返回；全部原欠款/风险/约定继续展示。普通新消息不覆盖线程。不能为了回到线程自动ChooseEvent、接单、补钱或跳过AdvanceTime中间结算。
- App.onSubmission/committedEcho继续按同run、新revision、saved且无candidate发布结果；本地hover/选择/确认与Session保存/失败状态单独响应。1月20日失败仍显示旧review、0收入/回款；原retry只保存原候选，成功后再展示同一结果一次。导航中提交完成也不能拿别的screen/账户的回响冒充当前对象；重进展示已提交事实，不能重收或补播成新利润。

## 可复用与受影响累计（建议清单，本轮均未运行）

| 层次 | 复用范围与理由 |
| --- | --- |
| 正常创建/规则 | src/application/entry-profile.test.ts核愿望/approach不赠资源；src/application/first-order.test.ts核两背景实际首单、非成功出口及Jan20中断/原重试；src/application/market.test.ts只取旧Q01正常下单、时点/过期报价、部分成交/撤余量、预览不抽随机的定向用例；src/application/life.test.ts取两背景七天休整及中断保成本。 |
| 当前场景/结果 | src/ui/RoomMoment.test.tsx、src/ui/market-scene-progress.test.tsx、src/ui/life-scene-progress.test.ts、src/ui/scene-play.test.tsx中的实际生产/只读浏览、src/ui/clock-advance.test.tsx；src/ui/NarrativeScene.test.tsx取交付屏障/原责任/只读、src/ui/SceneEcho.test.tsx与src/ui/scene-domain-results.test.ts取同run真实结果、市场/个人完成与原子abort。纯SSR只证明文本/绑定，不是按钮实点或趣味性。旧RoomMoment/CinematicRoom中free仍期待首单的断言须随三开局合同改成真实方向，不为保绿继续保留错首幕。 |
| 保存/导航回归 | src/application/session.test.ts四个候选/并发/只读/冲突用例，src/application/game-controller.test.ts的正常创建继续、src/ui/App.preparation-save.test.tsx的原白名单草稿隔离；新增S1定向断言：三开局不同首幕、同对象往返、非法/过期焦点解释、强制中断返回、完成后仍同线程、确认取消不变、共享AP只显示一次。 |
| 原正常首季 | src/testing/market-normal-scenario.ts的playNormalMarketQuarter保留Q01=27000与实际订单；它包含学习，不是最短S1现金目标。首单两背景正常测试与rest正常起点可直接复用。src/testing/story-harness.ts的at默认自动工作，休整纯路径必须work:false；MemoryWriterAccess与abortAfterHeadWrite用于存储层失败，不能冒充真实浏览器。src/testing/market-fixture.ts是隔离财务夹具；normalLifePeople长前史不作本轮新局按钮证据。 |

随实际改动运行上述受影响测试和类型/build，不先全仓穷举。排除所有移动/窄屏、多桌面尺寸、resize、zoom/200%、跨浏览器、几何/可见区域专项及原生离页用例；不执行旧页面兼容脚本或M01，不将它们改名成普通桌面测试。当前窗口实点/原生保存/导出回放仍由root21后续步骤另取证。本文件不声称任何测试通过，不关闭原P3/62/22或整体验收。
