# 本任务的 Chrome 原生回退操作记录

依据为2026-10-31当前真实Native记录，适用本机Chrome和本任务存档；不是跨平台验证。

| 重复流程 | 依据 | 选择 | 原因 |
| --- | --- | --- | --- |
| 固定源码、既有完整文件、类型构建和HTTP字节核对 | 391—397多轮实际result/manifest | 复用已有freeze/check-source/engineering/prepare-serve/check-http | 已覆盖，不另建skill或automation |
| Native完整存档导出、同身份原文检查与有保护的独立测试分支 | 333/候选337/branchB340与339实际文件及action记录 | 补本任务操作记录；继续用game-playtest和evidence guard | 实际反复发生；全局跨项目稳定性尚无证据，不扩成独立全局skill或agent |

1. 绑定当前真实Chrome库存。Debugger unattached时保现有browser；metadata标记仍可用。不能由空列表/旧数字ID猜断连，不改权限，不重复Game命令。
2. NativeApp每次读取完整AX（disableDiffing:true）；核完整URL及期望日期/revision/对话框。全量读取会重编号，只从本次字符串解析按钮数字。diff曾漏更新；不能据nochange重发。
3. 已有原保存/候选/备份分别保全，不拼原文。读原导出/原备份后，在Storage原数字页码中用真实click→Command+A→type页数→Tab翻到下载页；不依赖AX setValue触发React。
4. 下载打开系统Save：核建议类型和本次Name控件，改成新的唯一文件名。Command+Shift+G后先读实际路径输入框，核完整任务目录，再Return回Save，核新的文件名和当前Save按钮；先查目标不存在，再保存。不对尚未出现的sheet连续type/Return。
5. 从明确保存的本机文件读取bytes/SHA/revision；保存独立pin，再启动原Kernel后缀核对。原始字节不修剪、不重写。
6. 本轮原生文件选择未取得输入，不继续为此做页面兼容/原生离页专项。可用原空textarea粘贴完整原333：仅当空、正确origin、正确原文SHA时NativeApp.paste；该API恢复用户剪贴板。核完整字符数，再原“检查存档”；只在同人生/原日期/恢复说明明确后作一次受保护确认。
7. 所有真实保存/恢复/等待只发一次。超时、正在保存、按钮消失不能当失败；观察原请求。读取/回Today只算UI行为；candidate不画成saved。
8. 当前自然窗口截图核同次URL/日期/状态与完整画面；主旁动作、探索/Clock/地点均可读才交此片。不改尺寸/缩放、不开兼容矩阵。
9. 每份分支原文和命令ID独立，封存后不追加。主档0写、真实actor/readonly、全原文、原retry和作者故障证据分别保身份。

本轮未创建全局skill、custom agent或automation；Native fallback的跨项目适用性仍需更多证据。
