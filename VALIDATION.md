# 初始资料包验证记录与本次提交边界

2026-10-13资料整理验证。以下检查只针对资料和发布辅助工具，不代表游戏可运行或远端发布成功。

以下“已执行/没有执行”记录原始资料包生成时的状态，不是本次远端提交回执。本次通过GitHub插件提交文本，三张原始PNG待上传；最新状态见[交付状态](DELIVERY-STATUS.md)。

## 已执行

- 资料完整性：Markdown相对文件链接、JSON解析、任务唯一ID与依赖无环、验收项存在。
- 三张原始PNG：文件签名、尺寸、字节数与SHA-256一致；另以图像库验证文件可读取。
- 发布辅助脚本：12个模拟命令测试，覆盖新建私有仓库流程、账号错误、工作区未提交、错误分支、无关origin、已有仓库重试、公开仓库、陌生分支、历史分叉、网络错误与推送后SHA验证失败。
- Python脚本语法编译。
- Git初始提交、对象完整性、bundle可独立恢复、恢复后资料检查及工作区状态。

## 没有执行

真实GitHub建库或推送、真实账号登录流程、PowerShell运行环境中的启动器测试、游戏引擎测试、前端构建、浏览器视觉回归、部署、真实股票数据回测。

模拟测试证明所覆盖的分支逻辑，并不能证明真实权限、网络或本机环境一定允许发布。

## 重跑

```bash
python scripts/check_docs.py --text-only
python -m unittest discover -s scripts -p test_publish.py -v
python -m py_compile scripts/check_docs.py scripts/publish_github.py scripts/test_publish.py
```

远端状态见[交付状态](DELIVERY-STATUS.md)；发布成功后的实际回执另存在本地`.delivery/publish-receipt.json`。
