# R7玩家文案与同账户入口门槛

仅VideoSceneChoice.tsx及其现有test改变；OpeningObject/CSS逐字未变。准确差异见player-copy.diff，最终hash/源码见final-source.json与source/。

客户选项改为询价序号和“已有受众→安排制作→等待客户反馈”，去掉取证口吻；选择/请求仍用同一personId与cohortId。纸页不显示客户/记录ID，原完整Panel仍保身份核对；记录用实际接单/开工日帮助翻阅。适度精简原/公开/本局模拟等重复，保全部金额/AP/日期/资格、预款保护、应收/实收、费用/欠款和退出责任。未改变页序、事件回调、载荷、固定footer、动画或兼容规则。

根追加授权修同一失效账户门槛：contextReason先核view.accounts存在；无target的非personal查看上下文必须先显选内容账号/切回个人账户，不能用创建账号绕过。目标存在时仍核同owner。payload parser函数逐字不变，因调用该门槛获得同一UI上下文保护；原normal case已补无target未知账户/非personal创建null与现有owner冲突断言，30秒时限未动。显示文案断言同步，不重复重型normalchain或strict，由根统一末批跑。

原R6 2/2绿及所有红保留，不冒称当前新增断言已执行。根统一type/build与实际Chrome，源码在此冻结。

证据writer首轮把Buffer序列化为JSON，导致copy-bridge.json错误比较而红，源文件未漂移。原序列化前像及该红均保留；decoded-before/已从其data还原，逐bytes/sha与写前before.json一致。R6 source/也为同一writer序列化副本，原hash仍准确；本R7已提供正确字节前像与最终源码，不原地覆盖旧副本。
