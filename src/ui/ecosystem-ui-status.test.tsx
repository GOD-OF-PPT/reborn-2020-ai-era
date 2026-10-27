import {expect,it,vi} from 'vitest'
import {SceneTimeNotice,type EchoFrame} from './SceneEcho.tsx'
import {ecosystemCalendarStatus,ecosystemUiStatus} from './ecosystem-ui-status.ts'

const date='2025-10-11',fallback=date+'。已经确认的安排按真实日期发生，眼前又多了一次选择。'
const frame:EchoFrame={dateBefore:'2025-10-08',dateAfter:date,pointsBefore:0,pointsAfter:0,reservedBefore:2,reservedAfter:2,spentBefore:2,spentAfter:2,quarterChanged:false,accounts:[{id:'personal',before:14600000,after:14600000}]}
const node=(value:EchoFrame|null=frame,text=fallback)=> <SceneTimeNotice date={date} text={text} frame={value} compact onClose={vi.fn()} accountName={id=>id}/>

it('keeps the complete original generic calendar reel and callbacks while giving its reading status a neutral brief',()=>{
 const original=node(),before=JSON.stringify(frame),status=ecosystemCalendarStatus(original,date)!
 expect(status).not.toBe(original);expect(status.type).toBe(SceneTimeNotice);expect(status.props.brief).toBe('日历到了2025-10-11。')
 expect(status.props.text).toBe(fallback);expect(status.props.frame).toBe(frame);expect(status.props.onClose).toBe(original.props.onClose);expect(status.props.accountName).toBe(original.props.accountName)
 expect(original.props.onClose).not.toHaveBeenCalled();expect(JSON.stringify(frame)).toBe(before)
})

it('retains every cash, action reservation, action use and quarter change as a primary result',()=>{
 for(const value of [
  {...frame,pointsAfter:1},{...frame,reservedAfter:1},{...frame,spentAfter:3},{...frame,quarterChanged:true},
  {...frame,accounts:[{id:'business',before:50000,after:40000}]},{...frame,accounts:[{id:'business',before:null,after:10000}]},
 ])expect(ecosystemCalendarStatus(node(value),date)).toBeNull()
})

it('does not move real life completion or other rich story facts even when cash and action totals did not change',()=>{
 expect(ecosystemCalendarStatus(node(frame,date+'。1次休整已经结束，行动与花费照账保留。'),date)).toBeNull()
 expect(ecosystemCalendarStatus(node(frame,date+'，客户实际验收，确认收入¥2,400。'),date)).toBeNull()
 expect(ecosystemCalendarStatus(<p>{fallback}</p>,date)).toBeNull()
})

it('keeps missing, stale or malformed frame metadata visible rather than assuming no effects',()=>{
 expect(ecosystemCalendarStatus(node(null),date)).toBeNull()
 expect(ecosystemCalendarStatus(node({...frame,dateAfter:'2025-10-12'}),date)).toBeNull()
 expect(ecosystemCalendarStatus(node({...frame,dateBefore:'2025-02-30'}),date)).toBeNull()
 expect(ecosystemCalendarStatus(node({...frame,accounts:[]}),date)).toBeNull()
 expect(ecosystemCalendarStatus(node({...frame,dateBefore:date}),date)).toBeNull()
 expect(ecosystemCalendarStatus(node(), '2025-10-12')).toBeNull()
})

it('recognizes only exact application status strings and preserves actual monetary feedback',()=>{
 expect(ecosystemUiStatus('已从本机存档继续。',date)).toBe('已从本机存档继续。')
 expect(ecosystemUiStatus('已导入独立存档，未覆盖其他人生。',date)).toBe('已导入独立存档，未覆盖其他人生。')
 expect(ecosystemUiStatus('当前为只读，请查看写入状态说明。',date)).toBe('当前为只读，请查看写入状态说明。')
 for(const status of ['新人生已保存。所有安排仍由你确认。','原候选已保存；没有重新执行或重新抽取结果。','已重新读取本机提交。','已恢复同一人生；替换前的本机提交保留为备份。'])expect(ecosystemUiStatus(status,date)).toBe(status)
 expect(ecosystemUiStatus('推进至'+date,date)).toBe('推进至'+date)
 expect(ecosystemUiStatus('实际收款¥900。',date)).toBeNull();expect(ecosystemUiStatus(node(),date)).toBeNull()
})
