# U1 当前尝试模型交回（源码冻结）

仅新增 opening-attempt.ts 与 opening-attempt.test.ts。API已在源文件导出：openingAttempt(p,focus?,focusQuarter?) 返回 OpeningAttemptView|null，包含原thread、具体目的/终点、展示动作意图、首单阶段与公开receipt、显选后续去向。仅2020-Q1首单与个人market/free entry；其他对象与季度由旧模型处理。

首单available为letter（原接/拒/跳过由offer-reply承接）；planned/running分别沿原日期；完成制作为delivery仍须提交；review/delivered为feedback且无独立领款；原实收为paid。receipt金额/成本/净额直接取公开firstOrder四结果字段，日期与引用仅同合同公开payment记录，缺日期留null。非成功不造收入；中断/逾期仍给原CancelContract，未称完成。责任override不由本函数过滤，交付自身barrier仍有delivery。

下一步video/工作生活/模拟投资只是显选导航与空入口focus，不执行或默认rest/工作/接单；无任务积分或新业务状态。模型不preview/调用controller/存储/随机/隐藏原档。

定向13项真实新局/原命令：三entry、两背景首单安排→开工→完成→提交→Jan20同次实收与重进、六非成功出口、错run/account/实体和其他原模型对象、实际IDB head.put后abort/旧物理/读锁拒写/同候选retry/重复幂等。没有伪造业务投影。

首轮unit-r1真实exit1：4pass/9red，其中8原默认5000ms超时，1为测试默认focusStatus与显式focusStatus比较错误。原红日志、输入身份和原test全文保留；修后仅一行让前后均显式同focus，所有原断言与时限保留。根已明确停止并发重跑，由根统一单process单worker原默认时限复验。此交回不称13绿或strict完成；根的统一tsc在执行，不另起重复进程。

[杠精审查] 实现边界通过静态自查：无源码规则改动、无拒单分支丢失、没有将计划/制作/认可收入当实收；仍待根正式定向/类型/界面与Chrome，不能以本模块或组件代替理解度/美术/真人/整个goal验收。旧P3/所有封存/兼容暂停保持。

最终两源身份见 source-final.json，原13项红见 unit-r1-*；本目录仍未sealed，未stage/commit。
