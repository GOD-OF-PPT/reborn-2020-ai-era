import type {GamePanelProps} from './game-types.ts'

/** The four original room destinations; these are reading entries, never game commands. */
export const roomSpots=[
 {screen:'routes',object:'电脑',verb:'找一种新尝试',preview:'比较五条路的投入与条件',x:76,y:49,key:'2'},
 {screen:'quarter',object:'门外',verb:'看看这季的日历',preview:'工作、准备与已经排下的事',x:37,y:40,key:'1'},
 {screen:'memory',object:'书架',verb:'翻一翻时代线索',preview:'已发生的来信与前世片段',x:14,y:43,key:'4'},
 {screen:'life',object:'床边',verb:'给生活留点时间',preview:'休整、住处与相识的人',x:14,y:58,key:'3'},
] as const
export type RoomSpot=typeof roomSpots[number]['screen']
type Input=Pick<GamePanelProps,'view'|'features'>

/** Only public present facts accompany the object. No recommendation, future result or permission is inferred. */
export function roomExplorationReading(p:Input,spot:RoomSpot|null){
 const budget=p.view.budget,available=budget.available,reserved=budget.reserved
 const time=available===0?'此刻暂没有可用行动':`本季还有${available}点可用行动`
 const attention=reserved>0?`；${reserved}点已留给原安排。`:'。'
 if(spot==='quarter')return {speaker:'门外 · 这一季的日子',line:'这季的时间，想花在哪里？',hint:time+attention+'工作与准备都在日历里。'}
 if(spot==='routes')return {speaker:'电脑 · 还没试过的可能',line:'做一份作品，还是试着经营点什么？',hint:'先比较五条路的投入与条件，新的承诺另作决定。'}
 if(spot==='memory'){
  const news=p.features.workbench.world.news.filter(n=>n.actualDate<=p.view.date&&!n.read)
  return {speaker:'书架 · 留下的时代线索',line:news.length?`有${news.length}则时代来信，还没读过。`:'记得一些未来，也看看今天。',hint:'已发生的新闻与前世记忆，分开翻阅。'}
 }
 if(spot==='life'){
  const ongoing=p.features.life.jobs.filter(j=>j.status==='running')
  return {speaker:'床边 · 也关乎你自己',line:ongoing.length?'已经留给生活的日子，也在慢慢发生。':'别把自己，留在所有计划之后。',hint:ongoing.length?`目前有${ongoing.length}段生活安排在进行；休整、住处与人物仍可翻阅。`:'休整、住处或相识的人，慢慢选择。'}
 }
 return {speaker:'你 · 眼前的房间',line:'哪件东西，让你多看了一眼？',hint:time+attention+'先看看，再决定。'}
}
