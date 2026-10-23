# S3-V1 R7构建与三文件累计交回

R7实际产物：.delivery/t17-s3-v1-r7。原npm run build -- --outDir流程退出0，耗时54771ms；完整425份源集合含保留P3，初末path/bytes/mode/SHA一致。指定三文件累计退出0，实际3文件9/9通过，耗时12845ms；原Vitest配置/每项时限未改，测试后425份源仍与构建前同。

只执行src/ui/VideoSceneChoice.test.tsx、src/ui/video-scene-draft.test.ts、src/ui/video-target.test.tsx；未执行book-layout兼容测试或全仓矩阵，不把旧166或mainline已执行的新event+Map结果合并计数。build中的原tsc仍按原配置检查源；这不是额外兼容运行。

build-production-r7.mjs由R6原脚本复制，仅替换build-r6→build-r7与.delivery/t17-s3-v1-r6→r7两个固定路径。原R6脚本/目录保持。相对R6完整424源集合，只变VideoSceneChoice.tsx（f73b10…→edb33d…），新增独立VideoSceneChoice.reselect.test.tsx（74b84ef…），无删除；两份当前文件与choice-reselect-r1/source副本逐字同，owner before副本与R6真实源SHA同。根先前提及74b84e实际为这个独立event文件；三份原累计文件分别保其真实当前SHA，不混称改过。

45份R7磁盘资源已完整登记file/bytes/mode/SHA于resources.json，累计之后再次读回0差异。http-binding-pending.json明确HTTP尚未验证；根统一换5340服务到R7后，须以该清单逐文件GET核HTTP200/原字节，包括index.html与diagnostics。此轮没有发R7 HTTP请求或把当前R6服务当R7绑定。

检查时5340仍原R6 PID90310，5341仍DEV PID94259，前后监听身份同；R6原45资源磁盘0变。未启动、停止或切换任何服务，未操作浏览器/真实数据库、stage/commit/Git。指定测试只沿其原隔离fake IndexedDB执行。

DEV初始源身份仍在dev-r1，当前同一Vite进程期间已发生必要R7 UI修缮：src/ui/VideoSceneChoice.reselect.test.tsx、src/ui/VideoSceneChoice.tsx；新增source见dev-source-drift.json。此记录表明活动源码变动，不能证明浏览器已消费HMR，也不把DEV初始源冒充R7冻结构建。

实际命令、stdout/stderr、退出/耗时/PID、build tool session、完整初末源/三文件累计后源、owner绑定、资源/服务/DEV变化与最终读回均保存在本目录。此轮只完成R7构建及限定累计，不标Chrome实际修缮、S3-V1/T17/goal或原P3/62/22、PNG/真人/M01暂停/T18完成；兼容开发测试0。
