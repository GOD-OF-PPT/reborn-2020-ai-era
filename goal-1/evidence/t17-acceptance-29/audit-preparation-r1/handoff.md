# U2 完整Create审核已准备，等Root最终导出通知

固定调用（尚未执行）：

```sh
rtk proxy node goal-1/evidence/t17-acceptance-29/audit-preparation-r1/run-audit.mjs --output-dir goal-1/evidence/t17-acceptance-29/normal-export-audit-r1
```

重跑换fresh rN，不覆盖旧目录；Root确认全部导出停止后才实际运行。内部唯一replay仍原scripts/verify_normal_browser_exports.ts，以NATIVE_EXPORT_INPUT_DIRECTORY=root29直接读取全部直属chrome-*目录下exports.jsonl，从各run原Create/seed/profile/完整命令重挣，逐字比较。不得把导入buffer/candidate/只读/重进原文算新saved成果，不固定最终Create或文件数量。

复用原root28 run-audit-r2（11409B/SHAab34e98fcd0199675ae29c199ffc569ba0e88677e80a92fe4fc033afe1f4a1ea）且不改旧文件。新代码仅输入与基线根/错误名称和角色声明调整：严格直属目录，普通chrome-*.json诊断文件跳过、symlink拒绝；五mandatory file/origin/source/bytes/sha256、原bytesSHA/可选runId和revision/null addendum、codec形原文全部登记覆盖、来源/输入前后与fresh输出日志/terminal沿原审过实现。

角色只按source开头明确SAVED_UI/PHYSICAL_READONLY/IMPORT_BUFFER/UNSAVED_CANDIDATE冒号声明；origin只保捕获位置，绝不作role。没有明确source声明就unknown，不看文件名猜；artifactKind若与明确source声明冲突会拒绝。最终还须独立核原native日志/源身份并写artifact-roles，不能拿相同canonical字节推断物理只读或候选时点。官方inputBuffers仍沿旧origin统计，不能把其0解释成无buffer或全部saved。

当前preparation-input-observation仅记录主/续开两manifest的已有前缀；Native追加不受影响，不冒称最终覆盖。没有读取浏览器DB/隐藏DB文件、浏览器工具、core命令或游戏状态注入；只读可见FS导出/声明与源码元数据。

source-binding实际126官方源码与root28已通过report、root29 baseline共同项均0变化，旧helper保持。syntax-result实际node --check exit0；仅语法，不是完整Create通过。复制生成首次因严格缩进文本匹配断言停止（尚未写wrapper/未replay），preparation-attempt-r1.json保留，随后精准匹配同代码行生成，不放宽原checker/核对规则。

最终wrapper 11797B/SHAdfda09ff445a9ebcc9b3522d368c04c7d65b76c7663f8fb2ad79b79be528bad7。等待Root明确最终exports齐通知；本owner现不启动完整审核、不动生产/masters/Git/旧sealed/原P3/兼容。
