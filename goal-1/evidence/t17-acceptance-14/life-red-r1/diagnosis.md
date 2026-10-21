# 原真实暂停前提修正

life-check-r1实际5/6通过，原测试SHA 85b8bfd069d67da9ecdc8525f70272bb70bde7e0559fb9fb1bc5f7d6fcc89abd，原stdout/stderr保留。两个真实承诺用例在2020-01-21安排陈屿后，原AdvanceTime目标2020-01-28实际受2020-01-22 PREP-CASE pausesTime=true暂停；保存成功不证明到达目标日期。该测试误把后续running场景当offered，读取空command报错。修正为断言公开CONTENT_DECISION_PENDING、当前日期2020-01-22和原阻塞事件，明确选择其公开0点/0费用默认选项后，再提交原推进至2020-01-28，保留邀请、原实际接受和deadline排序断言。不会改原规则或把停顿跳过。
