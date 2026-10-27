/** Exact application notices remain visible as UI status, never a new story outcome. */
export function ecosystemUiStatus(value:unknown,date:string):string|null{
 return typeof value==='string'&&['已从本机存档继续。','新人生已保存。所有安排仍由你确认。','已导入独立存档，未覆盖其他人生。','当前为只读，请查看写入状态说明。','原候选已保存；没有重新执行或重新抽取结果。','已重新读取本机提交。','已恢复同一人生；替换前的本机提交保留为备份。','已保存你的安排。详情以当前状态和账本为准。','这次选择已经记下，尚待履行的事仍照原约定继续。','推进至'+date].includes(value)?value:null
}
import {cloneElement,isValidElement,type ComponentProps,type ReactNode} from 'react'
import {SceneTimeNotice} from './SceneEcho.tsx'
import {isoDate} from '../core/calendar.ts'


/** Move only the known generic calendar fallback. The complete original reel,
 * handlers and frame stay accessible; actual or unknown result nodes stay primary. */
export function ecosystemCalendarStatus(value:ReactNode,date:string){
 if(!isValidElement<ComponentProps<typeof SceneTimeNotice>>(value)||value.type!==SceneTimeNotice)return null
 const {frame,text}=value.props
 if(value.props.date!==date||value.props.compact!==true||text!==date+'。已经确认的安排按真实日期发生，眼前又多了一次选择。'||!frame)return null
 try{isoDate(date);isoDate(frame.dateBefore)}catch{return null}
 const points=[frame.pointsBefore,frame.pointsAfter,frame.reservedBefore,frame.reservedAfter,frame.spentBefore,frame.spentAfter]
 if(frame.dateAfter!==date||!/^\d{4}-\d{2}-\d{2}$/.test(frame.dateBefore)||frame.dateBefore>=date||frame.quarterChanged!==false||!points.every(Number.isSafeInteger)||frame.pointsBefore!==frame.pointsAfter||frame.reservedBefore!==frame.reservedAfter||frame.spentBefore!==frame.spentAfter||!Array.isArray(frame.accounts)||!frame.accounts.length||frame.accounts.some(a=>a.before===null||!Number.isSafeInteger(a.before)||!Number.isSafeInteger(a.after)||a.before!==a.after))return null
 return cloneElement(value,{brief:'日历到了'+date+'。'})
}
