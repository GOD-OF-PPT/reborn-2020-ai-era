# B4进行中：后台执行器已实施，尚未提交或交付

HEAD仍a6f1bf85413686981144bfa221ca6877e57d9791，上一C-B3为progress，349已STOP/fullseal97/1a5aad1b..不能追加。唯一原U6内部B4，不开始B5/U7，goal active。先354 input/plan/tasks才改产品。当前WT本任务owned39路径见owned-source.json，外加本354证据；P326/旧封存/mixed masters/AGENTS保持未stage。没有B4新commit。所有兼容开发测试0，禁止尺寸/移动/缩放/跨浏览器/原生离页/几何专项；正常当前Chrome画面与钱/AP/日期/权限/存档可核。

## 当前实现

真实浏览器createBrowserGame默认new DedicatedWorker，静态模块game-runtime.worker.ts→installRuntimeHost→createRuntimeOwner（原Codec/原Controller/Session/IndexedDb/WebWriterAccess），不回退主线程。原browser-game逻辑搬到browser-runtime-owner，DEV原abort白名单/DB/predicate保，原正常DB名不换。新前台RuntimeGameController只公开snapshot/原结果/opaque导出文本，GameControllerPort结构类型在UI；原本地Controller保作者消费。session-close-guard抽出原相同needsUnsavedWarning小接口，session旧导出路径保；没有新增原生离页专项。

RPC严格方法白名单、boot nonce、单调ID和snapshot seq、session epoch；控制stop带原wait/routine请求ID。命令同epoch允许旧seq进原Controller fingerprint/idempotency，read必须当前seq/identity；原Core再核run/actor/revision。客户端prepare WeakMap用bootNonce+session不允许Worker重启后同数字epoch复活旧command；公开runtimeSession是opaque string。消息回应对应snapshot应用后才resolve。真实Store失败保原candidate/原retry，host给opaque原candidate文本作recovery（不解析/不自动导入），Worker故障保旧数据禁写/不重算；unknown write显示保存待核对，可显选物理重读；已知候选未显选舍弃不清。客户端故障busy元数据清false但旧钱/AP/日期/已知candidate不捏造，原保存label按runtimeWriteUncertain覆盖。

前台use-controller-read用真实异步preview/clock，复用原ScreenBook已设inert，不测新几何、不改分页。组件/command key/view/序列/挂载与A-B-A callback版本防旧回信，后台read计数独立订阅不让每个读结果重渲染全App。CommandButton aria-busy与省略符，原非法/费用资格每次原服务核。App use-ui-intent一次未提交UI意图：原同步场景handoff提交后effect捕获workspace/top native dialog/title，后续gesture/改稿/页面/owner/modalEpoch/view变化退休，旧回调不弹回新页面。原本地Controller分支仍同步构造确认；真正Worker分支await原preview/clock，保捕获view/preview/session。发起真实写后原App提交/场景跟随逻辑，session不符不发布旧回响。StoragePanel异步inspect/file/restore有owner/text/token/unmount围栏，apply时原文只读，旧file finally不清新文件。Storage常量改直引save-limits（same10MiB）避免renderer拉进private codec。

## 源与已实际terminal

