# 视频原册/日历身份接缝交回

生产源码已冻结：VideoPanel.tsx、SceneJournal.tsx、新video-work-target.ts；只修改对应video-target.test.tsx，原scene-play.test.tsx字节未改且原3项通过。未碰App/NarrativeScene/OpeningMoment/player/season/VideoSceneChoice、任何core/application/content或旧证据。完整owned bytes/SHA在final-owned-source.json。

接口：

- VideoPanel新增可选onTargetChange:(target:VideoSceneTarget)=>void，只在明确确认原记录或手动切账号时触发，render/effect不回调。调用方可仅更新原册导航target；它本身不改主pin/偏好或执行命令。VideoPanelProps导出。
- videoTargetLocation(video,target?,accountId?)保原2参，第三参校验当前账户；复用model的videoTargetReason/canonicalVideoTarget，marketingId与work/contract/section互斥，真实营销record.id作为anchor。
- videoWorkTarget(video,jobId,businessId)纯函数：按公开production/corrections、contract.negotiationJobId、marketing.job.id唯一匹配同channel/business/account；返回{accountId,videoTarget}或null，不造ID。SceneWorkTarget新增videoTarget，workTarget逐项透传。原firstOrder仍优先quarter/personal/原contractId。

同步门槛：无效/缺失/错账户或关联冲突的initialTarget在首次render就只显示公开原对象radio和确认/取消；没有默认第一账号、新建账号、生产/交付可执行表单，也不靠effect事后纠正。无initialTarget允许原新建入口，但原账号必须显选。预看只改本地draftId；取消保原target，确认重新核当前公开对象。候选/busy/conflict不确认重选，原只读仍可阅读。

草稿隔离：run/account/完整target的稳定scope key使同身份修订保留表单，不同身份重建。内部明确切target也使VideoChannel及原新建账号表单按新scope重建；单纯预看/取消不卸载原表单。测试核纯本地选择状态与React key合同，实际浏览器翻页/关闭返回的DOM行为仍待根验证。

检查：R3定向2文件6/6通过（13.64秒），strictTS0，own源码前后无漂移；既有原20秒时限/断言保留，新长链case30秒不变。正常新Create+实际IndexedDB保存验证推广/制作job原channel/对象/账户及直接验收零修改结算；首次SSR验证失效/错主体同步不露表单、不自动选原账号、render不触发回调，显选/取消纯状态和只读检查后raw不变。原已核Create的normal谈判拒绝后退出整档经实际GameController.importNew取得完整view，核其真实completed返工/谈判job对应完整target/原册且不复活为active日历，输出raw仍逐字原样。

原红保全：R1两个新增断言假设错误（新建受众默认selected不是默认账号；固定正常客户实际零修改，不强说覆盖谈判）。R2新增原124命令整链30秒超时保留，不放宽；新测试投影view缺7字段TS红也保留，修为实际Controller session view，不用硬断言/降strict。没有重跑旧90/252。active返工/谈判日历阶段本轮尚未原生核，不拿completed原记录或0轮样本充其覆盖。

139原runtime/protocol/testing参考/输入绑定全保持，历史谈判原raw哈希也保持，engine-input-preservation.json逐项可核。未运行全仓、兼容、浏览器/Git/资产/服务；UI当前画面、原生草稿/取消/同对象回跳与本轮两条真实完整小循环由根正式构建/Chrome继续。
