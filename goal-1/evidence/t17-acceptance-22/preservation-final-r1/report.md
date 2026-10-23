# 独立保全检查交回

本次文件保全核验终态exit0，错误0。检查输入/原始授权在input.md与inputs.json，可复核实现check.mjs，逐文件期望/实际/比对结果在result.json，命令/原输出/终态在command/stdout/stderr/execution文件。这里只运行授权的只读文件保全核验，不执行游戏、单元测试或兼容/浏览器/HTTP/Git/服务操作。

- 两封存原格式均先读取确认，按各marker的selfExcluded=sealed-evidence.json仅排除自身：root21原269/现269，post原11/现11，新增0/缺失0/非普通文件0；全部bytes/SHA及所记录mode=420(0644)匹配。mode核stat.mode&0777，不扩张为其它元数据。root21 marker当前SHA另与post原feature-commit-readback锚点相同；post marker自身按其合同排除，只记录当前身份，未声称自证其原字节。
- root22开工408基线：从原冻结R4差异识别已登记12处S2 UI路径，明确排除、完全不读取当前这些活动UI文件；也不读新增7份S2 UI来源，不做全415冻结。其余396份bytes/SHA全同，包括269份非UI（core105/application66/persistence19/content13/testing57/config7/asset1/main1）及127份其它未改UI。基线不记mode，396份历史mode均不声称已证。完整排除名单见result.baseline.excludedS2Ui。
- P3：原封存指认7已改源＋根提供18既有untracked源＋原vitest配置共26份均为原位置普通文件。18份有baseline/S1源哈希，bytes/SHA保持；8个scripts没有这些原清单哈希，只记录存在、当前bytes/SHA/mode，不推断原字节不变。tracked/untracked身份采用根原范围指认，未运行Git核当前状态；原P3/62关键/22例行不称测试通过。
- goal-1/input.md仍为61字节，SHA-256为20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1，与post原锚点同。
- root19原input/plan/tasks均存在，当前身份已逐一记录；本核验输入未提供其原哈希，不冒称原三文件历史字节或全部root19证据集合已独立证明。实现只向fresh preservation-final-r1写入，未覆盖任何原P3/旧证据。

[杠精审查] 通过（上述限定范围）：两个marker格式/集合/权限字段按原件核，未把baseline无mode当mode通过；未把8脚本当前存在当历史逐字保持；未将文件身份保全夸大为P3测试、当前Git状态或整体验收；R5活动UI留给根后续源/产物核验。