- before保护36完整旧producer（349/post35+父349）、P326/132markers/2symlink/旧19/35/input61B/未接线model/master原前缀+2304B插入通过：preservation-before-final.json，67059 exit0。
- freeze工具从原351/942精确复制，不复制P3 overlay；owned覆盖。355原入口红（供workerFactory未调用0次），89803 exit1/2860ms，未造缺module红。
- 356/951/12owned新入口1case过，2756 exit0/1150ms。
- 357/953/14owned owner组8绿1红：一case主体通过但teardown hold仍扣close snapshot导致10s hook超时；原结果保。修测试清理先解除hold/release，不加限时。
- 358/957/31owned backend三整文件12/12，1250 exit0/9117ms，真实Owner/Session/fakeIDB，不是Native Worker。
- 359/957/31owned type只一unused GameSnapshot import红，62569 exit2/52339ms，已移除。
- 360/958/33owned 当前backend+新UI scope四整文件19/19，78981 exit0/15728ms；含真实同command并发、put-success abort/原candidate retry、readOnly、snapshot-before-response、同run旧session拒绝、transport失联后显选重读真实物理结果不重算、UI A-B-A/卸载/改稿/旧paper退休。
- 360 type83768 exit0/68530ms；build55337 exit0/2735ms，真实worker产物assets/game-runtime.worker-B96S8STF.js 925.25KB，main index1.87MB，有原大chunk warning没改阈值，非正式性能门槛通过。

## UI原组差异与当前检查

360 UI17整文件98case：69绿29红（51670 exit1/171288ms）。5份旧handler-only React driver没扩新增useCallback/useState/useRef，导致invalid hook及连带；已在WT扩这三个driver API，保原断言/金额/日期/保存/限时，不伪造业务。受影响文件：shared-action.test、OpeningMoment.focus-book.test、App.equity-follow.test、CourseTeachingChoice.test、CourseTeachingInteraction.test（都要owned）。新真实async hook scope已由runtime-reading.test的效应driver独立核。

另App.course-workspace整10和App.equity-tail4为5秒原超时，不能直接当资源问题。360 course-alone完整10实际仍0/10（26200 exit1/60980ms）。同原351冻结App/course完整10/10（19311 exit0/31011ms，每case2.2—3.2s），所以继续排查本轮影响，不能消红或改时限。

363是诊断variant：current owned加仅copied App.course-workspace.test console标签probe（root probe-course-source.test.tsx），testNamePattern只首例；8946 exit0/9445ms、1绿9skip/首例3128ms。它不是整文件验收。console在json reporter没存phase日志（stdout只有report写入），不能声称已定位具体卡点。363相比360产品只有StoragePanel旧file finally已修，另外5driver/新storage test及probe差异；App/Controller产品都一样。下一必须普通源完整course/tail重跑；若不稳定如实保原红，不用这个filtered绿冒过。

361是正确stale-file red variant：源959/39owned，只StoragePanel覆盖为原360，新增runtime-storage.test 3绿1红（50738 exit1/4740ms），实际旧A文件finally将新B chooser.value清空（'' vs B）。原codec/Actor不改。当前WT已修cleanup只在同token/owner/live清value。

362是正常当前修后959/39owned、overrides空；正在跑r362-ui-repair（6完整文件：5driver+runtime-storage），统一session34026。必须继续这个句柄，原测试JSON/result未读完前不说过，不重启。尚未跑362 type/build和当前完整model/更多UI原组；没对B4做选择提交/post/STOP。

## 当前Chrome真实早期现场

主用户5415/tab387928794仍旧351/942正常129/2025Oct1/270137.33/AP4/改善住处、原文82f3147a..，server30475/PID99897保可玩，本轮未操作其业务/设置/偏好或换source。

Chrome选定ID4/gameChrome复用（Cua rewrite文档最后那个4为当前）。B4早期QA server32966/5527，源360/dist-u6-review，当前自有runtimeTab=387929016，已markHandoff。native-r1已先input/plan/tasks，未STOP。源360首次真实默认Worker读旧DB时，设置按钮504ms工具elapsed实际打开，status仍在读取本机存档，a01 DOM/PNG保；没改checkbox等设置，非正式INP/性能结论。

单次Continue实际读原normal330/2022Jul1，0新import/Create/Core，enterprise66458.24、AP3可用1预留、原Q2服务继续，a02早期DOM/PNG保。Cua某些Input/Focus回执超时但随后真实UI已变化，禁止据超时重发时间/导入。Page.bringToFront可恢复当前观察。

