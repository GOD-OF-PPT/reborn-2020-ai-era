# R2 导入原文边界 API

仅用于本轮 root14 审核分支，不修改原 scripts/verify_normal_browser_exports.ts，不改任何原输入/exports/错误日志。

classifyAuditText({folder,file,origin,text,replayedCanonical,sourceText,binding})

binding 为当前审核器固定清单中的一项：{folder,file,origin:'import_buffer',sourceFile,bytes,sha256,terminalLf:0|1}。sourceFile 使用项目相对路径。模块自行计算 sourceText 的实际 UTF8 字节长度和 SHA256；调用方须从该绑定路径实读 sourceText，并将清单、该源文件与模块纳入审核源/输入哈希冻结，禁止从待验 row 自行生成可信清单。本模块不进行文件读取或完整 Create 重放。

非 import_buffer：只接受 text===replayedCanonical，binding/sourceText 必须为 undefined；不能拿输入清单给保存原文、候选、物理档或重载放宽边界。

import_buffer：必须绑定精确 folder/file/origin，sourceText 的实际 bytes/SHA 必须匹配绑定，text 必须逐字等于 sourceText。terminalLf 只能0或1，且与源尾部一致；拒绝CRLF。然后只允许 text===replayedCanonical，或 terminalLf===1 且 replayedCanonical+'\n'===text。没有 trim、宽松JSON重序列化、丢弃缓冲或修改源字节。

返回：comparison 为 exact 或 source-bound-single-terminal-lf；byteEqual 为原输入与 replayedCanonical 的实际逐字比较；originalSourceEqual 为 import时true、非import时null；originalTerminalLfSeparately 仅在唯一末LF差异被单独接受时true；originalTerminalLfCount 为import时0/1、非import时null；bytes/sha256/canonicalBytes/canonicalSha256 保留实际两组字节身份。拒绝时抛出 AuditInputBoundaryError，code 为稳定原因。

汇总必须报告 originalRawAllByteEqual=false（只要存在这两个LF输入），另报告 strictSavedExportsByteEqual、canonicalFullCreateReplay、sourceBoundImportBuffersPassed 与 terminalLfDifferences。不得把 role-bound passed 改写成原18/所有原文 allByteEqual=true。真正完整Create/完整命令/来源冻结由调用方原算法继续执行，不由小模块测试替代。

测试含纯字节负向边界与实际两份LF/三份无LF输入；实际输入测试只做原codec导入导出和角色边界，不执行CreateRun/命令、浏览器、兼容或真人试玩。
