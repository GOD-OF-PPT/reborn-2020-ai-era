# VideoPublicationTerms：R2未应用候选交回

只准备候选，没有改src、原测试、原册/core许可或R3图；没有任何测试、语法/type/build、引擎/浏览器或Git执行。R1未应用版本保留为知识边界补正前稿；仅R2供Root后续审阅，不应用R1。

## 产物与API

[完整未应用补丁](publication-terms.unapplied.patch)包含新src/ui/VideoPublicationTerms.tsx与三处最小接线。新组件正文见[候选源](VideoPublicationTerms.tsx.candidate)。API为VideoPublicationTerms({video:VideoProjection,date:string,workId:string,monetization:string,className?:string})，纯展示，不读隐藏fact/roll，不改变许可、创建请求、阻止radio或设置流程开关。

VideoSceneChoice只pub页把原泛述替换为共享Terms，原radio/AI标识checkbox/载荷/parser/guard不动；VideoCommandDetails仅先添PublishVideo分支，同Terms读取实际payload的workId/monetization；旧AcceptVideoCommission body逐字保持。date新增可选只为兼容原3测试调用，原确认入口由CommandDetails传捕获view.date；缺日期给重新核对提示，不默认今天。组件在选择和原确认共用同一资格与文字。

## 玩家所见与知识边界

- 同workId唯一匹配实际work，再绑定唯一原channel；未知/重复对象不取第一。第几版只取work.version，已发布作品显示原发布日/统计日并要求核对，不创造新的统计窗口。
- 原统计日取addDays(date,7)，当前eligiblePrograms必须严格统计日<expiresAt；统计日等到期日不算覆盖。
- 肯定资格另要求同channel/program、resultRead=true的application已批准、decidedAt<=本次日且窗口覆盖。先取得已读集合，之后才读批准/到期；再与raw strict窗口共同核，不把原公开eligiblePrograms中的未读批准提前说出。
- 同program完成未读回信，只用resultRead/job.status识别，统一“这次申请回信尚未查看，先翻原回信核对收益条件；发布不保证到账”，不依据未读approved/expiry区分成败。有已读有效旧许可覆盖时，它优先于新未读回信；其它尚待核对申请也中性处理。
- 无覆盖且无未读不明项，才明确本次只统计曝光与询价、不产生该收入，后来获准不补这次收入；有覆盖也不保收入、应收和现金分开。none不申请变现。affiliate须本次资格成立且统计时实际形成受众才有后续原订单观察；不承诺订单、留存或收入。

## 保留的实际验证责任

17项仅是Python文本/范围核对，不是游戏测试或TSX语法/类型通过。旧Accept body、videoDraftCommand、原发布控件、原3测试文件均保；4个活文件初末byte/SHA同，新组件不在src中。before原件与SHA在before.json；candidate-check.json保范围/末核，未应用标false。

Root在当前全171终态后自行审阅/应用，并在既有正常unqualified回归加真实Publish资格对照：无资格、统计日等到期日、已读有效批准、批准/拒绝两种完成未读的同中性文案、旧有效读许可+新未读，以及affiliate实际形成/未形成受众。上述是待验证责任，未执行。本Terms仅解释选择，不会独自修复progress无资格或0cohort的虚假等待；那项仍由Root原后续补正承担。

## 应用基线（当前活源前后同）

- src/ui/VideoSceneChoice.tsx：36596B / 8f4e5b62606a12db8222aa17932874fbeb3b78d3c803f73dc86a236a0d24575b
- src/ui/VideoCommandDetails.tsx：1235B / cb8fe4b2eb0deca99059fb6ff32e0848c9001672a976ebd475bd9fe74b2c05c0
- src/ui/CommandDetails.tsx：12787B / 3a22f9a25326d8ab537364d1bade35acbcf7c683a0b2011669b59e101dbbc5b0
- src/ui/video-command-details.test.tsx：1853B / 6a682a0092f057785a8c3f624aecfe0c092215c070157feaad6cc66d66e1cadd

## 候选冻结身份

- VideoPublicationTerms.tsx.candidate：4540B / 0692eb33eb7104c97b69cd9fe1e1a57b5ea3bd0f830091346292ad5c8ffc09c4
- VideoSceneChoice.tsx.candidate：36664B / 737de33751316362c676934c9e8ac7c3800a1257730d350eff5d8fd0f2f38889
- VideoCommandDetails.tsx.candidate：1727B / da64d7b1daade0ca6441efa264ade65ccc3c0fef5473d408ce3a8293e190186d
- CommandDetails.tsx.candidate：12804B / 064c4bef66b3a55cb310f410f804a4500504069ea767b690889ffc5fa7ddfbfa
- publication-terms.unapplied.patch：10456B / 73b934c6860ea61802d42ecb3b66e0e46457b3a290dba3c723993a9c2264623c

以上仅候选，不预报生产修复/视觉/真人认可。未来活源变化时先按before重新对齐，不覆盖并行变更；本scope到此冻结并停止writer。