只点一次“核对后推进·2022-07-04”后实际原费用modal打开，1662已知待付（含原预留转换）/推进自身0元0点/Jul1→Jul4/完整原支出仍8页，确认按钮实际enabled。a03 DOM/PNG保。随后只点返回调整，回执超时，尚未观察最终是否已关；没有点“就这样决定”，当前应仍330，务必观察而不猜。所有早期证据属于360不是最终新源。之后要改QA到固定最终源再真正wait/停止、UI响应、完整原文/原351后缀、readonly/cold/backup等。

runtimeCdp已读cap文档，Page.bringToFront可用。尝试Target.setAutoAttach明确unsupported拒绝（beforeAPI eventsRead对象，attachResult未定义），没有attach；early360-diagnostic-note.json保，不冒Worker targetInspector证据。真正默认Worker可由固定source默认newWorker+实际Worker脚本请求/通道结果与UI反应绑定；server32966早期浏览器log可读，HTTP全文件逐字核还未做。不要换其他低层工具或改browser权限绕过。

Cua变量：runtimeNativeDir abs354/native-r1、runtimeTab016、runtimeCdp；chainFs fs/promises仍在，gameChrome4；readUiRawAt(tab,dir,name,expected?) helper可用，100000字符切片/wx/noSTOP。别用旧readUiRaw/captureChain（固定旧STOP348路径或旧browser）。完整PRE开着不打印全DOM/AX/4MB text，一次工具string>200000会截断；账本123页innerText是隐藏全文，不是画面全部可见。旧QA330规范对照为349/native-r352/actual330-after-cancel.json（4622781B SHAe2c4fb73c8012ced2b4602c1b347287c34baf97fe519e3276553a3aeed079b33），保持其完整原文，不导入提案。

## 还必须完成

继续34026及UI原完整组修复/原失败诊断，正常新源full type/build/相关全部model/涉及UI。加必要实际早期frame问题修后再新冻结源；Widget状态/取消/原费用和异步reading不丢draft，不能只本地class模型绿冒真实Worker前端。

最终Chrome同一原330服务真实确认/取消→wait范围（预期Jul4，按原屏障），计算/保存中设置开/关和Stop可响应，旧数据不假变，最终以真实已保存停点和完整原回响为准。Worker原lease第二窗口只读、cold/backup/原文及实际commandId后缀与原351完全等值；未做Native故障不冒，作者fakeIDB put后abort原retry已层证。所有兼容/几何专项仍0，不切viewport/缩放/原生离页/跨浏览器。

只有最终足够通过后主5415按实际当前档全文保（别假定永129）再更新新source、前后全文同，0主人生业务/设置/偏好；旧content-addressed资产保、原DB不删，主server保可玩。自有QA/server真正exit后child STOP/seal，root354最后选择性本地提交（明确owned产品/测试及本根资料，不stage mixedmasters/AGENTS/P3/旧未知），逐blob/mode/path及post、再terminal/STOP/fullseal。当前root354与native-r1都活动，没有新commit；不能结束B4或开始B5/U7。

Skills：game-engine与diagnose已沿用；本轮明确应用vercel:react-best-practices，已读SKILL和async-defer-await/advanced-event-handler-refs/client-event-listeners三规则，按引用refs/单UI intent监听/独立read订阅/条件await复核，不新增SWR或任何依赖。无新agent，用户没授权新委派；不push/deploy/外部消息/global memory更新。Memory本轮轻查MEMORY.md654—669（持久goal编排，事实已用repo刷新），final最后仍需oai-mem-citation(659—669, rollout01a14402-3f43-7380-8e27-f02f1d53c60d)。全U6/短文案/closed生态终态/17动作5共享/正常board/最终全审及U7/U8/CUX12完整组合、U9后组合/T17余/PNG0of3/真人0/P3正式62/22not_run/M01须用户明确恢复/T18最后/goal ACTIVE不缩。

## 最新核对

