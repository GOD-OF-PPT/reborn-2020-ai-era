# U4-A新服务重新显选：源码冻结交回

已最小修改2生产文件及其2现有测试，精确身份见[source-final.json](source-final.json)，原前像见[source-before.json](source-before.json)，完整差异见[changes.patch](changes.patch)。本代理未运行测试、类型或构建；Root统一验证，不能把静态交回当绿测或Native通过。

RelaySceneDraftScope仅新增可选readonly generation:string。relayDraftScopeForTarget在严格同run/account/business/station目标有效后，仅为service计算同business全部公开已保存period IDs排序后的JSON；不取最新账期，不读隐藏对象、date或revision。relaySceneDraftKey仅对service带generation时追加该段，audit原7段字节保持。新period真实保存出现后新服务读空新槽，同挂载步骤回到第1页，客户/供应/资源/日期/容量/预算/支持均不预选；旧已提交槽及原草稿不删除。候选失败仍是旧公开ID集合，因此同key保稿。普通等待、翻页、取消和辅助保存未新建账期时不换key。

原RelayServiceChoice的6case和纯Map的5case全部保留；原每条expect所在行、原显式20s共3处（beforeAll/原正常保存/零预算）逐字保留，没有新加或抬高时限。新增2case沿默认5s：纯Map新旧服务隔离且audit原7段同；原真实91通过Controller和IDB head.put后abort/原retry验证候选保稿、saved新槽空白、旧槽保留，并对原92真实AdvanceTime前后同scope断言。现有正常保存case增强同挂载空新稿与旧公开view保旧槽。导入属于原正常前史，非本轮完整Create重放；两份旧原文bytes/SHA/mode初末同，不制造新earned资格。

fault fixture在原beforeAll20s内先用原物理store导入完整91，再挂原abortAfterHeadWrite与正常Controller继续；失败属于StartRelayServicePeriod，非导入。原服务payload/preview/CommandButton/即时保护及所有原money/AP/date/core/P3/Schema均未改。

[杠精审查] 静态接线范围通过：代际来自全ID集合，不按日期清稿；只影响新服务，audit目标不变；旧槽可读，候选不发布，原断言/时限未删改。实际默认时限、Controller故障/重试及全源检查仍由Root统一执行。生产4文件已冻结，不再继续编辑。
