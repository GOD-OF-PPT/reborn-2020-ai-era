# U5体验合同与字段迁移（实现前）

## 六幕脚本与状态

|当前对象/阶段|主目的与决定|可见物件及真实下一处|原字段保留位置|
|---|---|---|---|
|未开/选择企业|看已到达的模型节点，再显选资本/原主体；未开不造制作费|服务意向纸/原节点日期，资本转移不计成本|Open资本、维护、账户和历史企业全在原册|
|材料/技术准备|显选本人与资源/日期；等自己的任务完成|展开材料夹/日期，完成只留准备成果|preparation.kind/job资源状态/成本/AP原引用|
|用途适配|显选实际模型/部署或培训并同意原虚构用途|用途对照页/许可签，完成不造供应权或客户|model/purpose/consentedAt/expiresAt/ready/job|
|有限需求|显选付费或原受众、模型用途与资源日期|寄出需求信/实际回信，人数不是成交|outreach.mode/sourceCohortIds/personIds/completedAt及每lead|
|具体客户需求|比较试点与标准原价/生产及支持投入、答复期；显选范围/资源/开工日或拒绝|客户来信与并列范围，原预览同时核生产和支持|lead/person/outreach/model/product/maxPrice/expires/status；scope/冻结价/支持|
|已约定/生产|看已预留与实际开工的区别，原资源/产能仍核|展开作品包与原日历；完成后亲手提交|原production/remediation/support各id/资源/AP/费用/start/complete/status|
|已提交/客户复核|等同一客户真实复核，不预告认可|寄出封套与原reviewAt；普通消息不改关注|submittedAt/reviewAt/accepted/deliveredAt/status全部原册|
|拒绝/补救|原反馈后选补救资源日期或取消原约；不造成功|退回稿与责任签，补救重排自己的支持|remediationJob/原冻结反馈/成本与新支持/退未履约原款|
|已验收/支持|确认80%收入与预款释放，独立支持仍须实际走完|成果单＋独立支持叶，等待/到期款可显选|balance.recognizedIncome/prepaid/AR、supportJob/postedAt及已发生费用|
|生产/支持应收|看原阶段金额、预款消费、原信用/到期/剩余，显选收款|应收单不是收据，保存成功后才留实收折联|delivery.id/contractId/stage/date/amount/prepaid/credit/dueAt/remaining/operationIds|
|完成/取消/暂停|说明本次实际结果和仍在的款/支持/补偿，直回今天或显选同企业新尝试|合起成果夹；只有真实未完责任另留叶|取消原refund/补偿、未清obligations、暂停与实际收尾不同原命令|

合作终点允许停留，不强制关企业、清全部余额或继续融资。结果后主/物件同一UI去向；新模型用途、客户、范围、资源、日期和金额都重新显选。两背景正常可达与部署/培训都保，权益另入原U6入口。

## 原能力逐项去处

OpenEcosystemService/资本、StartEcosystemPreparation(materials/basics)、StartEcosystemAdaptation(model/product/consent)、ActivateBusiness、StartEcoOutreach(paid/referral/sourceCohortIds)、AcceptEcoContract(pilot/standard)、DeclineEcoLead、SubmitEcoDelivery、StartEcoRemediation、CancelEcoContract、CollectEcoReceivable(amount/delivery)、StopEcosystemService、ResumeBusiness、WindDownBusiness、CloseBusiness、FundBusiness、InterruptJob/RescheduleJob及完整资源/日期/费用、原账户和招聘均保；前台新增直接决定不删除原DeepseekPanel/DeepseekShared/EquityPanel。完整原Pane包含明确架空融资与全部权利，U5不把这些默认接成生态下一步，不改规则/投影/schema。原客户编号仅阅读标签，目标始终原id，筛选不重编身份。

## 最小模块与接线

- ecosystem-scene-target：严格run/account/business/kind/record，匹配同份DeepSeek公开投影及operations业务/任务；拒重复、未知、跨账户/混种、getter/多余字段和失效目标。无目标是方向入口，不按另一业务修复指定目标。模型/用途沿原记录解析。
- ecosystem-player-thread：从同对象公开阶段组织目的/终点/动作/等待/结果，属于OpeningFocus新增生态种类，存UI书签且恢复重核；已保存显选命令才跟新对象，AdvanceTime保同对象，原纯DeepseekSceneProgress/权益旧入口完整保。
- EcosystemMoment/SceneChoice：复用RoomTableau/原Dialog分页/ResourceSelect/CommandButton/ClockAdvance/makeSharedAction。主念头和物件共用绑定；近景只做当前取舍，显选草稿跨取消/翻页/原册往返同身份保；异步保存按run/业务/原实例围栏，候选/冲突保旧。Today/本季书签/季度原记录一起接，不把人生连续性延期。
- EcosystemPaper：同桌面镜头的来信、约定/成果包、支持附叶、回信/收据及停止合拢，文字与金额保持DOM。普通/hover/focus/disabled/readonly/unsaved全态有底色文字轮廓，复用原场景资源不套利润卡；明确新SVG纸材与原kit统一责任，不宣称新raster或声音。

## 不变量与核验

原预款50%不是收益，生产验收80%和实际支持20%分别确认，原credit应收与实际收款分；已取消/已拒绝是真实业务结果，不保旧成功。暂停新增不意外取消履约；真正收尾/中断/退款/已验收支持补偿各过原确认，0AP/缺钱不隐藏原退出和义务。只读能翻但不能写，candidate/retry实际原子链不变。公众记录不含collection日期时，不按当前日补造历史；若使用原公开finance transaction须以同合同/账户与原来源唯一绑定，并保预款与应收收回两种性质。未知保理由，不兜底0或另单。

测试分纯身份/阶段/保存跟随、实际consumer原payload/草稿/同绑定与对照原旧UI能力；原官方正常场景fixed normal-deepseek-s04-v1只用于合法前史，夹具只证明孤立条件不冒Native。当前自然Chrome实核同一连续前缀完整合作、受挫和保存保护，逐次图/AX/原确认/原文并存；不改尺寸/做滚动或几何专项。原Create回放和公开读回各保独立scope/原红。任务9结束后C-UX09另为完整累计，不能被本片单测替。

[杠精审查] 设计准入通过：原全部能力/字段和完整经历/TA有明确去处，无已知省略；当前仍无本轮产品通过或真人认可。
