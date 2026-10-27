# 独立反例逐项注册，不改变门槛

仅把单it内8个独立public quote反例的for循环改为顶层const+it.each，每例保原fixture/update/state、同Reader/Clock/原model链与全部断言。原4其它it逐字保持，8反例不删。各例独立建立props/request/hooks标签，仍共享原只读已导入Controller；每例比较exportSaved原字节，若发生污染才需额外隔离，不为降低时间改产品或规则。

beforeAll依旧20000ms仅原2raw导入setup；新各it不传timeout，继续原默认5s；不以延长单it、改配置或把反例包进20s解决。预注册后原5总case成为4+8=12，新增计数来自展开已有反例，不冒新增覆盖。

三小项：1.三文件/原红/前像；2.单test精确结构变换；3.静态保原4it/8fixture/断言映射、源首末与边界复核，交Root统一检查。Node只JS guard；所有新证据wx。无工程/type/Browser/codec脚本/Git；其余红原件及责任保，compat0。
