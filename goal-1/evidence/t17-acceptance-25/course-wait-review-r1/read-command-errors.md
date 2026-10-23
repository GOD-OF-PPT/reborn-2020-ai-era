只读调查中保留两次工具错误：

1. rg目标误含不存在src/core/time.ts，exit2；同调用已返回所需workbench-projection行，随后读实际src/core/timeline.ts，不存在文件未创建。
2. Python固定65—106行读取实际105行timeline导致IndexError/exit1；随后改min(len)读取成功。

均为只读定位错误，没有测试/游戏执行或source写入，不当测试红/绿计数。
