# 最少新回归（当前只建议，0执行/0src改动）

1. **普通正常短链，无资格affiliate。** 复用video-scene-result.test.ts的normal/createCampaignRun或prepareReady真实Controller模式：正常Create→OpenVideoChannel→手工hotspot实际完成→人工Review→原PublishVideo monetization affiliate（不申请资格）→原AdvanceTime到measureAt。明确检查该pub.qualified=false、真实统计已发生、无同pub settlement；videoSceneResult含实际统计/本次无资格，不含订单观察或measuredAt+7未来佣金承诺；同focus progress结果而非window，原raw投影前后同。不得赠资格、换seed或修改存档补条件。旧none/ads/合同断言与时限全部保留，新case用原默认body/hook预算。

2. **qualified但同日下架零播放，分层证明。** 可复用video-player-thread.test.ts的独立F02平台helper：两次原发布实际完成→原ApplyVideoProgram affiliate/完成/Decide（夹具明确批准参数，不称正常挣资格）→第三作品实际完成/Review→同日原PublishVideo affiliate＋原UnlistVideo→原AdvanceTime到measureAt。必须明确qualified=true、views=0、cohortId=null、无本pub settlement/原affiliate观察；progress显式和legacy均无window/wait，videoFocusOpen=false，helper统计不编观察反馈。保持原raw与投影无随机/无写副作用。

   Today依赖完整正常journey，F02本身不冒充该前提；如不能直接使用完整官方正常来源，可另用第1项正常公开投影做明确有界display反例，只调整公开pub到上述已由F02原命令证明存在的qualified/zero-views/cohort-null形态。绝不codec导入/提交该display，断言Today.primary结果且ongoing不含该work，原正常raw逐字同；与F02会计证据分列，不能称正常资格端到端。也可在后续正常有据资格前史中真实走同日下架，但本轮不额外重挣多年史/找seed。

本次patch只改helper资格/cohort判定与两个原progress window条件；不改既有case断言、5秒/其它原时限、fixture配置或core。先保原修前红，再应用同源最小patch并精确重跑新case/直接受影响原文件；整171活套终态前不得应用/起测试，最终整体范围与余责由Root登记。
