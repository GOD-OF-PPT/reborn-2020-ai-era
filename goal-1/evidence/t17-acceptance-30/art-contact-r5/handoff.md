# Room内部画布候选已应用；源码冻结

仅修改[src/ui/video-scene-object.css](../../../../src/ui/video-scene-object.css)。应用前实际读回与art-review-r4原前像695B/SHA bc69af168007d288f2ce283a75fc2d6d903a8def1f6793a9299d140af50c5482逐字相同，fresh父目录guard与本子目录三文件/前像先于源码。

新增一条Room限定规则，让共同video-continuity-art宽度与现kit/SVG高度同为230，内部靠右；保原160slot、按钮流、字体、全部其它声明与mode。没有其它生产/测试/master写入，没改bitmap、状态、金额/日期/AP或权限。

- 最终CSS：810B，SHA256 ddc6bdc9264aa937a07a1626c4a25fa0ba7e0480548330e4e106fcfc51ae9f11，0644。
- applied.patch：898B，SHA256 f382bf5df390b6aa3a0be977a68877ce563c96b3004a992ea5418c7771fe6c54，逐字等接受的room-contact.unapplied.patch。
- 移除唯一新增规则即精确还原preimage；末次源读回同。原样副本、批准/应用diff与结果在本目录，见applied-readback.json。

本轮只有应用与静态字节范围核对，未跑测试/type/build/引擎/Chrome，也无兼容/几何检查。当前源码调整不等于接触/肩部遮挡已在图上关闭；Root后续R5构建与当前自然窗口实际图另验。原R4图片及审查不改写，不作人类理解/趣味认可。

生产与本writer均冻结；无Git提交，由Root统一集成/提交。
