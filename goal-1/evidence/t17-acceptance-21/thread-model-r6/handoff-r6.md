# S1 life selection / record identity r6

Only player-thread.ts and player-thread.test.ts changed. lifeScene now emits inspect.target.recordId only for an actual current public life job or promise matching both its ID and life selection/person. A not-yet-created rest/workspace/person entry carries only accountId plus lifeSelection/personId. OpeningFocus identity and all other interfaces are unchanged.

The new normal CreateRun test checks initial rest, workspace and person selections without recordId, then submits the original StartLifeWork and verifies the actual saved rest job ID is retained through inspect/openingFocusFor. Final verification: all 28 targeted player-thread tests passed; strict TypeScript of the two owned roots and imported dependencies passed without emit. Source hashes match source-r6.json. No browser, compatibility, full-suite or Git actions ran. Earlier r5 evidence was not modified.

[杠精审查] 通过：选择身份不冒原记录，存在且同selection的真实job/promise才定位原册；未新增规则、保存格式或副作用。根组件/Panel集成及浏览器验收另由根任务核定。
