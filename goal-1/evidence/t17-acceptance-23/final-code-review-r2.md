# S3-V1最后阅读增量代码复核 R2

**限定复核收口，未发现新的确定缺陷。** 本轮只读reading-r1原输入/前后像/相关测试与21/21终态、实际原账核对记录、R8 source-before及当前三份生产源码。未改源码，未运行测试、Chrome、Git或兼容检查。父browser_evidence_guard在新报告写前通过；不改R1修前问题身份。

1. CommandButton.tsx:5—8只增加可选显示翻译reasonText；默认仍为原翻译器。原journeyIntent/controller.preview、disabled条件逐字相同，onClick原kind/payload/label/confirm仍直接交原request；显示函数仅在原preview.allowed为false且原首reason存在时调用，不重算或绕过预览。VideoSceneChoice.tsx:24—25只改INSUFFICIENT_ACTION_POINTS一条，其余code仍走原reasonText；154仅把该翻译交给原CommandButton。当前措辞区分不另耗行动与途中照常发生费用，没有把时间推进称免费。

2. video-scene-progress.ts:127—130只扩显式目标的settled分支。预款取本合同prepaymentFen/acceptedAt，余款取priceFen-prepaymentFen/settledAt，费用取BigInt(priceFen)*BigInt(feeBps)/10000n，和原core/video.ts:341整数分舍入一致；不读取账户余额差、不报净利润或累计收益。feePosted=false明确“尚未登记/不能说已经付清”；feePosted=true且paidCase=false仍明确未付费用；两者成立只说“本单费用已付”，没有扩大成全部企业费用/义务已结清。

3. paidCase来源已核core/video-projection.ts:10：仅settled且原ledger没有sourceEventId===本合同id的remainingFen>0义务，并非整个企业无债。原费用、其他合同与全局义务仍由原账/责任入口保留，season-thread.ts:102仍留未付本单责任。reading-r1/actual-raw-accounting的手工12和AI70各原合同均为900元预款＋2100元余款/150元费用，原流水与0剩余本单费用相符；这只作该两份原文的数额依据，不将他们的现金余额或其他收入当本单利润。

4. R7重选修复完整保留：channelPick/pickedChannel、radio仅setChannelPick、确认才chooseTarget、activate清未确认pick，与reading前像逐字相同；chooseTarget的原账户/完整scope缓存逻辑也相同。新重选事件test SHA仍74b84ef3407bc789236a905df72299e811ca1af19ea4281e89d1da1c6b5e9493。payload parser、busy/candidate/readOnly/主体/原对象门槛与request wrapper逐字同前像；本轮没有回退为radio修改A槽或清客户/cohort。

相关测试读审：真实fixture已付原单断言900/2100/150/5%和实际paidCase/feePosted；未付变体明确标为公开显示边界，保raw不变，不冒充另造正常存档。原正常预算耗尽检查仍由controller.preview原首reason拒绝并disabled，新增只核显示文案/raw不变。sequence的既有4文件21/21、exit0为已保存证据，本代理没有再跑；R8构建终态及实际消费由根/sequence另交，不预报成功。

三生产与两相关旧test当前bytes/SHA均同reading-r1/source-after与build-r8/source-before：

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| src/ui/CommandButton.tsx | 1386 | ac5eeec24edc5d9d6316e157fa5a5eca33d7d0da6870761e22d8c0a4093d9f4f |
| src/ui/VideoSceneChoice.tsx | 33316 | c109791eeeb4513316c8ec5a862f82bc99f2e3ec9278e98b2437a115ee791475 |
| src/ui/video-scene-progress.ts | 22843 | 52f1d3fe1cc5e491e9a4ea9a61af2204b268ba6baa8e52a111eb4783e30aaa8b |
| src/ui/VideoSceneChoice.test.tsx | 10157 | a914d28a52ab6e5a3dc4cec197046cd124d4640656de703a0e245d5c2ece500b |
| src/ui/video-scene-progress.test.ts | 13641 | fc9dd02dc57f5c9a5dc49d03f685869a55cc33be706120728d40280f40c8d55e |

代码复核已结束，不增加修缮。非阻断艺术余项沿旧记录保留；R7实际鼠标/原候选/物理只读/原retry与有限退出按根实证另记，当前阅读增量的R8原生读回不能由本报告替代。真人理解度/趣味性、原缺PNG/声音、余下S3—S5、未完P3/62正式与22例行、M01暂停/T18及完整goal仍不据此关闭；兼容开发测试0。