34026已实际exit0，r362-ui-repair六完整文件34/34（45141ms），5份legacy driver新增Hook API适配与stale file修后4case均过。不要再poll该旧句柄。当前新启动362普通完整App.course-workspace文件（无probe/无name filter）r362-course-current，需继续其真实返回句柄，之后完整App.equity-tail原文件。351 baseline完整10/10、360完整0/10和363过滤1/9skip都保持，不以filtered绿冒完整恢复。

早期Native016的原Jul4核对实际已打开，确认按钮enabled；1662待付/原预留转换/自身0元0点/Jul1→Jul4/完整8页，a03保；只点返回调整回执超时，尚待观察实际关闭/仍330。没有任何新Native时间/业务/导入/Create。

## 当前最新覆盖前文

早期Native016返回调整后实际dialog0/status330，0新Core。源360默认Worker原330与Jul4读/取消及读取中设置响应已实证，HTTP55文件逐字同（B96S8STF Worker925KB），非最终源/正式性能。server32966仍360/5527、016仍handoff，DB330保。

课程timeout调查：362普通完整5绿5超时；364仅copied test加fs trace完整10/10、43498ms、每case2.6—4.6s，原submit皆实际终态/controller.asynchronous=false，非UI await死锁。351整10过/360整10超时/362整5超时都保，不用diagnostic绿冒最终普通源恢复。依AGENTS65，已从同原78实际存第二课程79，同首例command-u3c1-course-same-setup-1，Controller/物理859444B/44cde9e2..同、钱AP保、旧351同命令整wire同，51003 exit0/4771ms。course-prefix-r1已STOP/fullseal10/6af67a66..不可追加。当前test共用真正saved79，各case仍原Store.import/Controller/被测新命令/abort/retry和所有原断言；原78/seed/资格不变、不增限时，不冒产品性能。JSON列owned，非正常资本305路径。

365整course因beforeAll验证commandId漏command-前缀而suite guard失败，10case未执行，原红保；已核实际ID并改正确，不改sealed前史。当前367正常961行/42owned，新增runtime-response.ts最小DTO guard不重做主线程GameRun校验；clock.target是string，snapshot先于RPC resolve、saved receipt在已应用public view，坏preview封闭通道不造权限。App跨session错误不显示到新页面。366边界五整文件24/24，32197 exit0/13059ms（坏响应、reading5/storage4），最终type/build待。

当前测试r367-course-tail两完整文件，session67092，继续同真实句柄。r365-course已终态53593 exit1不再poll。当前WT等367源；后续改动用新冻结。36 before保护不含新prefix，最终应加它为37th producer，再加最终Native/main（尚未封）。B4未提交/未STOP，main351/129原保护不变。上次写review脚本SyntaxError是在parse阶段，未写文件，此次已正确写入。

## 2026-10-30 最新继续：368模型全组已实际通过

r367-course-tail两整文件16/16，67092 exit0/21231ms。368同961源/42owned，原local路径yieldControl仅存在时await；type79112 exit0/40803ms、build70302 exit0/1585ms。r368-model已实际终态53558 exit0/551285ms，91完整文件606/606、0skip、sourceExact、P3overlay0，原限时/2worker/隔离配置未改。当前新r368-ui为原17完整UI同组，实际句柄14046；不能因观测超时重启。B4尚无提交/STOP；主5415仍351未写。

Native源368 QA server98988/5527，runtimeTab387929016。360旧server32966已真实exit130，早期360证据保旧身份。368加载中Settings可开/a04，关闭后a05原生当前窗图，因旧Tab helper超时已沿同gameChrome4重新tabs.get同016恢复DOM，不是产品冻结证据。a06 368原330房间DOM/PNG已成功，随后原账打开。只点一次导出已保存存档，目前短状态正在翻开这份记录，尚未打开Storage、不重发。原330完整规范仍e2c4fb73..；目前B4Native0新Core/import/Create/设置变化，下一先全文核同再真实Wait/Stop。

