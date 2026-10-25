# U4-A只读保全核验

依据root33 baseline与旧清单，精确核对P3的bytes/SHA/mode、root19文件/目录/模式集合、120普通marker与2符号marker、root32和post全部payload。三master以开工HEAD真实blob与原唯一2304B/14LF插入及当前登记自有suffix分别校验，HEAD和index均只读。

脚本只允许向本fresh目录wx写结果；遍历使用lstat不跟符号目录。120marker的全树枚举排除当前root33，不能把本次增量当旧集合。旧root32/post marker自排除仅根marker，本身另按baseline核字节与mode。读取输入初末绑定，发现任何不符保留失败，不修旧证据。

不执行封存、stage/commit、push、浏览器、业务命令或测试；结果仅为本次实际保全核定，不是最终封存或产品验收。
