# HTTP 适配独立只读复核

结论：在本次读取的两份核验器差异和实际保存结果中，未发现原保护断言被放宽，也未发现把旧前史误记为新游戏进展的执行逻辑。只创建本文件，不执行核验器、HTTP请求、浏览器、测试/build或Git；不改任何checker、产品源或旧证据。

## 核验器适配范围

比较原 root34/http-preparation-r1/http-readback-final.mjs 与当前 root36/http-preparation-r1/http-readback.mjs，差异只有：

1. 工作证据根34→36、构建固定为 .delivery/t17-u0r-r9，构建前后authority指向本次R9。
2. 输出仍限制当前证据根的全新同级 delivery-readback-rN，所有原guard、wx、普通文件及树拒绝符号链接保持。
3. URL从原三个声明端口收窄到5387；仍只准http本机根路径，无查询/fragment/凭据，GET禁止redirect。实际结果入口是 http://127.0.0.1:5387/，没有改旧origin或操作浏览器存储。
4. extra发现增加本轮declared-unit-inputs.json、test-gate-identity-r2.json及declared.inputs；保原runner、baseline、scripts、planning和源码?raw发现。该定义与run-long-step-r2第10—13行实际清单一致，不忽略新引用。实际保存的build-before、HTTP input-before和input-after三份extra均158，路径/bytes/mode/SHA规范化后完整相同，extraDelta为空。
5. native registry换成本轮native-inputs.json；旧notNewNativeHistory布尔合同适配为本轮确切role字符串“known previous saved-history input; not new UI progression”。仍核每份path范围、普通文件、bytes/SHA、可选mode和公开runId/revision头。当前登记6份旧前史：ready86/service85/promised97/late98/closed120/dueService83；不能据此说本轮新走了这些历史。新exports角色与旧prefix分别登记，当前checker不执行重放或新命令。
6. 成功构建错误名改为U0R；实际冻结、exit0/sourceUnchanged/extraSame/authority.extraSame及build参数断言保持。

其余源/extra/105core/P326前后同源、19原图完整集合、kit唯一映射、46产物逐字节GET及根alias、两明确normalID、33DEV与当前seam一致、raw路径/有限指纹/framework扫描及前后authority/legacy保护的原断言均保留。

## 已保存实际结果的范围

实际 [result.json](../delivery-readback-r1/result.json) 为ok true：584源、158extra、105core、26P3在before/after及build/baseline对照均same；source/extra/core/P3的added/removed/changed清单均空。46个产物请求加1根alias共47GET，保存响应全200且bytes/SHA相等，根alias等同R9的index.html；19幅图逐字节映射原资产且完整集合相同，原relay kit保持。

marker记录保恰好2个明确normalID和当前派生33DEV，normal/dev命中0；有限泄漏扫描为320源路径、634路径/文件名变体、86份JSON原文的checksum及首/中/尾和JSON转义窗口，path/raw/framework命中0。这个0只属于这些明示literal/fingerprint，不是任意信息流、动态加载或所有可能存档内容证明。没有新增normalID，没有把原史算新Create，也没有从HTTP读取推导画面、游戏功能、性能或兼容通过。

### 来源措辞边界

marker-inputs.json保持原root34的normalRunIdAuthority和历史来源身份，其中旧“current”文字仍指C-UX06当时。当前脚本另将root36/native-inputs.json的真实身份写进marker-scan.currentNativeRegistry，并核两ID与当前registry的run头一致。因此报告应把root34部分称继承的历史依据、root36字段称本次登记核对，不能将继承metadata说成本轮新ID授权、新Native历史或新的全生命周期验收。这是报告归属边界，未发现执行断言因此弱化。

## 前置失败与身份

adaptation.json明确保留首次字符串适配因重复替换前提中止、candidate尚未写入时syntax读取missing的准备失败。该失败不改写为坏candidate实跑，也不删除；本次未重跑syntax或实际HTTP。后续实际result与当前helper字节已核对应，不能抹去早期失败。

- 原helper：19563字节，SHA256 c673cf319c5da9d99d592c46a4b999d2175ff69318843a691cf8f8657c69b772，与adaptation注册相同。
- 当前helper：19771字节，SHA256 66177b5f98dde47b078ee858e0aab5720ff3efcdff52a97caa453df61c5467ea，与实际result.checker及adaptation注册一致。
- 原marker：4938字节，SHA256 75ab66392540c5c02e5249467382f2940cdeaf1aba55fd5819be7e43de425199，与adaptation注册相同。
- 本次marker：4938字节，SHA256 75ab66392540c5c02e5249467382f2940cdeaf1aba55fd5819be7e43de425199；继承原marker字节保持相同。
- 已保存result：2432字节，SHA256 5d1ea1a00193f998ec43ca4e7cde220f8b6e1f5c74b5e53e7c37dd705bf295fe。

本文件是独立只读审查记录，不是又一次47GET或原文/存储/画面/真人测试。未见本范围阻断；所有其他T17、原PNG、正式真人、暂停M01、T18与完整goal责任继续。
