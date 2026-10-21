# C-D10 检查工具与未来登记

本登记不执行检查，各 mode 均 not_executed。109 个 src 测试文件中，book-layout.test.ts 原两个多宽分页用例完整保留并暂停，其余 108 个以显式清单进入 all-noncompat。实际搜索只命中该文件的分页宽度调用；其余 screen 为路线字段、股权“窗口”为期限，没有其他视口/缩放/跨浏览器/原生离页专项。新/删/改名测试必须先告根代理更新登记，再冻结，不能自动漏入或漏掉。

接口：rtk proxy python3 -B goal-1/evidence/t17-acceptance-15/run-current-check-r1.py MODE rN [--after rN:MODE ...] [--serial]。支持 targeted-scenes、all-noncompat、game-ui、rules-save、typecheck、build、tool-tests、validate-content、docs-text、docs-plan、docs-competitive。每次一个 mode，输出 checks-rN/MODE，必须全新；build 另用全新 .delivery/t17-d10-ui-rN。all-noncompat 必须 --serial，由根代理确保不与浏览器/重工具并行；runner 拒绝同 root 仍活且无终态的其他检查。--after 显式依赖必须双 exit0、无 metadata/validation error，且其冻结输入仍同；否则本次不启动。所有非零退出必须阻断依赖的后续封存/提交；文档历史红档也按真实1保存，不改称整仓绿。

沿 root14 原 runner 扩展：动态 task root，所有祖先至 / 的 sealed/链接、root/index、原 browser_evidence_guard 和 fresh wx 保护；每轮保存原 runner/命令/stdout+stderr console/真实 status before+after/身份/源输入 freeze/JSON 原 report/终态。冻结全部 src/public、scripts、配置锁、AGENTS/README/docs/planning/manifest、当前工具/三文件与静态 ?raw 原输入；普通文件 nofollow 流式 SHA 并核读前后 physical identity。?raw 先词法定位后物理保护，不预先 resolve 跟随链接。前后精确核测试库存、源输入集合与冻结字节。原断言/时限/隔离不改，仅 --maxWorkers=1。资料脚本自身仍按原逻辑扫描全仓，冻结范围如上明确，不冒称所有动态输出也冻结。

JSON 汇总保存真实 files/assertion statuses/失败原报表，不把 pending/skipped/todo 当通过；区分 wrapper/driver 退出。runner 不串联或自动封存/提交。tool-tests 是原 Python 工具单测，validate-content 是原内容检查；docs 三项是原资料检查，不是游戏验收。本轮仅 AST/compile 语法与命令静态检查，不运行 runner、游戏/单元/浏览器/兼容检查；源码/config/旧目录不改。
