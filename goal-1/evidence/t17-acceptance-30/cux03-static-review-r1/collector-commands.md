# 五个原collector调用准备；未执行

工作目录固定 /Users/gordon/githome/reborn-2020-ai-era。等待当前171实际终态及Root排程后，串行执行以下五个独立步骤；没有后台并发、sleep、配置或时限调整。当前五个输出目录均不存在；临运行须再guard root30并核fresh，不预先把已存在目录当可覆盖目标。root30/run-step-r1.mjs为已建立的原runner最小根路径适配，不改任何共享工具。

    rtk proxy node goal-1/evidence/t17-acceptance-30/run-step-r1.mjs cux03-kernel-r1 npm run evidence:kernel -- --output-dir goal-1/evidence/t17-acceptance-30/collector-kernel-r1
    rtk proxy node goal-1/evidence/t17-acceptance-30/run-step-r1.mjs cux03-save-r1 npm run evidence:save -- --output-dir goal-1/evidence/t17-acceptance-30/collector-save-r1
    rtk proxy node goal-1/evidence/t17-acceptance-30/run-step-r1.mjs cux03-first-order-r1 npm run evidence:first-order -- --output-dir goal-1/evidence/t17-acceptance-30/collector-first-order-r1
    rtk proxy node goal-1/evidence/t17-acceptance-30/run-step-r1.mjs cux03-market-r1 npm run evidence:market -- --output-dir goal-1/evidence/t17-acceptance-30/collector-market-r1
    rtk proxy node goal-1/evidence/t17-acceptance-30/run-step-r1.mjs cux03-video-r1 npm run evidence:video -- --output-dir goal-1/evidence/t17-acceptance-30/collector-video-r1

这些npm脚本原样调用node --experimental-strip-types。沿现锁定依赖/支持Node版本即可，无新安装或外部服务。原evidenceDirectory拒绝sealed祖先、符号链接、已提交/暂存的任务根、已有匹配产物；工具会创建fresh输出。它内部只读git ls-files/cat-file，collector内部只读git rev-parse HEAD，不stage/commit/push。原脚本默认输出旧goal-1/evidence，必须传以上显式新路径；失败保留部分产物和stderr/源身份，下一轮用新r2，不清旧目录重跑。runner的log stem也须fresh wx。

- kernel：原Q01独立会计fixture，现金2700000分/投资值1100000分/最低现金1100000分/行动4，重复确定性原断言。依赖planning/playable-spec.json与implementation-baseline.json读取/哈希。它不撮合订单、不检查employment/IDB原子保存或浏览器。
- save：base registry/codec的preview不变、原回执去重、改载荷拒绝、陈旧revision与独立fact/RNG/行动断言。另有硬输入goal-1/evidence/t04-browser-native.json：taskId T04、nativeFactory true、passed=total=46；还读取t04-browser-native.jpg与tests/t04-storage.html。本次仅读存在性/元数据，JSON7623B/SHA1db6cbb9c73616c188c079fde9007ed3d2a59882a6b74e2aafb44353d89dfafc，JPG57438B。原脚本将46检查明确称historical_report_only，不会新跑IDB/native两标签/物理旧新/abort/retry；不能把该历史引用充本轮原生通过。
- first-order：七个固定正常原Create分支：technical/content成功、拒绝、略过、过期、中断、未交付。先原WorkQuarter再手工单，包含实际工资/生活和PREP-CASE，因此Q1最终42800/36800等原金额不等于当前Chrome只做首单的26800；不是规则冲突，不改原期望。无外部输入/资格赠送，固定seed/原命令与AP断言保留。
- market：一个正常Q01+四个明确独立市场fixture，覆盖F06买卖费用与交收、部分成交撤余、缺失报价、股息；fixture中的volume/dataAvailability变体是原既有输入，不冒正常行情或页面兼容。输出保origin与原金额，不把fixture利润推给玩家。
- video：独立F02三合同会计fixture（无生活费/就业/员工、预款0、固定返工规则）+两背景正常Create→实际工资/生活/两次作品与资格原路径；固定normal-video-access-v1 seed。F02收入900000分/成本465000分/利润435000分/现金2435000分为原独立例，不能与当前正常900元保护预款商单混记。正常长前史由原replayNormalVideo生成，不改资金/种子/资格或删命令；可能比前几个步骤长，仍只记实际终态，不启动额外矩阵。

五collector都不证明新UI动作、画面/理解度、当前物理原子保存、全24季或C-UX03完成。first-order/market报告含Q33等case标签，但本体主要evaluate+codec，不以标签代替Session/IDB/Native失败保全。实际新Chrome raw另用原完整Create审核器与其source/input合同绑定；原collector快照有主动尾LF，不能塞进Chrome exports冒充可见pre原字节。执行前后需绑定当前collector/evidence-output/锁与src身份；最终按runner真实status/signal/readback，不重复累加重叠case或引用历史passed为当前通过。
