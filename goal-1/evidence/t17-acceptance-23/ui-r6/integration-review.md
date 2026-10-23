# S3-V1四处接线只读审查

读取App、OpeningMoment、NarrativeScene、RoomMoment，身份见final-source.json；不改这些根文件，无浏览器/几何/兼容专项。

确定P2（已补正）：NarrativeScene显式查看账户与target所属channel账户冲突时，外层虽移除Action，旧近景只校验video/date/target，仍可能露Review/Submit。此次与模型代理共同确认源码缺口，未声称实际浏览器执行了错误命令。VideoSceneChoice现以videoSceneContextReason同步锁submit及实际request；videoDraftCommand有target时先核channel.owner===p.accountId，错则null；activate不论请求哪个intent先进入channel重选页。显选仅调用onTargetChange，父更新实际owner后才清门槛。没有以blockedReason封死重选。Root已在OpeningMoment给chooser传thread.focus.accountId，避免全球查看账户旧值误伤合法房间焦点；NarrativeScene onInspect保留明确原account。R6原normal case加错误UI上下文变体，游戏raw不改，2/2通过。

其余已核接线：

- App.navigateScene/openWorkspace携videoTarget与实际channel账户，RoomMoment的current/pending均保videoTarget；显式无target入口传null，未按最早全局订单替换显选对象。
- OpeningMoment只有一个VideoSceneChoice，主念头与原近景共用其open；进入专用纸页前关闭原物件近景。children(open)只是打开与显选，不执行。原直接Review/Submit仍经CommandButton原preview/request；纸页执行回调保kind/payload/confirm，全部固定在Dialog.footer外于分页体。
- candidate/busy/conflict同步禁止显选与实际submit，blockedReason变化关纸页但保同身份草稿；只读可翻阅，执行锁住。未知关注/强制责任由根传blockedReason，未借视频纸页绕原门槛。
- App确认返回只setModal(null)，不调用submit/onSubmission；VideoSceneChoice同run/目标实例保留已填draft。明确选择新尝试转同channel准备页是UI显选，取消业务确认后原资源/raw不变；返工/谈判/发布保持原work/contract。
- App仅saved后差分补实际ID并发布回响；候选与冲突留旧提交/原retry。Narrative/Panel显选只在原持久pin已是video时更新该pin，不抢工作/生活等其他关注。
- 等待用公开job/客户/付款日并走playableAdvanceDate与原Clock，未添领取款动作；同日期不代称制作已完成。R1红正由原规则拒绝暴露测试日期假设，后续回归以实际job completed为界，30秒时限不变。
- 新appearance只改真实透明道具层与实际1254尺寸，原kind/全文/原生button/纯文本保持；R5物件与底部导航分离CSS未改，无新音频/断点/缩字/裁切。

除已修P2，当前所读四文件未见新的确定接线阻断。仅为代码审查和限定回归；场景实点、取消/保存/失败/重进及图像实际遮挡由根当前Chrome验证，不能以本审查替代。
