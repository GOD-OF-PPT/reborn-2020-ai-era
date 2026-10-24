# U1最终保全

- [x] 1. 比对原P3 26、root19 1197/110、旧110 markers、root27 850/87与post38/1；全部精确字节/SHA/模式/集合通过。
- [x] 2. 原input61B保持；三master完整等.baseline，HEAD差异唯一原P3 2304B/14LF/d6d2…；三offset与原HEAD恢复均实核。
- [x] 3. 留只读checkMasters/checkPreservation及严格append manifest参数；只报告当前exact实际exit0，不预报未来append/commit。

[杠精审查] 通过：root19目录/模式有封存R1实际锚点、不是猜总数；marker与payload范围分清；原P3和Git/index未写；没有把保全当游戏或兼容通过。未来append模式整份current仍拒绝复制P3，若HEAD变更会拒绝并需独立新提交读回。现证据与checker停止写入。