## 368实际原等待已进入，369只修重复busy说明

368最终原17整UI文件98/98，14046 exit0/120984ms，无filter/skip。原330 Worker导出已完成，actual330-before.json完整4622781B/e2c4fb73..逐字等原349 Native330，0导入。原Jul4确认368真实1662/自身0费0AP/7页（旧360为8页），只返回调整，a07/a08；没有误点确认。之后一次主Wait发起，原preview异步短状态后真正原日常保存331/Jul2、332/Jul3，尚在进行。设置真实打开a09、checkbox0/0，合上后仍在等待332；未做设置修改。部分ChromePlaywright/Input/Focus超时和Native AX click只聚焦，实际图/新状态核后改用当前截图像素坐标，2516,170真正Stop已立即出现本次记录完成后停下/底部这一步记好后就先停下，a10保。未把工具超时直接判产品故障或重发业务。当前332保存中，原330→Jul4请求仍活动，不能关tab/server或换源，最终以实际停点核。

Profiler.enable调用3秒超时；后来Profiler.start在Emulation focus准备阶段20秒超时，没有取到profile，不称已定位前台耗时；Page.bringToFront成功。没有真实性能验收。Native正常同一Worker是368，不冒369已上线。

计划先补重复busy说明迁移，再CommandButton只对async+SAVE_IN_PROGRESS不重复small，保binding理由/禁用和全部其它原因。本地旧Controller原说明保。shared-action原真实held Store案例补两路按钮禁用/不能请求及其它资金理由仍可见，未改原断言/限时。369/961/42owned仅CommandButton和shared-action test较368变化，r369-short-feedback三整文件19/19，70979 exit0/19978ms；当前369 type句柄99660，build未做。模型606/原UI98是368准确源，不说369全批重跑。

369 type99660已实际exit0/125082ms；未把它说成371工程通过。收尾发现close后held阅读Promise未拒绝，370原完整runtime-controller文件11过1红，52033 exit1/23542ms，正确pending vs SESSION_CLOSED反例保。371仅client.close在真正原owner close成功后拒绝剩余pending、读计数归零/通知再清订阅；原candidate确认/写保存/close拒绝不变，test保held迟回信不能复活、物理原文同。371/961/42owned，当前六整边界文件r371-boundaries句柄93135，继续同句柄；371 type/build未开始。当前Native016仍实际368/原Wait活动，Stop本地已实际确认、最后观察332/Jul3保存中，不重发、不换源、0新导入/Create/设置变更。

## 最新重要事实：真实333/后缀已过，主标签身份变化，最终372在编译

