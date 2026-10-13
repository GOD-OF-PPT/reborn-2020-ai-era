# 12｜GitHub协作与资料同步

负责人已创建`GOD-OF-PPT/reborn-2020-ai-era`，可见性为Public，默认分支为`main`。本次使用GitHub插件提交文本资料，不改变负责人设置的可见性。原始PNG上传状态见[交付说明](../DELIVERY-STATUS.md)。

未创建Pages站点、远端Issues、里程碑、分支保护或开源许可证；不能把规划清单视为已经启用的远端管理功能。

## 获取当前基线

```bash
git clone https://github.com/GOD-OF-PPT/reborn-2020-ai-era.git
cd reborn-2020-ai-era
git switch -c feature/P001-scope-and-quarter-flow
```

从远端克隆后继续工作。原始资料包中的本地初始提交`4d94e6d`是一条独立历史，本次接口提交保留的是文本内容，而不是原始Git提交对象。不要将旧`.git`覆盖到新克隆目录，也不要强推覆盖远端。

## 补齐原始概念图

从对话中的完整项目包，仅复制三张PNG到克隆目录的`assets/concepts/`下。路径、尺寸及SHA-256须与[清单](../assets/concepts/manifest.json)一致。不要重新生成或改名后误称原图。

```bash
python scripts/check_docs.py
git add assets/concepts/style-01-anime.png assets/concepts/style-02-pixel.png assets/concepts/style-03-cinematic.png
git commit -m "assets: add original art direction concepts"
```

提交前更新交付状态和美术文档中的待上传说明。通过正常分支与PR流程合入，不改写已有历史。

## 旧发布脚本的适用范围

`scripts/publish_github.py`和`publish.ps1`是初始资料包中为“新建私有仓库”提供的辅助脚本。它们拒绝公开仓库，不适用于当前已由负责人创建的公开仓库。保留脚本及其模拟测试是为了记录原交付内容，不要求使用或放宽其安全检查。

当前通过GitHub插件直接提交，不读取、索取或保存个人Token。没有建立新凭据、部署密钥或后台任务。

## 后续开发规范

`main`保存可追溯基线；任务使用`feature/`、`fix/`或`docs/`短分支；小范围PR附任务ID和真实验证结果。保护分支只是建议，不代表已经配置。

[任务清单](../planning/backlog.json)仍有12项待办，`remoteIssueNumber`为空表示尚未创建Issue。模板在`.github/ISSUE_TEMPLATE`与`.github/PULL_REQUEST_TEMPLATE.md`；不自动分配负责人或承诺交付日期。

更新规则时同步策划和验收项；新增历史事件附来源；存档变更记录迁移；资产新增记录用途、来源和校验信息。

## 文本与完整资产检查

```bash
python scripts/check_docs.py --text-only
python -m unittest discover -s scripts -p test_publish.py -v
```

第一条明确不要求原图存在，仍会报告缺失清单。第二条只运行旧发布脚本的模拟测试，不是真实GitHub发布测试。补齐原图后运行不带`--text-only`的资料检查，才是包含三张原图的完整校验。
