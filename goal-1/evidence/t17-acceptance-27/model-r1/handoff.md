# R1 模型冻结交回

详见source-final.json与source/原副本；owned实际6文件变动，relay-scene-clock.test原字节同只参与定向。Root接App/Narrative/Journal，book接原册与shared draft，art接thread/season/preferences；我未改其文件。

固定API：relay-scene-target导出RelaySceneIdentity/RelaySceneTarget/RelaySceneContext/RelayTargetResolution；resolveRelaySceneTarget(relay,target|null,context)、relayTargetReason同参、canonicalRelayTarget同参、relayTargetEntity(target)。canonical不补字段，valid返原引用，entry/invalid返null；reason区分。context={runId,accountId,operations:{businesses,jobs}|null}。

relaySceneProgress(relay,date,target?:RelaySceneTarget|string|null,context?)：undefined仅旧初入；显式旧string缺失/错context invalid；null显式入口；object严格原实体。原phase只新增invalid，新增target/invalidReason/historical/outcome/resultRefs/recordId/wait/intent。ResultRef kind为job/business/application/audience/customer/period/meter/audit/correction/receivable/operation；intent service仅显式business规划，audit仅原period可审。明确job/meter目标只看原对象；terminal原job不跳到后来重排，显选回period后才新委托。

relayWorkTarget(relay,runId,jobId,operations)只唯一反查原service/support/audit或application/marketing；多期audit batch无唯一period返回null，Journal须明确批次/原期重选，不取首期。准备/迁移/requote的细分原册定位留原入口/R2，不虚构新的target kind。

目标不按company true或跨ID领域值互不相等新增限制，只核相应来源集合唯一、company/account/route/definition两公开投影一致。已closed/settled不判无效；新操作仍原preview；本期有到期原单时CollectDue文案明确客户全部到期单可跨期。只有原source关联触发本期收款，新增更正dueAt不重推。

正常候选：normal-candidate-read.json是当前codec只读import/project，原r91 1143084B/Jan27/0period/Q1可3AP/可花26077.42，原Create来源见root11原验证；本轮未重播多年Create。新test只在正常r91执行受影响小suffix；另F04明确独立个人账户夹具，不称normal。Root仍需Session只读/候选/完整Create/真实Chrome与所有适用累计验收。

当前未解决确定生产问题：本owned范围未见；剩余边界是根/原册/thread集成与实际交互验证，不能由这28项替代。原P3/root19与所有兼容专项0保持。
