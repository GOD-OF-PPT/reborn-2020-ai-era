# 独立静态准入：可交Root明确GO后执行一次

**未发现本R2候选的确定阻断；允许Root在另行写入准确GO后执行这一份、这一次历史输入派生。此结论本身不是GO，也不是已执行/已生成101。** 全文只读复核了15949B/e110aa4af59927db2d1804daf8c1f4c9208dd7e25b54f96f9c217b6282ce7689的derive-prefix-once-r2.mjs、272688B/29ec8b11cfc43c219901734f30b4e977342b00c3f49b1bd96a49059d97a1e767的frozen-contract-r2.json关键完整条款/声明清单、exec候选、原118/101前缀审合同及复用io源码。没有执行候选或语法检查。

## 准入逐项核对

| 合同 | 候选的实际静态路径与结论 |
| --- | --- |
| 原来源 | 原118固定2900985B/SHA73a542da47b270f9e02d533003ac6f8c803907037b586f0f29d5393ec49458fb/0644；当前实际hash/模式同。原manifest第2行line SHA与entry及seal唯一源entry均精确同，不是从说明文字猜saved_ui身份。 |
| 唯一历史 | try内只1个createCampaignRun调用，采用原run/actor/background/profile/Create commandId；原seed仅作为这次官方Create必要依赖传入，不显示/扫描/评分/替换。随后只original.receipts.slice(1)的117条原命令，原payloadSignature、commandId和revisionBefore交同codec.registry evaluate；每条须proposed、原receipt逐字段同、codec roundtrip。 |
| 101来源 | 到原revision101仅保raw不可变字符串于内存，原AdvanceTime末commandId与合同精确匹配；不删corrections、修改ledger/checksum/余额/AP，也不回退持久头或另Create。继续同一重建的旧102—118只为完整来源核验。 |
| 118先闭合 | 步数117、最终codec.export字节===原sourceText、原source SHA及101已捕获同时成立，才fullEndpointByteEqual=true并读取101公共前置。未将原118末现金/保护/供应资产填给101。 |
| 101身份 | prefix codec自洽、原前101条完整receipt/签名字节、run/actor/background/normal/versions/profile和Mar7 playing日期都核；retained prefix是1Create+100post，原完整历史是1Create+117post，两层计数分开。 |
| 已公开目标 | 同唯一business/account/station/period/customer/meter/audit；168计量、168实际Mar7完成audit、0更正、同报告1112/已公开实计1011及原价6/供价2/供应cedar-direct/Feb7来源均先核。这里读取的是原101官方features.relay已完成audit/已公开meter，不访问run未审meter.actualUnits、隐藏需求/facts/queue。 |
| 原102性质 | 原第102条是CorrectRelayPeriod，而非旧单条Usage。原last101和next102 commandId/日期/期身份与前缀审一致；未来UI单CorrectUsage产生另一条102，不能拼接旧整期102或旧118。 |
| 绑定 | 当前实际官方源127、依赖901、P326、引用35全部bytes/SHA/mode同；源/依赖精确路径集合也同，P3清单与root37原baseline26同。执行前重新由sources/dependencies及固定引用/GO/本独审身份取样，执行完/发布前再比较，任何漂移禁止通过。901包含原Node二进制hash及zod/@noble/hashes整包；本审未运行Node version查询，未来候选强制v22.12.0。 |
| 读写/符号链接 | io.read拒仓库外普通输入并沿所有父路径拒symlink；sources/package遍历拒symlink。当前声明清单实际文件和父路径symlink0。输出固定新同级run-r1，父祖先真实guard、已存在拒绝、mkdir后再guard；每个文件guard+wx，不append/overwrite旧root/helper或新持久头。 |
| GO身份 | 产品dynamic import在exact contract/operation/authorizedBy=/root/独审文件身份、所有初始绑定、fresh output以及Node版本检查之后。未授权模板authorizedBy/null及independentReview/null不能过。当前GO文件/run-r1均不存在，本审没有替Root写GO。 |
| 失败计数 | creationAttempts只在真正调用Create前增；creationCompletions在函数正常返回后增，不冒初始codec/全历史验证已过。每个step先attempted、再记录实际commandResult、仅receipt同且codec roundtrip后记successful；source history数量1与真实attempt/completion数量分开。中途失败保steps/实际计数/差异/error，不发布可准入prefix。 |
| 发布角色 | 最终full118/public101/绑定齐后才public-facts、replay metadata、provenance、raw101；provenance明标derived_normal_prefix而非saved_ui，先于raw且requiresPassedResult=true。result.passed还要求published/full endpoint/public facts/终态零漂移。raw仅存在不算准入；I/O失败留下文件但无passed result时仍禁使用。 |

## 执行时仍须遵守的原合同

- Root须在本静态结论之后另fresh guard+wx写accurate GO，绑定本报告或判定文件的最终path/bytes/SHA/mode及原R2合同身份；不得直接改模板或以本报告充GO。GO只是由Root发出的显式授权数据，候选核文件身份但不解读自然语言判定，所以Root应仅在允许结论下发GO。
- 仅execution-candidate.md中的R2脚本与固定run-r1；不要预创建脚本的run-r1（会按设计拒），不要执行保留R1或第二次Create。初始GO/绑定/Node/fresh-root错误可能在try和run/result前直接throw，须由Root外层保真实argv/stdout/stderr/进程句柄终态；脚本自写terminal不替代实际进程exit。
- 正常来源逐字不等、原命令拒绝、公共101目标不符、源/依赖/权限身份漂移或输出I/O失败，一律保原失败停止，不复写重试或删除原失败，需Root针对具体错误另fresh有据处理。未执行语法检查不等于语法已验证；真正执行前后仍以实际终态为证。
- 只有result.passed=true且published prefix身份与provenance一致才可原UI导入；当前prefix bytes/SHA仍未知。本审不发游戏命令、不把旧negative输入当当前positive分支的新单更正。

## 证据、独立性与不包含范围

metadata-before/after是纯文件读/hash，不是127源或901依赖的运行通过；原126源旧完整Create报告只证明当时历史，不能代当前127。旧118前缀的business ops:60e1e4f1a8f744bbf167073569038995、account ops:d85d2aa1cc29968ea1f91bb3f0d29ad2、period rly:503e6b6995b626f7c3bec7a0dd02e180与来源Mar7必须保持；不能仅凭同runId或101/102序号拼当前不同日期/经营主体的分支。

本审阅者未编写此派生候选，与state候选作者分离；但此前参与过游戏UI/consumer测试，故不称整个项目完全作者隔离，也不是真人理解或美术认可。只读静态审及新同级证据写入，未执行node--check、codec/projectors/evaluate/replay、工程检查/Browser/Git，未改source/旧文件。Node仅在每次新增证据前实际调用既有祖先guard，文件wx新增。

[杠精审查] 本静态准入通过：没有省去完整118锚定、原101公共合法前置、失败/角色计数或真正GO；未借目录存在/旧报告/源码自审冒本轮历史已回放。当前U4-B/R2/R3/C-S4-R、主positive实际单更正、原PNG/真人/P3/M01暂停/T18及整个goal均不因此关闭，compat0。
