# 实际active-refresh原档查找

仅只读root10/root24全部现有JSON，识别46份含checksum/runId/state的codec形原文。当前仅1份有planned/running课程refreshJobs：root10/current-course-finance-r1/t11-f05-final.json，原course-fixture/revision30/2023-01-12，原job crs:12aa3f8970b747ce016c53d24a0b6919为running，Jan19预计完成。完整raw/原job的SHA已在found-raw.json。另10份含更新的原codec档均为completed，不能据其末态假造active中间帧。

createCampaignCodec().import唯一active原档实际拒绝INCOMPATIBLE_RULES_VERSION，结果campaign-import.json。原因该原文rules-t11-fixture-v1/course-fixture-v1，不是当前normal campaign；没有改raw字段/重编码/伪造view或命令。没有因此写新回归，也没有运行游戏/unit测试。已先报Root，等新的真实normal active导出，或Root另授权按原isolated fixture codec核handler；两者证据身份不能混称。
