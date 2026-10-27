# 待Root明确冻结与GO后的候选命令

以下尚未执行，也未创建任何正式audit目录/RootGO/最终registry。实际文件名和fresh rN由Root最后选定：

`rtk proxy node goal-1/evidence/t17-acceptance-37/full-create-preparation-r1/freeze-final-cut.mjs --registry goal-1/evidence/t17-acceptance-37/final-native-registry-r1.json --output-dir goal-1/evidence/t17-acceptance-37/full-create-audit-r1`

只有完整Root-approved registry、所有原producer停写、独立公开readback脚本/输入预期/官方源/依赖数定齐才可能完成freeze。模板故意拒运行。freeze只做文件和已保存receiptmetadata清单，仍不执行规则。Root独立读审该freeze结果/候选后，另写确切contract身份及独审报告的root-go并发本轮执行授权：

`rtk proxy node goal-1/evidence/t17-acceptance-37/full-create-preparation-r1/run-once-candidate.mjs --audit-directory goal-1/evidence/t17-acceptance-37/full-create-audit-r1 --root-go goal-1/evidence/t17-acceptance-37/full-create-audit-r1/root-go.json`

runner依次：原scripts/verify_normal_browser_exports.ts以新input snapshot→新report路径完整Create逐raw等字节；独立已注册publicReadback以U4B_AUDIT_DIRECTORY读同contract→readback-result。两者严格顺序、保存所有实际terminal，失败保原件；不并发重UI/type/build，不重开已活session。此处只展示命令形状，不授予当前执行权。

当前已cut范围只1个旧正常Create前史/3unique raw/7行capture/0新Create/1新保存（608分），其它后续输入尚未齐。实际完整historical command数到最终freeze元数据后才给，不编造预期。old fullDue/currentpartial各自同86前史独立分支。
