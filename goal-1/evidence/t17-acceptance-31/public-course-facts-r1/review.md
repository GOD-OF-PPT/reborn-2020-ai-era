# U3-C1 R6 公开事实独立核对

结论：两份真实86的22项课程/现金/AP/日期事实各全部符合原请求；原脚本整体真实 exit1 保留，不称全绿。唯一额外红项是未归一化的 whole-feature SHA 相等断言；两次真实 AdvanceTime 有不同命令与公开来源ID，该额外期望不适用。

方法：单次执行原 createCampaignCodec.import + 官方 registry.runtime.project/projectRun，共11份已登记原文、5个不同SHA各一次投影，耗时3188ms。无新run/fixture、命令/preview/Controller/回放、浏览器、测试或兼容操作。R6权威 build-final-r6 三文件与完整556源集合按bytes/SHA/mode初末一致；16项输入（5原manifest+11原raw）初末同，脚本/guard及权威也同。原source显式角色前缀、origin、bytes/SHA与runId/revision头逐项核定。

## 原身份与实际课程

11份均同 normal CreateRun：normal-course-content_employee-453bb7c2；创建身份SHA 7a63026ecff81aae4f1f208c60389f93c564081014dd0444642d0fcbebf8c76c。这是原回执身份核对，不是本次完成Create重放。

主86：905659B / c39d2cb2e66ce85f9a84d0c9bdf349ec950edb4df727d7e14eae3ab82e49c517。R6分支86：905659B / 092a8c067a452d867e868a085ff902670005ec9bcc7402b84e7588e9be421e1d。两86从同一真实已存85前缀而来，最后一条都是AdvanceTime到2023-01-15/snapshot，载荷签名/哈希同、commandId不同。完整原文结构仅11处差异：checksum、末Advance cause与引用；去checksum且仅替换该末命令ID派生字符串后内容等价。原raw实际不同，不能称逐字相同。

同课 crs:60aafe5da1d987ede4868ffc2c3a469f / “把亲手做过的作品教给初学者”，同企业 ops:70e0cadd5330feff20f003b459bec5aa / ops:0ff547135b6bcc30fbb71fd65d3b0c8a。两项原案例分别为已付手工首单和已验收付款且具素材范围的视频；引用均在公开案例集中。大纲job实际完成2022-12-07，独立素材范围job实际完成2022-12-14。样课两次尝试：旧 crs:4769bfb3e9a8d9bcfebbb9b57fe1eeda 在2023-01-01实际interrupted、无输出；新 crs:77414d90c9272b27bdbf354d34cf4ff2 实际completed/输出可见，完成日2023-01-15。课程ready且当前sample指向新尝试；未将安排或许可当样课完成。

公开课程经营收入0，受众0、班期0、投影学生0、预售负债0。企业现金/可用551936分，个人现金/可用7045000分；2023-Q1行动总4、已用2、预留0、可用2，日期2023-01-15。企业另有尚未入账成本4838分；projectRun扣该应计后的净资产547098分，不能把现金551936分称净收益。公开经营成本452902分、利润-452902分保持原义。

真实85仍building/新样课running，Jan1现金已是551936分，行动已用2。上述完成86事实不套用到73/74：旧73无大纲/许可/课程，企业1000000分、个人7845000分/AP可用2；候选/原retry/新物理74的大纲running，企业990000分/AP可用1，仍无完成课程。其大纲ID与后续主线不同，不能混称同一次正常大纲的替身。

## 原子保存字节关系

候选74（UNSAVED_CANDIDATE）/原retry saved74/fresh物理74：836364B / d7edf2993e4cafed3a77270db4b10268c44558f547c5857a8243ca8f85a11b39，逐字同。旧saved73/fresh物理73/正常funded73：829348B / a4f4232f6278264d542ca65551cf5fa7068e3ad4193785773ec4776069ac91d6，逐字同且与74不同。候选的codec合法性不代表已经保存；物理来源仍由原独立Native证据证明，本次只核登记/字节/公开事实。R6重进与其分支原文逐字同，主86偏好操作后与主86原文逐字同。

## 额外红项的确定分类

原runner exit1/result.passed=false/public-facts.allFactChecks=false 原样保留，facts.mjs/run-once.mjs/raw未改，也不重跑。唯一false是fullPublicFeaturesIdentical；课程/账户/budget/date选择事实相同，而原Workbench公开evidence保留真实source。src/application/workbench-projection.ts:52 明确将visible cause映射为id/sourceId；两真实末Advance的cause588可见，原cause ID和sourceEventId不同，所以features.workbench.evidence中的id/sourceId必须不同。未保存完整features对象的逐字段差集，只有其原SHA，不用新投影补造全features绿。

归一化仅解释分支身份，不重签存档、不宣布原字节相同、不替代官方完整Create审核或重新Native验收。原Node ExperimentalWarning保存在stderr，无异常或信号。原完整审核/Native由Root分别持有；此处不引用其未独立执行的通过结果。

未知/不适用：本次无真人理解/趣味性、无兼容/几何/浏览器操作、无C2招生；公开0班期/0学生/0预售不声称读取了隐藏payments/enrollments表，也不保证未来收益。node_modules未递归哈希，仅记录Node与冻结package-lock；不把此事实核对扩为完整环境或全游戏验收。
