# S3-V1 UI交回（根接线类型待收口）

仅四文件：VideoSceneChoice.tsx/.test、OpeningObject.tsx、video-play.css，冻结身份见frozen-owned.json。

API：VideoSceneChoice接受p、target?、onTargetChange?(只显选)、blockedReason?、onInspect?(target?)、children(open)。open可选action为channel/marketing/sample/commission/rework/price/scope/publish；无参打开原具体记录或明确账号选择。默认入口仅翻阅，不暗自执行。导出VideoSceneRecord、videoDraftCommand、videoSceneSubmissionLock与videoSceneBookmarkLock。OpeningObject只新增appearance?:video；原kind/原R5两行位置/纯文本保持。

真实1254方透明视频套件已view并按实际尺寸import。四空白框只装饰，不对应AP/制作进度。无新背景、成片画面、人物、声音或兼容规则。

纸页分账号/受众创建、已有客户、样片产品、制作模式、素材、实际资源和日期；所有字段显选，原preview/request/confirm保持。所有执行按钮均在Dialog.footer，正文按钮只选页；同身份返页/合纸/原确认取消保留draft，不自动把过期日期挪今天或把失效资源换本人。blockedReason及busy/candidate/conflict同步锁显选/提交，原表单关闭但保草稿；readonly只可翻阅。新尝试显选到同channel准备页，返工/谈判/发布保原作品/合同。

R1 normal回归1pass1fail（原红源码保red-source-r1），当时测试到日期即返回但同日job事件尚未完成，原Review正确reject；测试改为实际公开job completed才返回，原30s时限不变。R2 2/2过；R3 2/2及strict0；最终R4 2/2过，strict唯一红为根并发App传videoTarget而NarrativeScene Props尚未声明（TS2322）。四文件初末无漂移，无我文件TS错误；等根接口收口后只补fresh strict，不重跑无关测试。

本证据是正常Create controller命令/纯SSR/静态CSS层叠与类型检查，不能代称实际鼠标、Chrome显示、真人理解或整体验收。根拥有App/上层/实际Chrome，两条正常手工与合法AI辅助小循环仍由根验证。无服务、Git、浏览器、兼容/尺寸/缩放/几何专项。
