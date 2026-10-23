# S1 根集成只读审阅

2026-10-23。审阅当前 `App.tsx`、`OpeningMoment.tsx`、`CinematicRoom.tsx` 及其实际调用的命令、日历、交易选择器；未改src、未运行SSR、测试、浏览器、Git或矩阵。三Panel仍在独立代理收口，本轮不读取或认证其未完成版本。以下行号绑定本次读取，后续修缮须另核。

## 确定问题与必要修正

### [P2] 首单待提交的豁免同时屏蔽了其他强制责任

位置：`src/ui/OpeningMoment.tsx:39–45`。

`ownDelivery`只检查关注是首单且状态为`awaiting_submission`，随即令`interrupted = responsibilityOverrideNeeded && !ownDelivery`。因此，只要正在看首单待交付，就算同时存在原pause、风险、现金缺口、到期未付或强制事件，也不会用原责任幕覆盖；逾期的awaiting_submission同样被豁免。原`RoomMoment.tsx:27–30`明明先返回pause/风险，这里仍会选回普通thread并呈现其原操作。

`App.tsx:144`的SceneAttention不能补足：其弹窗允许关闭，关闭后主幕仍被上述布尔条件选错；它不是从此处移除责任优先级的依据。

修正：仅豁免“当前唯一责任就是这份尚未逾期首单的交付屏障”。独立判断其他强制原因；有任何其他真实责任时仍使用attention/fallback，保留原focus以便处理后返回。不要把普通已接受人物约定改成强制中断。定向核首单待提交分别叠加pause、真实缺口/到期义务、强制事件；不能用核心命令最终会拒绝代替前台优先级正确。

### [P2] 有效关注的主体与顶部可花账户可以分离

位置：`src/ui/App.tsx:64,70,79,140,146`、`src/ui/OpeningMoment.tsx:91–94`。

关注更新只调用`setOpeningFocus`，顶部数值仍取独立的`selectedAccountId`。例如，玩家在原账选择某企业账户后回住处，再明确选择个人工作/休整；或在交易选择器显选另一账户并成功保存：thread已指向新实际主体，HUD仍显示旧选择账户的可花及标签，直到另一次带accountId的导航才可能同步。根本规则命令仍走原preview/主体，本项不声称扣错钱；问题是同一决策幕的当前主体与主现金信息不一致。

修正：S1主幕HUD按有效thread焦点主体读取，或在明确关注切换/保存跟随时同步该账户，并覆盖无内存focus时的公开记录恢复。失效关注须保留解释，不能猜另一账户；原账页面仍可独立查看各主体。定向核“另一账户原账→回房间→个人安排”和“另一账户真实委托保存→回房间”，确认焦点、账户标签、可花及原确认主体对应同一账户。

## 本轮源码核对成立的部分

- 完整payload贯穿直接提交和确认提交（`App.tsx:101,151`）；失败上下文保存原kind/payload/workspace（67、80行），原候选retry重新传同一payload（142行），没有重新prepare原业务命令。
- focus保存跟随发生在activeTab检查之前（79—81行），因此仅导航离开不会丢掉该成功操作的身份。模型仍检查同run、相邻已保存revision及真实末条回执；候选/只读/旧revision不被当新结果。
- run切换清空内存focus（94行），未新增偏好sidecar；无显式focus的重进由模型读取已提交当季公开记录。明确focus的失效理由仍保留，未在查看时静默替换对象。
- 首单、工作/生活及市场均沿原CommandButton/preview/request/submit链；`OpeningMoment.tsx:49`传完整inspect target，`App.tsx:146`向原册/市场传recordId及主体。Panel对这些目标是否最终拒绝或定位正确，本轮保留给其独立收口与后续交互验收。
- 主场景及物件近景共用同一个MarketSceneChoice（`OpeningMoment.tsx:71,80,89`）；近景也把同一openOrder传入originalAction，先合上物件再开原交易选择，不另造默认委托。取消确认可回到该组件内草稿，实际交易仍须规则校验。
- 自由快捷休整已限定`thread.stage === 'choose'`（67行）；`review-choice`没有被组件换成另一条休整命令，而落到模型的显式回看入口（69行）。

修缮上述两项后仍需由根代理做相应交互与真实Chrome小循环。代码阅读只证明当前接线的明确行为和断点，不证明实际画面、键盘、候选重试体验、完整三路径或真人理解度通过；兼容开发测试继续暂停。