- 368原Wait已真实终态333/Jul4，3个实际AdvanceTime（Jul2/3/4），不是预想331。Stop在332保存中实点截图像素2516,170，立即显示本次记录完成后停下/这一步记好后就先停下，最终本段等候已停。a11实际结果图/DOM保；原支持1500/1点由预留转实际，企业可花68096.24/客户保护2783758/原应付324，AP3可用0预留1已用，个人未变。0新import/Create/设置。actual333-after.json4652925B/81fd365fd9113d43ebf7a940db98f5365537c0c3cb42d37a4e89ce80615d90dc；actual332-backup.json4648149B/88b4a0d933d9df9d91820a7de269553623c8894921e0b7b8cc143791c8ec3db7，原330-before4622781/e2c4fb73..保。
- Native audit88665真实exit0/352475ms，原351同3个实际ID/phase全后缀重放，最终333及物理backup332完整wire逐字同；371codec独立import/export原330/333/332/prefix/seed同。native333-audit.json与实际terminal/result保，非fullCreate/Native故障/正式性能。不用重复原重放。
- 371边界六完整文件35/35，93135 exit0/26296ms；371 type83593实际exit0/81735ms，build同handle exit0/2229ms。原370关停阅读11绿1红保，371 close修已核。模型606是368/91完整文件，UI98是368/17完整文件，369新19和37135另按源分层，不称最终一批全绿。
- QA371 artifact已准备.native-r371，72文件HTTP逐字同，root native-serve-artifact.json/native-http-source371.json保。原368 QA server98988实际exit130；当前server49241/5527/.delivery/t17-u6-runtime-native-r371还活。runtimeTab016已reload到371，Continue同333（0Core/import/Create），已真实冷读到333/保存/可花68096.24，暂停按钮最终enabled。还没导出该cold全文、还没建readonly第二tab。
- 371冷读短暂view已来但library仍busy时，App全局误用正在把这一步记进日子，不准确。最终372只App一行：原needsUnsavedWarning为真才记进日子，否则正在翻开这段人生；Stop优先不变。未变规则/钱/权限/Core/Codec/Worker。372/961/42owned已freeze，当前type→build真实句柄35680，仍待终态。不因这一行把旧Native回响说成372业务loop。
- prepare-serve/check-http工具已改需kind+revision，后续生成native-serve-artifact372/main-serve-artifact372及http-source372，不覆盖原371报告。Native旧asset源固定已服务371（含368），Main旧源351。372当前还没build完/没serve。曾准备.main-r371/110文件但从未在主5415服务，不能称主已371。
- 主旧ID387928794不存在。gameChrome4 user.openTabs精确发现URL5415现为387929019，已claim/markDeliverable；初因Chrome把该tab丢弃，后台CDP focus超时，不能当产品故障。用原生Chrome Cmd+L、paste准确完整URL、Tab/Enter在已有tab建议切换（typeText会丢冒号，未提交错误URL）。没有打开新主tab/改Chrome设置/重选browser，用户其它origins没写。激活后旧351入口实际正常129/2025Oct1；只Continue/打开原账导出，完整1317268B/82f3147aa4684334f032886300292fd906050af25e873c1ded5a69c87b5621e7与原同。main-r1先三文件，a01-before图/DOM和before.json保；已全部合上读层/dialog0/保存129，无用户业务/导入/设置/书签。主server30475/PID99897仍351，尚未更新。
- Cua变量runtimeMainTab019、runtimeMainDir abs354/main-r1、runtimeMainBefore{raw,bytes,sha256}；runtimeTab016/source371/5527/currentforeground。gameChrome仍4/runtimeChromeApp仍nativeChrome。背景discarded tab需先用Chrome omnibox准确URL的已有tab建议激活，不能反复重选browser。Native AX click有时只聚焦，截图坐标为原图像素（不是除2），Stop2516,170已实际成功；工具超时先核实际状态，别重发Core/导入。
- 尚未主上线372、未readOnly/cold完整原文、未关闭QA49241或016，未commit/STOP，B4唯一未完。不进B5/U7。所有原U6/goal责任与兼容0保。

## Oct31实际恢复（覆盖上面旧活句柄）

旧22141/30475句柄已missing，进程表无5415/5527，HTTP均连接失败，属于真正停止，不是超时推断。已恢复原主351 server69191与最终QA372 server86129；main仍未更新。Chrome旧4及016/022/019标签均无，当前库存Chrome1/用户1只有newtab，按真实环境创建新标签170/5527，原DB333仍在，0新import/Core/Create。Cua已恢复，当前resumeBrowser1、resumeWriter170、resumeReader174、resumeMainSurface177(5415旧351)，rfs/rcrypto/resumeRoot与readResumeRaw helper已建。原始Chrome Native App仍同程广，实际存储有原DB，不能称换档或新局。

372冻结961及现QA85HTTP逐字同，native-resume-http-source372.json保。Writer已真正Continue333/Jul4、68096.24/AP3可用0预留1已用并完成冷读，actual333-final372-cold.json完整4652925B/81fd365f..逐字等真正368等待后原333；a14实际当前图/DOM保。不再重跑原后缀352475ms作者证明。

