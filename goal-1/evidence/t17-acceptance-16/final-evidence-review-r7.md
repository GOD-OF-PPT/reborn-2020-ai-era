# D11 最终源码与证据独立只读收口复核 R7

结论：本审未发现当前D11范围内尚未修复的确定源码阻断；生产R6与最终R7源码桥接成立，现有准备、保草稿、对象定位及原保存门槛限定通过。原11份Chrome相关原文的完整Create审核已经实际exit0并逐字一致。以下运行/浏览器结果由根代理及既有审核器执行，本审只读源、报告、日志、原文并查看已有3张本地PNG，没有再次运行测试、浏览器、几何、服务或提交。不是整游戏、全部Q/X、真人理解度/趣味性、原PNG或M01验收。

## 身份与生产桥接

- 当前HEAD351f2f588c70aacdf8cd241e9599a81a6e1f6316，D11前D10本地基线；仓库/公开性见opening-identity及同级final-source-review。实际D11源码变化13份＝9份生产源码（含CSS）＋4份测试；root16三文件在改码前存在，本审不改它们、master、源码、旧报告或stage。
- source-freeze-r7.json共376项，SHA256 7ded723978660fac1d3f7df9e64dff4940896be219524ac915ae316aa52653d3；本审逐项重算均同。该集合为372份src TS/TSX/CSS＋4份配置/锁文件，不伪称包含全部动态证据。相对R6恰只变src/ui/course-preparation.test.tsx，生产代码、配置和依赖无差异；故R6 .delivery/t17-interaction-r6／5328的实际生产行为可桥接到R7生产代码。此前R4服务退役记录只针对本任务旧预览，未动旧构建或DB；本审未操作服务。
- 对HEAD复核core/application/content/persistence、依赖配置与CommandButton/ClockAdvance/ScreenBook无diff；同级final-source-review另已核211份规则等原blob/磁盘/mode。本文的冻结比对不冒充重跑这些规则或再次验收全部旧树。
- R7测试前置改为读root16已挣得的normal59，再执行旧root05原OpenCourseStudio末命令，比较旧原60全部字节，保留5个case、原20秒beforeAll及所有新断言。该旧60源与D11玩家实际另选资金形成的60是不同结果，未混用身份。完整Create来源由prepare-browser-input记录和本次11原文独审承担，不把UI测试局部重现说成再次执行两年前史。

## 源码与规则边界

1. 课程资本必须显选/填写，原OpenCourseStudio与确认仍在；大纲资源显选、日期onChange/onBlur同字段，¥100/1点/7日沿原定义。资金转移不记经营收入；planned/running/completed分别显示，大纲完成不替代样课/招生/收入。等待经原playableAdvanceDate和AdvanceTime，原暂停、交付、季度、日期/AP/产能/资金门槛均未绕过，完整案例、样课、招生、支持、退款等仍在原册。
2. 视频progress携带公开channelId/workId/contractId及对应section，App捕获目标并对齐所属账户；VideoPanel核归属/互指，仅借原ScreenBook锚点定位。作品/发布原ID作为锚点，缺失或错属明确提示，全账号选择及原记录保留；查看不Review/Rework/Submit。CoursePanel新初始锚点只在本面板实际存在目标时自动触发。navigate现统一清目标，openWorkspace先navigate再设显式目标，已知旧目标残留缺口已修。
3. 保原册例外只有LicenseCourseMaterials且真实saved，同run/course、原册原本及当前均打开、同账户/epoch、账户存在、非只读并通过committedEcho。CoursePanel/CourseBusiness和workspace-content的key维持组件，保留草稿。原确认捕获命令、预览细节和workspace，不重绑新对象。失败/冲突继续旧提交与原候选；retry显式以open:false上下文处理，不自动复活旧原册，不重新收费/抽取或执行下一步。
4. 已发现的“双层完整回响”接线已修：preparationReceipt命中时App不再向底层NarrativeScene传receipt/kind/frame，原完整结果留在原册行内；合上原册后仍能查看原保存回响。非白名单的原确认/成功关闭策略、同run/new revision/saved/noCandidate门保持，不通过方便操作隐式接受融资、交易、新业务、招生或代理扩权。

## 实际技术检查与原红保留

各轮按自己的源码身份列示，不累加成一份最终全量通过：

| 实际记录 | 已读取结果与界限 |
|---|---|
| affected-tests-r3 | 11文件66过、exit0；与R7还差CoursePreparation、其test、course-scene-progress、CSS4文件，保持原轮身份。 |
| affected-tests-r4 | 3文件16过、exit0；与R7还差CoursePreparation、其test、course-scene-progress，覆盖当时App集成，非最终全量重跑。 |
| affected-tests-r7 | 课程准备5过、exit0；是当时真实GameController显示夹具及原20秒hook版本，后续状态断言/前置优化单列。 |
| affected-tests-r9 | 当前两文件21例：19过、2个原course-scene-progress用例在原5秒超时，exit1。全部失败原文保留。 |
| original-timeout-cases-r10 | 只精确重验R9原两fullName，原5秒均过、exit0；另外14未选择，不计新通过。不是把R9改成21/21同次绿。 |
| app-preparation-check-r2 | 2文件5过、exit0，实际head.put成功后abort保物理旧档、同候选重试及不重开旧原册。是独立课程夹具的Node/IndexedDB检查，非正常新局财富或本轮新native故障试验。 |
| build-r6 | npm build原为tsc -b && vite build，实际exit0；376冻结生产部分可桥接当前。 |
| 最终单独typecheck | 根代理交回原session62387实际exit0；本审没有启动或重跑该检查，也未在本次读盘发现另一个typecheck原日志文件。 |

