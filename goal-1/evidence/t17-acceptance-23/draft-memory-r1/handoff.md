# 纯视频草稿内存交回

API：VideoSceneDraft（原完整12字段）；videoSceneDraftKey(runId,accountId,target:VideoSceneTarget|undefined)；createVideoSceneDraftMemory(runId):VideoSceneDraftMemory，read(runId,accountId,target):VideoSceneDraft|undefined、write(runId,accountId,target,draft):boolean。section导航不变业务key；完整run/account/channel/work/contract/marketing隔离，factory异run拒读写，读写均复制。

4/4纯单测、定向strict0；两次检查同两新源SHA，最终见final-source.json，源码现冻结。日志与实现前原类型/依赖身份见本目录。原VideoSceneChoice export由根移除本地类型并re-export本类型，我未修改组件/App/GameTypes或原生产三文件。

本模块无localStorage/游戏存储/命令/random。Map仅factory闭包；根负责以本run React实例持有、读回并处理资格/原目标/候选，不自动确认草稿或执行命令。真实Chrome所见失草稿问题仍须由根新构建实际走完整记录→返回复取验证。
