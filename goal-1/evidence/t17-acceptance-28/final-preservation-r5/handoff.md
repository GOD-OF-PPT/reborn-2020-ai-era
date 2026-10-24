# 可复验入口

当前最终结果：final-result-r2.json，exit0；checker身份见checker-identity.json。函数不写任何文件，不执行游戏或测试，不修改Git/index。仅当前原HEAD允许，后续HEAD变更明确拒绝，不能把此结果迁作新提交后验证。

当前完全不追加：在仓库cwd运行

    rtk proxy node goal-1/evidence/t17-acceptance-28/final-preservation-r5/verify-preservation.mjs

函数接口：

    checkMasters({mode:'exact'})
    checkPreservation({mode:'exact'})
    checkMasters({mode:'append',appends})
    checkPreservation({mode:'append',appends})

appends必须含且仅含goal-1/plan.md、goal-1/tasks.md、goal-1/t17-plan.md三个键；每值为{bytes:number,sha256:string}，身份只覆盖各自相对root28对应.baseline的确切新增尾部。请Root在实际自有append时明确构造预期suffix清单，不能以读取未知变更后自动当预期的方式规避审阅。mode append仍核完整旧前缀、全部mode、原P3在整份current唯一、原HEAD恢复及其它所有保全。

CLI追加复验：

    rtk proxy node goal-1/evidence/t17-acceptance-28/final-preservation-r5/verify-preservation.mjs --append-manifest goal-1/evidence/t17-acceptance-28/NEW_GUARDED_DIR/expected-master-appends.json

manifest为上列appends纯JSON map。CLI仅stdout/stderr，Root若落结果应先guard新输出目录，保原exact结果。当前没有实际append，append模式仅交接口，未宣称将来通过；封存后应新独立根记录，不能追加本目录。