R5的beforeAll20秒超时、R6缺view.features的显示夹具TypeError、R8原红和R9原5秒超时全部保持。前置优化减少每个UI运行重复长前史，不改case、断言、时限、隔离、规则或完整Create独审责任；不把负载当作已证明的唯一原因。

## 实际Chrome链与独立读回

以下动作由根代理执行；本审仅读留档状态、原文与已有PNG，未连接浏览器。

- 课程正常内容前史：R4实际资金选择产生60；R6取消未来Dec2大纲确认后，原资源/日期仍在且仍60。原确认后61为planned，原任务Dec2—Dec9；实际62开工（根交回生活¥4,000与制作¥100分别发生），63同一原job completed，64另行ActivateBusiness。原64与reload均810315B、SHA fd78fd7021dab67d43dd71542d8daf0943be09353795560205e812a15039665d。独立只读物理63与生产63均798524B、SHA 22633435d530e8d2cc9d6583d4ee9da36d240dd97821a0ea00f32ba0d07aeff7；根交回Activate disabled。查看outline-running-r62.png可见已开始文字、真实Dec2日期及Dec9等待对象，没有把安排写成完成。
- 技术正常前史99→100：原License成功；native-progress明确记录草稿name、三项choices及case/consent三个checks前后equal:true，仍只有“课程与学员”原册一个dialog。materials-save-keeps-draft-r100.png保留本地商家、所选视频案例和consent；原按钮因资源已占而disabled，原300元费用/AP/日期仍沿业务原命令。100完整产品导出已保存并通过Create审核；不把许可任务已安排说成已完成。
- 两账号视频：原正常Create4前缀作为输入buffer，场景查看后native-progress稳定状态为正确视频原册page4/6、仍revision4；根实时观察交回第二账号与work焦点ID，本审源码核对目标传递。证据限制：video-second-channel-target.png实际仍是原册介绍页，图片早于稳定目标状态，不能用它单独证明第二账号/作品已在图中可见。源/SSR/稳定状态和根实时观察按各自层次记录，不称该图是目标卡的最终视觉图。
- 随后额外手动换回第一账号／导出尝试遇Cua60秒reset，Chrome1 not available、inventory空，由根交回；本审不据此诊断游戏丢档或原生离页问题。没有完成该额外步骤后的产品原文，不能声称手动切换及导航后导出逐字不变已真实完成。没有盲重发命令、伪造native abort或改换自动化补采；当前Node真abort与原候选retry证据保留其工具层身份。

上述视频图片/额外步骤是明确的取证限制，不是已证实导航失败或规则阻断。当前窗口实际玩法闭环与限定来源已成立的部分可以交回，未验部分保持原责任；不为此次限制开启兼容或几何工作。

## 11份原文完整Create独审

本审核读期间从“运行中／无结果”进入真实终态：full-create-audit-r1.execution.json原命令exit0、耗时326.4367215820239秒。normal-browser-export-audit.json为20654B，SHA256 6604b32eb1b23dfbc44a5b667db5e1ce2a883128eb0058c8f172c3b66343e6f8；3次Create、165个unique command、11份记录全部fullNormalCreatePrefixByteEqual=true／allByteEqual=true。125项sourceHashes与15项inputHashes本审逐项重算均同。原full-create-live-readback仅是进度，保持该身份，不回写成成功。

四份import_buffer不是新增保存结果，七份product_export也不是七个新人生；重复前缀/重载/只读副本不重复计独立创建。该审核证明当前引擎下正常Create与原命令序列的完整字节可复现，不证明浏览器动作、视觉、真人或完整规则矩阵。

