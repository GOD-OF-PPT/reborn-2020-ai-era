# 首条原624实际保存核验
- [ ] 同步捕获actual head/journal并独立读回完整GameRun/623全前缀/624指纹/整wire。
  - 实际capture与身份：
  - 全状态/全前缀/唯一新命令：
  - codec整wire与旧reader复用层：
  - [杠精审查]：
  - 提交/封存：
仅当前原恢复的读回里程碑，父任务/U6/goal仍未完成，compat0。

原producer中断后无624成功保存，物理head仍为623。本读回准备的实际执行状态为not_run。后续接续采用已验证新源时再建立对应实际读回记录。
