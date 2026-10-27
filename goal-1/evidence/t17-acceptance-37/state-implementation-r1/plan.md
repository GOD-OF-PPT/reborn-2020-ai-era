# U4-B公开原财务与记录模型实施

已全读Root37 input/plan/tasks和implementation-seams-r1，原状态设计按原时点保留。仅新增application/relay-casebook-projection.ts及必要test，修改ui/relay-records.ts并新增模型test。Root独占campaign/game-types和consumer/确认/保存，art/Editor另外独占。core/P326/三master/原root35/36不改。

先实现安全公开类型/纯投影（白名单签名仅此application内部），原客户/业务/义务/操作/任务关联唯一，复制已发生财务与已承诺未来日程，失败整片明确unavailable，原relay不变。再补纯UI记录元数据/中文kind/稳定排序/完整batch/客户申请充值实收续签/历史投入和对象vs站归属。UI不接rawsignature，不执行规则重放。测试只编写有意义来源/身份/金额边界与实际read model断言，禁止本代理执行test/type/build/browser/Git，静态审后交Root统一验证。

rollback为独立应用读片与UI模型文件前像，不改存档/schema/规则。只写本fresh证据目录，所有写前guard祖先；完成后冻结并报实际未运行边界，不以编写当绿测或U4-B完成。