| 留档目录／文件 | 类别 | revision | SHA256 |
|---|---|---:|---|
| chrome-production-r3/course-prefix-text-before-import.json | import_buffer | 59 | 5abe6b6cdd1b1f09f07933c4ffe2a85ab22fd4d7be3a47c3ee55d0b8e04b39b7 |
| chrome-production-r4/course-prefix-text-before-import.json | import_buffer | 59 | 5abe6b6cdd1b1f09f07933c4ffe2a85ab22fd4d7be3a47c3ee55d0b8e04b39b7 |
| chrome-production-r4/course-funded-r60.json | product_export | 60 | fbad670717fe4adabe01f8f66058b237461ff94184ae1a75166396794bf362fc |
| chrome-production-r6/outline-planned-r61.json | product_export | 61 | 62d4114fbb43057f9176d18721edde37a7d258721b22953e37b37f075631a120 |
| chrome-production-r6/outline-completed-r63.json | product_export | 63 | 22633435d530e8d2cc9d6583d4ee9da36d240dd97821a0ea00f32ba0d07aeff7 |
| chrome-production-r6/course-activated-r64.json | product_export | 64 | fd78fd7021dab67d43dd71542d8daf0943be09353795560205e812a15039665d |
| chrome-production-r6/course-reloaded-r64.json | product_export | 64 | fd78fd7021dab67d43dd71542d8daf0943be09353795560205e812a15039665d |
| chrome-production-r6/licensed-case-prefix-text-before-import.json | import_buffer | 99 | f7079d7dccb385878555d42c5812f1568a9e9d47895e3003e19c3b43c3f603f3 |
| chrome-production-r6/materials-saved-r100.json | product_export | 100 | 2606820d113387c3767ea337fe3157eb8d7f9e16c18941d342e101943e4caa0d |
| chrome-production-r6/two-channel-prefix-text-before-import.json | import_buffer | 4 | ec935f6771e60d72d205fada6ea3f4280de28d970acc8647e076e2f0c2d66b5e |
| chrome-readonly-r6/physical-outline-r63.json | product_export | 63 | 22633435d530e8d2cc9d6583d4ee9da36d240dd97821a0ea00f32ba0d07aeff7 |

## GJ / REPEAT 与收口界限

[杠精审查] 限定通过：已核非纯改文案的准备操作链、原对象定位及辅助成功保草稿；日期错配、安排/开工措辞、重复modal及测试夹具问题均有原红或原证据保留与实际修缮。没有拿旧绿数、静态类型、复制晚档、默认停止或输入buffer替代正常业务；没有把截图当人测。

[REPEAT] 复用项目browser_evidence_guard、原codec/命令、既有verify_normal_browser_exports、source freeze和现有事务故障工具；未新增重叠全局skill/自动化/测试框架。本文的hash/JSON只读检查不执行生产命令，不另跑审核器或测试。

本审没有新的确定源码阻断。根仍负责最终资料/Git保全、任务记录及本地提交，本文不替其执行或宣布提交。原5c-P1六前史/288核心/62关键/22例行仍未由D11执行，后续5c—5f/T17/goal不关闭；旧PNG/真人0、M01暂停/T18等全部保留。兼容开发/测试、geometry、尺寸/zoom、跨浏览器及原生离页专项均0。

## 当前13份源码／测试SHA256

| 文件 | SHA256 |
|---|---|
| src/ui/App.preparation-save.test.tsx | 6994fc9124ad6cacc76f22fbf97b6bea4722da97b4fa186f3eca493ff85af9d6 |
| src/ui/App.tsx | 102a4e825a7b091a725007579606f873b94e3f861fa90fedf24255696ec5a764 |
| src/ui/CoursePanel.tsx | 7721004f14dec21025d8fe6dfaaafd5ecf1891df797b3a0f58839a5e37625205 |
| src/ui/CoursePreparation.tsx | 5c103c5bdf3587ff3fa480d411e7906558bb4d649de780d15e391aef11946251 |
| src/ui/NarrativeScene.tsx | de75fab555c245ab230385b75e358c6ce73624e1da5567f081147df5ac374a74 |
| src/ui/VideoPanel.tsx | 520e0254d8e793412ad16fb7ffcb003838b383b5aeafbe9c3da75bf44823c272 |
| src/ui/course-preparation.test.tsx | 1ee0fed4e748db9ad2ebf432dcee50b15aca733b99d057e32c5a69641e5d56e4 |
| src/ui/course-scene-progress.ts | 6f063e0a160fac02aac0244605c55e54d974a0551b18d943bdd62d397e56e57d |
| src/ui/game-types.ts | 3e7c3e0c8a6ea966799cc36ea79492fc468766aa828d427bffc5b1a09008a0a4 |
| src/ui/scene-encounters.css | 347ff10246df7bc56b2545219c5edcf0602bdd46a1f136b2e5c4e4448ff7581e |
| src/ui/video-scene-progress.test.ts | cce97e259a452ac2e78daf68a5e5d8d6d2ee8ba2600fbb1c5280a39a6beffee1 |
| src/ui/video-scene-progress.ts | 82b1263a4ae067616246073f6af36a64a7b5786307e7261e1d3d45552a726757 |
| src/ui/video-target.test.tsx | a874a61a1cd4903f750f02215a32b0b53c977633e3d20ad4fe1a507de9089190 |

写前后376冻结项、原三文件与本审读取的各轮报告／红档／Create结果均未变化；旧final-source-review.md保留SHA256 92a7dfaaacd46722c31be0118e376b097ed63412a6cfdd5a249a0fdc9a270c00。本文仅父目录guard通过后以wx新建，不覆盖旧件。