曾正常下载按钮waitForEvent超时，实际Chrome弹出OS保存对话框（另存为saved-save7）未确认；已原生取消121，未生成新下载，不算下载失败或通过，不改产品。原只读PRE分段全文成功取得，不依赖下载。确认保存对话框会阻断后台输入，不能把这些超时直接说成产品卡死。Writer读层最终全合上/333保锁。

Reader174已Continue333，实际只读333/原支持Jul11主动作disabled。a15当前图/DOM保；首次账户点击打开当前人生只读说明，实文另一标签占有写权限、本页只读/可查看和导出，未点接管。关闭说明后重开账户原账成功，当前刚发只读导出请求，待Storage真正打开再翻最后可见操作页、只读PRE并readResumeRaw全比原333；0提交。Main177旧351已创建新主标签（旧019已无），原DB1局仍在，尚未Continue/重新读before；需新当前before全字节后才能切主372。不要假定上轮before永远最新。

Native AX点击标签能激活当前Chrome；背景标签的Page/Runtime超时先实际激活，不反复选browser。浏览器物理窗口现在自然用户窗口，未设viewport或缩放/尺寸，所有兼容开发测试仍0。当前未commit/STOP，root B4未完，不进B5/U7。

## Oct31最终接线收尾

Native已真完成：372冷读actual333-final372-cold.json与readonly actual333-final372-readonly.json各4652925B/81fd365f..全等；Reader另一标签占有写权限说明和Clock禁用实际核，没点接管。170/174两QA已实际关，QA86129 exit130，DB保；Native37文件STOP/fullseal f2e11b24d4a6dac53998387e59936ffacf183c57d6e88fcbfe5cc4b46282c792，不得追加Native。原mode1无新Core/import/Create/设置。

主人生当前before-resume.json已真正逐段读取1,308,460字符/1,317,268字节，SHA82f3147a..逐字等Oct30before，不要把字符数当字节差异。Cua长单call读取可能提前超时无文件；分3x100000字符一批已完整成功，mainBeforeRaw/mainExpected/mainReadParts/readMainBatch变量保，原文当前位置尚全文/Storage/账本只读层，0未提交决定，旧输入关闭只读层回执不确定，不重发任何Core。已切主服务：旧69191实际exit130；新主60990/5415/.delivery/t17-u6-main-r372活，110含旧55额外资产，main-http-source372检查句柄17869需核终态。主177已reload最终372，当前入口正在读取本机存档，尚未Continue后取after全文；旧只读层因此安全合上。需要最终129/270137.33/AP4/完整after全等和实图、全部读层收起，再Mainchild终态STOP/seal，39preserve、本地commit/逐blob/post、父STOP/seal。

Cua当前resumeBrowser1/resumeMain177(唯一controlled主tab), resumeChrome nativeApp；resumeRoot/rfs/rcrypto/readResumeRaw和mainExpected/1308460仍在。Browser原生截图曾显示空白紫色，Page screenshot a02-resume-before已真实正常scene；不把工具/paint差异冒产品新缺陷或兼容验收。Native等停止主循环368与最终372codec/Worker字节另核，UI最后仅冷读一句不同。B4仍未commit/未完成，HEADa6f1bf85/index空，不进B5/U7。

当前主60990/372/110HTTP过。BrowserUse .click多次仅focus并Input timeout，实际Home未执行，没有重发Core。最终通过原生Tab surface resumeMainSurface.getAXState→click14已真正进入正在翻开人生（继续/新人生/导入禁用）；这就是本次真实Continue，非已保存新命令。后续简单UI优先该原生Tab surface索引，不用NativeApp整窗（整窗AX/Screenshot紫色不含页面），长文本仍BrowserUse只读DOM分批读取。当前主after全文还没取，主数据不变待最后核。Root仍未commit，Native37封存已保。
