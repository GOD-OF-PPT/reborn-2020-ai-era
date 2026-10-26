# R9 限定美术与纯呈现 delta 复核

结论：本次实际看过的九张完整图与最后两份源差分中，未发现新的实质阻断。该结论仅属于这些具体组合；不是所有状态、真人理解/趣味、整体美术认可或兼容验收。准确路径、JPEG编码、原图与当前源 SHA 见 [identity.json](identity.json)。未运行测试、类型检查、构建、浏览器、Git、几何或兼容检查，未修改产品源。

## 当前实际画面

| 实际图 | 可见事实与限定判断 |
| --- | --- |
| c03-r9-original97-visible-four-one-of-two.jpg | 新增“4名留存学员、已交出1/2段”已在主幕；Apr1—8原教学、0元/1点/7日且已预留未实付、累计预款995/实退199/保护398/收入398仍可见。主Clock至Feb1及个人已知待付4000、原班记录按钮、探索和前景原册入口都未被新增段挤出。两段教学纸签仍区分已交付/已安排，样课套件与小托架相接。 |
| c06-r9-original98-late-update-real-obligations.jpg | “已经来不及按原约定交完”与已交1/2、原教学/退款责任可见；原更新期限Mar21、退款窗口Apr29及995/199/398/398保留。此图处于Mar31季度末，主操作是季度留页/下一季书签，不将缺少普通推进Clock误认新缺陷。纸件仍显示第2段原已安排，未画成完成。 |
| c09-r9-original120-actual-closed-and-next-choice.jpg | Apr30实际结清、留存4/5、结算费实付39.80、预款995/实退199/保护0/教学收入796可见。回今天/另备课程均为明确去向，May1原Clock与个人待付4000、整班原记录及前景来源入口仍同幅。已交两段与结清日期纸签没有混成新实收。 |
| a11-abort-old88-paper-zero-protection.jpg | 实际旧88保班期0/5、累计预款/保护/教学收入0；尚未保存与原物件说明、禁止新操作的理由可见，未先显示新学生/995保护。原恢复入口在顶侧“查看处理”。该图是独立保存失败验证图，不是普通游戏假警告。 |
| a12-original-retry-saved89-protected-students.jpg | 原retry后才出现5名实际学员、保护预款995和教学收入0；原支持/教学期限仍保留。真实回响未收起，原第1段资源日期操作、Jan20 Clock、记录/探索同幅；未将报名画成已授课或收益。 |
| o01-fresh-content-investment-wish-and-object.jpg | 投资开局用原市场资料与放大镜，说明未来未知；主动作准备自己的判断，旁路核生活储备，不出现强制首单物件或实际买入。日期与原记录入口完整可读。 |
| o06-fresh-free-calendar-no-firstorder.jpg | 自由开局用空日历，明确不必立刻接单或买股；主动作选择时间、旁路看已有安排，未画首单或新承诺。 |
| o10-r9-first-letter-readable-date-and-zero-cost.jpg | 首单原报价1300、制作500/1点、尚未接单实际0及Jan5答复/Jan19交付分组可读；日期纸条已恢复纸底深墨。来信落在原书堆/浅托架上，不再高悬；原工作仍是另一个显选决定。 |
| o11-declined-real-result-zero-spend.jpg | 实际婉拒、未支付制作费或占用行动清楚；旧报价投入要求标为原要求，保回今天/了解其它尝试以及Jan6 Clock。中性收起物件未出现收益/完成收据。 |

本次图均保前景与正文独立，kit不再位于人物头肩/窗前；小托架或原kit支撑与背景桌面形成相接关系，明显矩形暗幕已消除。纸白/深墨的日期、保护与结清签可读，原支持/退款/期限没有依赖AX隐藏。仍保同一房间与左侧念头的表现语言；这些图不能证明玩家一定理解或认为有趣，也不将可读/可见代替实际点击、存档和原文核验。

## 最后源差分

R8→R9构建前源身份清单只出现 OpeningMoment.tsx 和 u0r-continuity.test.tsx 两份差异。对当前OpeningMoment移除唯一 currentCohortContext 定义与唯一首段出版节点后，SHA精确回到注册前的 691eeff0faf597420c31d057fe9595b5d8586ba9fd6db8578c84a69d3198c5f6；不是凭描述推断差异范围。原sceneLine/detail/money、共享动作及保护路径没有删除。

currentCohortContext只在meaning有效、同cohort无jobId、非history且!courseComplete时发布。meaning前置保interrupted/requiresChoice/legacy和run/account/有效身份核对。候选/只读仍呈原committed事实，不产生新学员/新承诺；已暂停课程的既有班期允许说明仍在的原责任，不等于恢复招生。真实已结清班期沿既有closedCopy，不把准备或后来成功结果倒灌原97/98。

u0r-continuity新增的是独立真实原97导入fixture/清理和一个实际OpeningMoment→RoomTableau段落出版case，不调用sceneMeaning自证。它先核4名留存/两段已交一段的真实投影，再核实际发布段落、Apr1—8、0元/1点/7日、已预留未实付以及995/199/398/398；原request/导航/完整原档不变和原时限继续保留。本次只读其差异，未重跑或借此声称新回归通过。

## 纯文本与减少动效范围

最后两源delta未改原显示设置路径：App的textOnly/reducedMotion偏好及class、OpeningMoment对RoomTableau/OpeningObject传p.textOnly、OpeningObject在textOnly下保完整action文本及notes、RoomTableau纯ReactNode slots和CSS文本回退、opening-play及room-tableau的减少动效规则当前身份与R8相同。详细逐文件同源身份见identity.json。新增事实段对文本与普通模式使用同一公开事实，不走独立业务分支。本次没有再次切换设置或播放动效，故只确认源码路径未变，不冒新的Native模式验证。

[杠精审查] 通过本次限定图/源差分审查：已逐一检查新增段后的操作、原责任与原Clock可见去处、保存前后旧新区分、非成功与开局差异；没有以绿色测试、fit、素材存在或截图推导全局完成。正式真人、全状态、U0-R其余业务验收及整个goal仍由主控保留。
