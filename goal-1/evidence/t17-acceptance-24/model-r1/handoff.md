# C1 pure models frozen handoff

API：CourseSceneTarget 为 studio/businessId、outline/businessId/outlineId、license/businessId/licenseId、course/businessId/courseId/sampleJobId? 四支；courseTargetEntity 以 sampleJobId→courseId→licenseId→outlineId→businessId。courseTargetReason(course,target,context?) 严格核原ID/关系/旧attempt，绝不补成最新样课。context={preparationReady?:boolean,operations?:{jobs:readonly ProductionJob[]}|null}。courseSceneProgress(course,date,undefined) 保旧推荐，null 明确无选中对象，具体target只读该对象；进度phase/invalidReason/outcome/resultRefs/target/historical?/command?/wait?，旧stage教学object、preparation、recordId、waitDate保留。command只原ActivateBusiness，其他投入仍显选资源/日期后原preview。

course-player-thread 导出 courseFocusFor/resolveCourseFocus/courseSceneContext/coursePlayerScene/courseFocusFromSaved/courseFocusQuarter/courseFocusOpen/courseFocusResultDate。Focus新增kind course/courseTarget null|四支。courseFocusFromSaved(previous,current,kind,body,existing?)只原saved/同run/增1rev/同kind回执，无candidate/readonly；只对白名单新增/确实改变公开对象回传。辅助License若对应既有course案例且第五参有效，返回existing原引用；四参仍返回实际license供原册。跨kind、账户/业务旁路和同对象刷新不抢pin；OpenStudio从personal入口绑定实际company account；BuildSample才绑定实际新attempt。查看、AdvanceTime不生成新身份。

进度读实际job planned/running/completed/cancelled/interrupted，日期到不等完成。旧sample尝试严格查sampleAttempts+同business公开原job；历史attempt标historical，不替换新attempt。既有全局大纲+真实本business prepared可直接核原Activate，不强迫新100元outline；closed旧studio仍可翻，与新studio不混。已付手工案例可用；许可视频仍同business独立课程素材任务，进行中在原course上等真实任务，不重复作授权完成。ready区分案例权利/当前工具/更新/暂停/关闭；已有真实cohort不得说尚未招生。仅无班课程ready写尚未招生且未来获客/班额/支持仍另行决定。

季度choices含原studio/outline/license/course/每次sample attempt；pending保留原准备job、全部旧cohort/更新/欠款/原财务和强制事项入口；reel仅实际定义、完成/中断来源，不算收入。旧v1非course文本逐字加载，不重写；course严格目标形状/完整身份，坏文保原，不改游戏档版本或回执。

验证：progress初红2failed/16passed保留；正常AI70许可wait初红1failed/2skipped保留。r1三文件32/32，23.81s；r2五文件74/74，82.44s；最后新增旧班/显式draft边界及读原COURSE_JOBS列成本/AP/天数后，仅两实际受影响文件r3为22/22，38.33s。不得把三个批次相加当唯一测试数。原时限均未改，无全仓/兼容矩阵。

三条正常已挣前史短续行在同fake-IDB controller验证：手工已付案例→company分账/未来大纲/启用/Define/样课实际ready无学生收入；完成旧纲关闭旧studio→新business通用准备复用全局纲，原Activate允许且新studio无outline；原AI70许可视频→同course独立许可planned/running/completed，pin原引用、真实wait。正常前史完整Create证明沿既有root16及根root24/prefix-audit-r1，不重跑多年史。隔离F03仅核原sample中断/重排旧attempt、多草稿及真实旧班显示，不能当正常开局。

根courseSceneResult源在同normal loop测实际帧，hash另存external-course-result-source/check：资本非收入、定义非样课、planned非完成、真实完成才ready；unsaved/candidate/同rev/跨run和日期到但job未completed为null。该源未由本代理编辑，测试后hash相同。

独立质疑闭合：错run/账户/业务/重复或错字段均invalid；旧attempt不跳新；普通side draft不抢旧course；许可辅助不丢course；旧全局纲不收费重做；旧班/更新/债务仍到原册；ready不保证招生或有人买。本项未改core/schema/rules/P3/游戏钱/AP/日期，未浏览器/真实DB/Git操作，全部兼容0。Root负责最终全源strict/build、App/原册/日历集成与Chrome实际体验、原子失败/重进和完整原文审核，不能据此关闭整个S3/goal。
