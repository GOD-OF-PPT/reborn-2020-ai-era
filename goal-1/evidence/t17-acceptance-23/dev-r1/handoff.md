# DEV验证服务启动交回

已核5341启动前无监听，创建本目录前先检查root23父guard，子目录写入亦检查guard。原browser-game.ts/abort-after-write.ts仅读不改；使用指定命令启动，服务保持运行供根继续原Chrome任务。

启动命令：rtk proxy npm run dev -- --host 127.0.0.1 --port 5341 --strictPort。cwd /Users/gordon/githome/reborn-2020-ai-era；tool session 30738；实际监听PID 94259（parent 94240），127.0.0.1:5341。完整请求argv与进程实际Vite argv分别见launch-plan.json、running.json，原package追加的重复host/strictPort按实际保留。

http://127.0.0.1:5341/ 已实际HTTP GET 200，1252字节HTML及响应头/哈希见running.json、http-index.html。实际持续日志在仓库.delivery/t17-s3-v1-dev-r1-http.log，位于证据根外；startup-log-readback.txt只固定此次启动读回。HTTP200只证服务响应，未运行页面脚本或实际故障/交互验证。

故障URL：http://127.0.0.1:5341/?storageTest=abort-video 。该原seam只在import.meta.env.DEV启用，使用隔离DB reborn-2020-t10-video-abort-validation；一次性在head.put成功后abort实际readwrite事务，条件为该行video.works.length>0，不限AI或新作品。rev53本身已有一件手工作品，若经此页面导入并触发同head写，可能在导入时消耗故障；不能把其后AI单默认称作故障触发点。本代理未打开浏览器或操作数据库。

initial-source.json记录启动前425份源/配置/引用物件的字节与SHA。服务运行期会发生已授权必要R7 UI修复，Vite会读活动源码/HMR；初始身份不是冻结构建，也不替代根后续的R7源、浏览器/保存及原文证据。没有改mainline当前VideoSceneChoice修缮，没有stage/commit、Git、测试、兼容或其他服务/数据库操作。
