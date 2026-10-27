# 同一U4-B内部：显选回应的接口与草稿

本子项只拥有未来新增relay-response-draft.ts、RelayResponseEditor.tsx与必要测试，当前仅设计；Root拥有App/game-types/Panel/消费者接线。先完整读root37三文件、逐幕稿、原preparation草稿/原CommandButton/shared-action与33映射和核心相关payload，确认只接现有公开命令，不改规则/旧代码/P3。详细合同见design.md。

风险：跨主体或子对象窃换、同发票不同父入口丢稿、空金额变0、后付旧预款误删、失效人选被过滤后仍提交、资源/日期自动替填、保存失败冒完成、旧闭包仍请求。按严格公开归属、canonical同对象UI记忆、空初值与原preview/confirm/save防护；缺少关联明确拒绝，原记录旁路由Root提供。

拟验证纯金额/身份/草稿与实际consumer原payload、原确认和原只读/候选/冲突，不写镜像CSS测试，不运行兼容/几何专项。所有tests/type/build/browser由Root冻结源后统一跑，本代理不执行。回滚仅删除本片新文件，保原数据、草稿外部记忆所有权与其它代理文件。
