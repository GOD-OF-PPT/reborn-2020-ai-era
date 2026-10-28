# 最终重进的自由入口来源

最终185的l02等待“旧历史回今天”按钮超时，l03实际是129/Oct1的本季自由方向入口，未执行任何游戏命令。不能把这个正常入口倒标成旧Q3历史，也不能据此称游戏档回退。

源码可解释该变化：R183只读会话k10中显选“给生活留一段真实的日子”，TodayScene.tsx的prepare(life)明确调用onPrepare(free)，OpeningMoment.prepareToday调用chooseFocus，App.rememberFocus存当前季度的UI关注。season-focus-preference.ts149—165明确允许saved/read_only保存本机关注，并说明不会改变游戏存档。故它是一次显选UI方向造成的Q4自由关注，之后主标签reload读取该关注；不是排序函数更改了人物/钱/日期/AP。当前书签偏好与GameRun独立，不能用游戏raw的相等冒称所有UI阅读位置也恒定。R180旧Q3书签保留的实测是在这次显选之前，R187已按真实当前入口再查看Q3/同协议并明确合页回Today，最终129全文仍82f3147a..相等。

本说明只写在current184，R187已STOP不追加；其原timeout/观察记录保留。
