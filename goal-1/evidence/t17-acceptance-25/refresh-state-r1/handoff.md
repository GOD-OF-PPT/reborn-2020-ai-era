# 原更新等待断点：模型限定修复完成

仅改course-scene-progress.ts、course-cohort-progress.ts及原course-cohort-progress.test.ts（仍5case）。精确字节/SHA/副本见frozen-source.json与final-*；owned.diff为本次完整增量，末次核对无漂移。

## 行为

导出courseRefreshProgress(course,date,target,context?)于cohort deep module，由两个progress接入；target仍原course/audience/cohort。只从这门课公开refreshes取得唯一未applied且planned/running的原任务，再核context原job的唯一性/business/definition；异常不另排任务。planned/running分别phase course-refresh-planned/running，保原target，给原job resultRef/recordId、真实成员/¥2000/1AP/7日与实际起止日期、原wait。teachingIntent为空，不重复安排原StartRefresh。完成/applied后派生返回null，原课程/班/受众的原下一步恢复。

原历史sample、cohort.jobId原教学/支持任务先保原记录；已closed/settling班不被同课后来更新覆盖。不增加target kind、不改cohort.jobId语义，不改saved映射/pin/季度或原命令/规则。原C1与undefined legacy合同未扩改。

## 真正原链验证

第三原normalcase保主链Mar14真实H004→同日StartRefresh running→Mar21实际completed/applied→回cohort第二教学/原course-ready/原audience-ready，并原跨Q2保Q1 focus；三目标逐一核实际费用/AP/日期/job ref、无refresh意图。保存前仍update-required；候选/readonly root结果不报完成；实际StartRefresh回响尚未完成、真实AdvanceTime后才有材料已更新。既有教学completed书签不中途变成更新。

第五原双班/旧attemptcase所有原断言后走到真实H004，再真实安排Mar15开工：三目标planned等待Mar15→实际Mar15 running等待Mar22，原cancelled教学书签仍只读原任务。没有向Mar14以前的玩家预报H004，没有改原主链日期/阶段断言/30s时限或新建正常人生。

## 检查与残余

R1 vitest-r1-red.log：原断点planned/running真实红及串行后果保留。R2 vitest-r2.log：normal原5case全绿，旧progress17/20过，合计22过3红；三红均旧CourseCommandDetails仅传command/course/workers、根新转CourseTeachingDetails要求view导致recheck，不是两progress新逻辑，原断言未改。type-r1原tsc -b实终态0。

R3单文件在根后续消息到前已启动，实终态1file/5tests通过31.31s；不与R2叠加新计数。Root已接手对!view旧captured Stage保原display-only合同，实际App有view仍完整新确认核对，之后统一重验旧progress/确认/UI与第三片累计。

此前C-S3 R1由Root受控停止143、487源无漂移的身份保持，不能冒称累计通过。本次无浏览器/Git/兼容/核心/P3/完整goal验收；所有后续由Root按新源构建与累计/实际Chrome收口。
