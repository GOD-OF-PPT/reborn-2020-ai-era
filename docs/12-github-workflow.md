# 12｜GitHub协作与同步 v0.2

负责人已创建公开仓库GOD-OF-PPT/reborn-2020-ai-era，默认main。当前工作保留可见性，不变更权限、分支保护或上线设置。v0.2文档在e172f184文本基线上更新，不导入最初资料包的独立Git历史。

## 从当前远端继续

```bash
git clone https://github.com/GOD-OF-PPT/reborn-2020-ai-era.git
cd reborn-2020-ai-era
git switch -c feature/P002-project-scaffold
```

任务分支使用feature/、fix/或docs/；PR写明任务ID、规则变化、存档兼容性和真实测试。不要把旧资料包的.git覆盖到新克隆，更不能强推旧历史。

通过插件提交时：先核对目标与分支头；在原树上构建更改；创建以当前提交为父的提交；更新分支前再检查并发；仅快进，不强推；最后重读main及提交树。远端变动先检查冲突，不假报已完成。

## 任务与阶段

[backlog.json](../planning/backlog.json)现为22项本地规划记录，关联Q01—Q24验收。remoteIssueNumber为空即未创建远端Issue，assignee为空即未指定真实负责人。M0—M5是计划阶段，不代表GitHub已建立同名里程碑或Projects。

任务完成必须有实现/内容/测试证据。范围调整同步主设计、经济/事件规则、验收矩阵、任务清单和决策记录，避免五类机会只存在于一份文档。

## 检查命令

```bash
python scripts/check_docs.py --text-only
python scripts/check_plan.py
```

第一条是已有文本/链接/JSON检查，仍报告三张原始PNG缺失；第二条是本轮新增的规划依赖、验收ID覆盖与固定算例核对，不是游戏测试。实际本轮运行范围见[VALIDATION](../VALIDATION.md)。

旧scripts/publish_github.py与publish.ps1仅为早期新建私有仓库交付保留，不适用于负责人已创建的公开仓库，不要求放宽它们的检查。旧12项模拟测试不等于真实发布或游戏测试，本轮没有把旧结果当成重新运行。

## 原图与公开发布

原始PNG仍待上传，路径与哈希以[manifest](../assets/concepts/manifest.json)为准。补传使用原始文件，不重新生成或空图替代；复制原图而非旧.git。完成后运行不带text-only的资料检查，并更新资产状态。

资料可公开不等于已授权部署游戏。没有创建站点、远端Issues、里程碑、部署密钥、真实支付或许可证。后续公开上线、收费和素材/数据使用条件另行决定；不得为资料同步收集个人Token或修改无关仓库。
