# 冻结期间候选；均未应用/未运行

manifest.json逐项记录原bytes/SHA/mode、候选完整文本/SHA、patch SHA和理由。每份patch为标准a/src→b/src unified diff，before与after全文均单独raw/txt保留；当前4个src仍逐字同全部before。

1. 01a只新增一个正常无资格affiliate回归，并给原beforeEach增加该title以复用原prepareReady。原三个case全文和prepareReady函数逐字保留的proof另存；不修改timeout配置。正常原Review→Publish(affiliate)→Advance统计，明确qualified false、permissionId null、原无settlement及原raw只随原保存命令变。首次只应用01a，在当前helper实跑新case保存逻辑红；此处尚未执行，不能预报实红。
2. 之后单独应用01b，唯一copy条件改为affiliate且公开qualified且cohortId非null。它精确沿原core/video.ts metrics事件的三个门槛；无资格发布没有订单观察，合法但实际零cohort也不编观察期，不新增资格或改统计/佣金规则。用相同新case核绿，再按Root决定复验原三case；不以候选代替实际检查。
3. 02将Today原精确三项改为精确work/life/video/market四项，另保原三方向各一次与video在索引2/screen video。原全部primary/source/raw/wait与每项无command/payload/focus断言均保留，不放宽成contains。
4. 03只给focus-book手工driver加VideoThreadAction import/同原action children(null)展开，所有原选择/取消/确认/无命令/raw断言不变。当前171整套保持原日志/源身份；只在Root核终态并授权后应用。

所有候选均不含全局配置、核心、P3、兼容、seed/钱/资格变更。没有启动测试、collector、浏览器或对src应用patch。输出记录仅原guard与I/O，不重开当前171检查。
