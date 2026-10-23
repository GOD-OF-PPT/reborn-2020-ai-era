# 限定只读交叉审

来源：/root/game_design_sequence 的本轮实际消息，仅审候选，未执行Git/测试/候选/浏览器。

“未见新增确定缺陷。feature master用原HEAD+当前baseline后的C2 suffix，P3仅工作树保留；record再取workingSnapshot后的新suffix接feature blob，没有把原C2 suffix再拼一遍。seal exact文件/目录/模式与仅根marker自排除、NUL feature名单逐字绑定、stage0/OID/逐blob SHA+Git mode批读逻辑均闭合。”

“一个需精确表述的事实：record-masters的stage目前是git add -f --逐argv，不是NUL pathspec（独立argv+--本身无shell拆词问题），别把两轮都描述为NUL。”

交回采用该区分：feature阶段用NUL名单绑定；record阶段用--后独立argv，均不经过shell拆词，不扩大stage范围。此审读不证明真实Git流程已经执行。
