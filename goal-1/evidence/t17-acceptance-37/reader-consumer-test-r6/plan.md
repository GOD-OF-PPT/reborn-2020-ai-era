# 同一U4-B：实际RequestCommand签名的测试mock

Root R3 tsc实际exit2/40604ms，599源与extra初末同，仅Book.test332的旧Advance request mock被宽ReturnType<typeof vi.fn>声明为Procedure或Constructable并集，不能传给原RequestCommand。

只改新Book.test：类型导入Vitest Mock，旧Advance request变量标为Mock<GamePanelProps['request']>，创建用vi.fn<GamePanelProps['request']>()。沿本地Vitest声明已确认Mock导出/泛型，不加any/as、不改产品或原RequestCommand。

先保R5完整前像和原tsc红；三处精确逆变应还原R5，其21case/全部断言/原门槛不动。本代理不运行checks/Browser/Git，Root统一修后运行。
