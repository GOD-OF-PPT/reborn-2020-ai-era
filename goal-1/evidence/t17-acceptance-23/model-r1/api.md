# 视频纯模型固定API

OpeningFocus新增Identity & {kind:'video';videoTarget:VideoSceneTarget|null}。Identity仍为runId/accountId/entityId/businessId?；null是明确无账号入口，只允许personal/entityId:null/无business。

VideoSceneTarget={channelId:string;workId?:string;contractId?:string;marketingId?:string;section?:'publications'|'leads'|'making'}。marketing与work/contract/section互斥；非publications章节不带作品，publications须真实作品/发布。实体优先contractId→workId→marketingId→channelId。

videoSceneProgress(video,date,requested?:VideoSceneTarget|null):VideoSceneProgress|null：undefined保原legacy推荐，null返回video-entry；显选对象失效返回video-invalid与invalidReason，绝不回退全局。VideoSceneProgress保title/line/choice/target/command；新增stage、invalidReason、outcome、resultRefs，可选wait:{date,label}。资源命令不默认编排，直接command只为ReviewVideoOutput或SubmitVideoCommission。

videoTargetReason(video,target):string|null；canonicalVideoTarget(nonNullVideo,target):VideoSceneTarget须先核reason===null，只补该work实际公开关联contract。video-player-thread导出resolveVideoFocus(p,focus):{focus,reason}、videoTargetEntity、videoPlayerScene、videoFocusQuarter/Open/ResultDate、videoFocusFromSaved。resolve额外核当前run/account/business/原channel链及重复/错配，谈判wait从公开operations.jobs补，不猜日期。

saved白名单：OpenVideoChannel、StartVideoMarketing、StartVideoWork、AcceptVideoCommission及同对象Review/Rework/Publish/Abandon/Submit/Negotiate/Exit/Collect/InterruptJob。全局真实saved/revision/candidate/readonly门槛仍在openingFocusAfterSave；season pin只允许入口细化、同channel进入具体尝试、原营销cohort转原客户单，同对象回原引用，旁路/AdvanceTime不重写quarter。

严格偏好仍UI version1：旧非video v1原文load/no write；新增受支持video必须完整business与规范entityId，contract必须携work，内嵌target严格字段/非空/重复/冲突检查。坏/未来/未知原文继续preserved；不自动迁移、删除或覆盖旧文，不改run schema/profile/rules。
