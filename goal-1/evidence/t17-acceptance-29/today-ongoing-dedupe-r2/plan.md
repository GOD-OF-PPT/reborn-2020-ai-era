# U2 ongoing原卖单/交收阅读去重

仅改today-thread.ts/test：若原order已加入active/carry ongoing，则同账户、同source fill的未付settlement不重复作为ongoing；独立dividend/无order覆盖仍留。remaining/季度书签/原册/源引用/日期不减。先读/写，不抢sequence企业case窗口；Root统一C批实际运行。另仅读新day-perspective及父子effects，不改Root源码。
