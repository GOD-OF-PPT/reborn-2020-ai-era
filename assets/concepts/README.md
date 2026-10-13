# 概念图清单与待上传状态

三张原始PNG保存在本对话提供的`reborn-2020-ai-era-project.zip`，未重新绘制或压缩。当前GitHub提交仅包含文本资料，以下原图尚未上传；本目录没有空图或伪造占位文件。

| 方案 | 原图目标路径 | 状态 |
|---|---|---|
| 01 动漫 | `assets/concepts/style-01-anime.png` | 待上传 |
| 02 像素 | `assets/concepts/style-02-pixel.png` | 待上传 |
| 03 半写实电影感 | `assets/concepts/style-03-cinematic.png` | 待上传；用户偏好，尚未最终定稿 |

[manifest.json](manifest.json)保留原文件名、尺寸、字节数和SHA-256，供补传时逐项核验。编号按风格内容，不按工具返回顺序。参见[美术规范](../../docs/05-art-direction.md)。

补齐三张原图后执行`python scripts/check_docs.py`进行完整校验；只有文本时可执行`python scripts/check_docs.py --text-only`，它不会把缺图说成资产校验通过。
