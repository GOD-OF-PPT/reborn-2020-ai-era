# 生命周期日历API修复 r2（执行前政策）

原正式R1真实exit1：90登记、15尝试、14目标满足、1失败、75未执行；case15的旧公式 addDays(stage.dueAt, 1-p.stageDays) 向仅支持非负天数的原API传负数，实际 INVALID_DAY_COUNT，未命中课程截止日守卫。R1全部原输入/原文、155源快照、失败和未执行身份保留，不覆盖、删除或把已执行当通过；原独立audit未启动。

本版本只修 src/testing/course-critical-lifecycle.ts 的日期API使用，不改 core/calendar、课程规则/参数、原45×两背景90行、所有sourceRevision、原cohort起止/阶段due/support/refund/更新期限。导出 oneDayLateStageStart(dueAt,stageDays)，先用正向addDays(dueAt,1)，再调用真实dayBefore逐日回退stageDays日。两deadline都使用该helper，并在实际拒绝前登记check：addDays(startAt,stageDays)严格等于原due+1且startAt>=原cohort.startAt，requiredChecks纳入这一真实日期判据。实际拒绝仍必须 COURSE_STAGE_DEADLINE_MISSED及完整原文不变。

先新建纯日期计划与小.mjs，在旧原公式上真实红测保存新目录，再修代码并用同一literal期望表绿测另新目录；不改期望以迁就结果。仅纯日期，不创建/执行GameRun，不跑90场景、浏览器或兼容工作。根代理另绑定本r2政策、严格类型及唯一完整90新版本；小日期绿测不能代P3场景目标。旧政策原字节保留，本文件只补正API调用责任。

[杠精审查] 修复范围限定：原期限与范围不变，修工具错误，补具体完成日判据；R1红档保持，类型和全90仍需根实际执行。
