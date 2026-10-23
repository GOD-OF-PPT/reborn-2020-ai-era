# 本 run 视频草稿内存

只新增 video-scene-draft.ts / .test.ts。沿现有12字段逐项原类型搬出；根负责组件重导出与调用。key含 run/account/channel/work/contract/marketing，section仅页码导航不进入业务身份。factory绑定run，Map仅闭包内存，异run拒绝，set/get复制。

4项纯回归覆盖同对象跨section/属性顺序复取、run隔离、账户与每类对象隔离、读写复制/后续更新。保默认5秒，单文件单worker；定向strict，不扩大长链/全仓/原生验收。

风险：纯内存不替代App真实生命周期接线与Chrome回测；不验证游戏资格/资源或执行命令。回滚只移除新增模块接缝，不触碰游戏档/原证据。
