# 同一U6恢复任务：623审计与受限保存容量修缮
原71876/15729已actual exit1，失败为旧459 codec的packSave第57行SAVE_TOO_LARGE；原624/Oct20仅proposed未保存。原最后623/Oct10已逐字保全（10390858B/SHA42aa446291c91e544931ea2b64339d7af4ae4c0f84e2b0c54dd5681122a29cdc）。当前优先处理保存数据正确性，缓存预算修复延后但保完整合同。当前不恢复旧producer、不改旧执行输出或Main/DB，全部页面兼容开发测试0。

## 输入与发现
原execution-r1还保留了实际kernel416计算得到的unwritten-proposal.json（125193244B）与serialization-failure.json，明确624/2024Oct20/proposed未写；这是真实原失败提案，可用于编码旧红/新校验，不需另造624或为诊断重复全日期计算。它不是正常已提交624，不可拿来跳过原恢复send或声明董事/2025路径完成。
原packing级别3；版本3的dictionary token/zlib/base64格式已有旧读器。限制保持encoded10MiB、logical256MiB、nodes5m、depth32/members100000及全部原JSON/兼容版本/钱/日期/AP/权限/完整保存校验。不得提高限制或丢历史来通过。

## 顺序与验证
1. 独立原623审计：原416 registry+459 codec整档import/export逐字同；同原605 commands/causes/ledger/timeline完整前缀、606—623共18原命令指纹与实际journal/preview/日期/namespace同；623 physical与保全副本/作者记录同、pending624未存在于committed receipts。读取公开当期对象与原控制点，不猜下一恢复位置。旧605的更早417/372验证明确复用，不冒本轮新跑。
2. 完成审计后准确fullseal已结束execution-r1（包括所有失败/未写提案），root仍active不seal。新输出只写本子/后续post，旧producer及71旧seal不追加/改写。
3. 在冻结469（与原459同packing body）做旧基线和容量试验：保旧level3首选及所有原适配分支；仅当原dictionary候选放不下时，考察同格式的固定强压缩fallback。先在真实未写624提案验证原codec仍SAVE_TOO_LARGE，并记录真实更强压缩后的完整wire大小/旧读器支持；没有测得可用空间前不写产品补丁。
4. 若有据可行，最小改save-packing.ts和专用容量回归；默认能放下的历史wire必须仍原字节，fallback须固定有限次数/确定性选择，计算完整外层JSON的真实UTF8大小（不只算payload）；最终仍超限继续原SAVE_TOO_LARGE。原v1/v2/v3读取、schema1—12拒绝、逻辑hash/metadata/字典与解码限额全部保。无新依赖或规则/版本/业务变化。
5. 新旧容量回归旧红→新过；相称packing/dictionary/encoding/codec与session/数据消费者、类型/构建，原错误/阈值/损坏/炸弹/同文本确定性保。真实623旧wire不变、真实原未写624新wire<=原10MiB且candidate codec import/export确定性/全GameRun同；原旧459读器也能读新wire并得同GameRun，但旧encoder对624仍应保原超限红。原624从未有成功old wire，不能捏造“同原624 wire逐字一致”，应比较实际原kernel提案全状态；原613/623已存在旧wire仍按原字节核。
6. 提交与读回后仅完成本编码修缮子；恢复实际原623→624和原Q4/2025全策略是下一独立子，仍必须原preview/evaluate/codec/完整保存与原commandId，不能注入现成proposal充当已执行。Main/native/正常board/最终U6/goal均不因此完成。每三子累计review按原链继续。

## 风险、反馈环与回滚
压缩fallback可能耗CPU/内存或仍无足够余量，先用已发生proposal定位，计时只是观察不冒正式性能；必须重复用同文本确定性并保原上限错误。旧读器只依赖同zlib格式的事实要用实际导入验证，不靠推测；不做任何页面兼容/尺寸/缩放/跨浏览器测试。原白名单/错误先后/原子保存不可因编码调整被省。源冻结不带P3，只owned packing/test，先存前像；回滚仅这两源，原head623、失败624提案及71旧seal/P326/132marker/2links/原61B输入/未接线model/master前缀不动。
若强压缩不能容纳真实624或后续验证有红，保结果并继续有据调整，不放松数据/大小门槛，不宣布已修复。原完整2025/80万董事实际签署治理、17+5深态/最终U6/原所有后续组合/T17其余/PNG0of3/真人0/P3正式62和22未跑/M01须明确恢复/T18最后/goalactive全部保持。无push/deploy/外发/新委派/global memory写。

[杠精审查]通过准备：原最后存档和真实失败提案优先；完整数据/旧读器/所有guard是门槛，未用提高限额或缩小正常路径替代目标。实际恢复不混入本子。

## 已有实际可行性与回归设计
真实原624在原codec再现第57行超限红：level3完整wire10510786B>10485760B；同token/metadata用level9为9876634B，原旧459 reader成功导入且完整原提案GameRun canonical hash相同。它仍未保存/未接原人生，未改产品。
新容量单测使用真实原10MiB/256MiB/5m限制的packing-only JSON fixture，不冒正常GameRun；固定测试LCG序列，仅按大小有界定位压缩边界，避免受content变化影响的脆弱固定N。原真实624是独立正常提案验收。新增三例：必要fallback全字段/Node-zlib读回/确定性、默认能放下保持原level3全wire、level9仍超限拒绝。大体积构造setup120s/各case60s在首次基线前已声明，不提高原现有用例限时、不作为正式性能。

## 首轮55检查的超时分层
源472首轮4文件55中54过、fallback大数据正例原60s超时（71336.75ms），原报告保红；其余所有packing/dictionary/encoding与新preferred/仍超限两例过。先检查测试自身10MB Buffer的通用deep equality成本，改用Node Buffer.equals比较全部同一字节；不减少数据、断言或提高任何timeout。另有并行type/实际codec负载可能影响时长，待后续原限时再核，不从一次超时推产品错误或称全批绿。最终测试修订另冻473；472产品与473必须逐运行源同，原实际472整档验证仅在明确源等值后复用，不冒同一次源码批次。

## 最终固定源473验证
旧471容量3例2过1实际SAVE_TOO_LARGE红；472首轮55中54过1新60s超时保红。只将测试10MB Buffer深比较换为原生完整字节equals，数据/断言覆盖和所有timeout不减/不增，最终473的4文件55/55和18文件157/157，212独立case同源全部过、0skip（两批，不倒改旧红）。最终473类型71595ms、构建2190ms过；472与473类型实际运行区间不重叠。无页面compat开发测试。
实际产品472（与473仅一测试行不同，所有运行源/配置/资产同）已证：旧623全部10390858B/42aa4462…29cdc原wire不变；原未写624提案完整GameRun导入/导出同，产品wire9876634B/d6d40872…70e118e<=10485760、重复编码确定性，且与旧459读器已验reference wire逐字相等，旧读器结果按同字节明确复用。原旧encoder对同624仍SAVE_TOO_LARGE（10510786B reference），无成功old624 wire可比较，未捏造。623独立整档/605四前缀/18指纹已过，失败execution14完整封存、72旧seal保护通过，125193244B未写提案原字节仍保并有17148175B无损归档，归档不是游戏存档。
