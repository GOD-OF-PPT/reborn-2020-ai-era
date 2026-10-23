# C2报名名单便笺候选（未应用）

仅准备可审阅候选；src编辑0、测试文件编辑0、测试/类型/构建执行0。当前fullunit-r2的487输入逐bytes/SHA/mode全同，详情live-source-readback.json；这不是完整仓库或单测结果声明。

唯一待Root在完整单测终态后应用的正式文件：choice.patch 与 tests.patch（标准a/src/ui → b/src/ui diff）。对应完整candidate在同目录；不要用通配符应用choice-first-cap-limit.patch，该文件仅保自审首稿。所有原before完整保留。

基准：Choice 40710B/SHA59560d144deb448f371f3287b9f536fa498f64a9cdb90f649a9c42cb68e99154；test13093B/SHAb4e36461f9333c6b94c82d37bf3708c97f2d5c423463eac23471cab03e533223。Root若并发再改这两文件，请逐hunk重基，不整份覆盖新源。最终候选/patch SHA在candidate-files.json。

## 具体候选

Page只新增enroll-people，仍同enroll草稿槽。默认enroll是拟接名单：现留存/班额余席/本稿人数、明确按原记录补N位、已选编号逐位移除、原preview允许时展示拟预款/拟增加保护/收入0。补齐与移除均函数setter读最新Map稿，只更新personIds；不onTarget/request，不自动报名/收款。移除重复编号时一次仅移除一个原项，其他重复仍须明确处理。

纯helper courseEnrollmentBatch只从seatLimit和paidRemainingFen>0原口径算余席，保已有IDs原顺序，显式补当前availablePeople顺序。旧稿失效/重复/超过余席时返回issue+null，不过滤/截短或换人。已满班、无可补对象不会生成新增名单。来源名单不额外设240人数上限；240仅原班额合同上限，不删大型来源名单。自审首稿曾错误把availablePeople也限240，已在正式候选修正并补纯边界，不当作运行失败。

完整167人的原checkbox只在详细页渲染，原成员和原全选能力保留；全选明确命名“全选原列表的167人（不按班额截短）”，超额仍交原preview拒，旧名单不被暗缩为5。footer保持原CommandButton/preview/confirm，可返回名单便笺；onInspect仍同target+enroll槽。没有CSS/物件/资产/模式/原命令改动。

## 测试候选与来源

actual handler候选直接引用root25/chrome-r3/c2-saved91-planned-cohort.json（正常原来源，身份before.json）：Jan24、5席、167实际未购意向、报价999，先显选原意向2/3/4/6/7；没有造真人、收入或view。覆盖显式批次/保旧选择补齐/逐个移除、另一个Map消费者在旧handler事件前写入仍被保留、167全名单/超额原preview拒/原册同槽/不换书签/原确认完整IDs与存档不变。纯helper另测重复/失效/超额/当前留存与全退计数/满班/来源不足及来源>240（纯函数边界输入，不是伪造accepted view）。

旧3条测试断言与原20秒时限全部保留，只有原enroll checkbox测试先明确进入详细页的动作适配；新增2项后同文件共5项，均未执行。candidate-review.json核旧expect整行都仍在、parser/作用域/guard/request/submit/show/activate逐字同。Root应用后可先单worker仅该文件（原时限）、相关UI/类型，再统一生产与当前Chrome实际验证；本候选不预报绿。默认便笺实际分页/阅读密度仍待根新图，不以代码保证一页或点击结果。
