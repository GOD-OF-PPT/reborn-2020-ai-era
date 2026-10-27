# 唯一P1日期API最小补正

原core addDays只支持非负count；服务日数已校验正safeinteger，故minimumTermEnd=addDays(from,serviceDays-1)与原to-1逻辑等价且使用允许参数。仅一处替换，保原StartRelayServicePeriod to<=termEnd+1、所有14测试与日期边界断言，不更改core/helper未知分支或其它行为。保独审原件/源前像/逆替/首末保护身份，交state限定补读与Root统一工程；本Owner不执行任何检查。
