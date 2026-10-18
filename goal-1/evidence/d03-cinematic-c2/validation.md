# D03电影版C2最终验证索引（限定范围通过）

用户已选A长日重启，错误参考已撤回。本阶段接续[编码修缮计划](../../cinematic-encoding-repair-plan.md)，C1正式美术检查点为799ff2c17428cd981a8af029cd88ee83a11cffc6。原生、规则、存档、工具、资料和真人范围分列；此索引不是完整游戏验收。

## 已验证

| 证据 | 实际结果与范围 |
|---|---|
| [C1证据保全](c1-checkpoint-readback.json) | 332份已提交C1证据逐字等于原SHA/Git blob；不向旧journal追加。 |
| [新守卫先在旧码执行](encoding-contract-before-result.json) | 4项公开Codec兼容性守卫通过。原红测是C1完整原时限失败，未调整。 |
| [编码改后定向回归](encoding-after-result.json) | 新4＋旧Codec/hash共16项通过；原SHA-256校验和、header、非规范顺序、Unicode/孤立代理码元和canonical UTF8扩张上限保留。 |
| [类型](typecheck-after-result.json) | 实际0退出。 |
| [新源/复用范围](candidate2-source-freeze.json) / [差异](source-reuse.json) | 293文件冻结；唯一旧源变化为Codec实现，新增4守卫。全部UI/美术/业务/规则/原79文件/根配置同C1字节。 |
| [完整原准备链比较](preparation-comparison.json) | 同命令/种子/三原封套逐字同；Node实测relay无明显改善，payroll/risk在这一对观察中wall约下降12%、user约下降9%。不当作Vitest/浏览器或唯一原因证据。 |
| [C2重放C1真实导出](c1-cross-replay/native-audit.json) | 15原UI/6正常输入/7字节对/293不同完整命令都同原字节。是跨源语义审核，旧59观察仍属于C1。 |
| [独立构建](build-result.json) / [生产35资源](production-manifest.json) | 实际build0；35个HTTP资源与固定构建逐字相同。 |
| [新原生报告](native-report.json) / [新完整前史审核](native-audit/native-audit.json) | C2实际18项/18迭代，11UI导出/3输入/6字节对/79不同完整命令逐字同；生产/DEV和C1跨源证据分列。 |
| [静态安全复核](static-security-review.md) | 不改全局canonical/copy/SHA、钱/日期/RNG/权限/格式/版本；公开未知对象路径保守，内部JSON.parse路径保留全校验与回退。不是替代运行验收。 |

C1完整累计的475通过/20跳过/1超时和3失败文件仍在[原报告](../d03-cinematic/cumulative/cumulative-results.json)。本阶段未提高原60/120秒时限、未关闭隔离、未换种子或预制前史。

## 累计与最终收口

[原3失败文件复验](original-failed-files-result.json)已终态0：3文件23项原配置/断言/时限/隔离全部通过，598.51秒Vitest实际wall；这不是完整500通过。C2独立构建及新原生保存链已通过；[累计8步](cumulative/cumulative-results.json)全部0退出：完整Root默认顺序80文件500项（原496＋新4，原断言/时限/每文件fork隔离），60工具、内容、102份Markdown/原规格、独立build、Life10/Playable2。完整单测实际1535.17秒，原三个失败文件先已23项复验通过；不宣称所有硬件/负载下时钟永远稳定。

[完整性](integrity-before-commit.json)核对旧跟踪文件、新293冻结源、C1证据332原SHA/Git blob、C1/C2各35固定HTTP资源及累计构建原字节同；准确旧文件计数见JSON。[视觉对照](visual-review.md)与[最终GJ/REPEAT](gj-repeat-review.md)另列。检查通过仍需真实本地提交/任务完成记录，准确SHA与状态见Git及tasks；不将Node/旧照片/生成图当完整游戏或用户试玩验收。

## 上层待办与边界

C1三桌面/59项观察的实际范围和63迭代见[原生报告](../d03-cinematic/native-report.json)。1920目标的4份原生JPEG返回1910×1080，DOM前后1920×1080，原字节未裁剪/缩放；精确例外保留，不伪称原生1920像素或200%缩放。T15原生200%/离页/FCP、T16完整24季度/结局、T17原PNG0/3及真人0、M01最低优先级移动和T18最终review继续待办。旧P/W/Q/X整体不自动done，没有真实模型/交易/收费/融资或公开部署，不推送。


## 素材与运行时身份

[已选A原话](../../game-art-options/selection-input.md)，[三备选提示词](../../game-art-options/prompts.json)，[电影版生成提示词](../d03-cinematic/prompts.json)与[资产来源/尺寸/哈希](../d03-cinematic/assets-manifest.json)均保留。原图在assets/ui-redesign/cinematic，肖像在assets/ui-redesign/portraits，均内置imagegen；生产JPEG只编码不裁剪/改尺寸。原始三PNG仍0/3，生成稿不是其替代字节。

当前固定C2生产为本机5234，新源码见candidate2-source-freeze；C1固定5232与所有旧证据保留。DEV5233故障 seam和真实读者单列；生产捕获warn/error0。显示/选择/导出不改原存档，实际head.put后abort/原候选重试/物理旧档/完成才换景/重载均有独立源身份。完整goal继续，下一任务按原顺序T15收口；移动兼容末位M01。

工具日志中的PRIVATE/create/push是原60工具单测的FakeCommands/临时目录输出，不是真实GitHub操作；仓库实际owner/公开性/远端main在本地提交前后另查，不以这些假输出声称发布。
