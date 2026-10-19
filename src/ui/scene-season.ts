import {JOURNEY_CONTENT} from '../content/journey.ts'

/** Original present-tense scene copy. These chapters never certify campaign progress. */


export function sceneSeason(quarter:string){
 const match=/^(202[0-5])-Q([1-4])$/.exec(quarter)
 if(!match)return {chapter:null,title:'日子还在向前',thought:'选择由你。',line:'看看眼前的生活，再决定下一步。'}
 const chapter=(Number(match[1])-2020)*4+Number(match[2]),copy=JOURNEY_CONTENT.quarters[chapter-1]!
 return {chapter,title:copy.title,thought:copy.thought,line:copy.line}
}

/** Shortcuts navigate only. A dialog, editable control or modifier always owns its keys. */
export function sceneShortcut(key:string,editing:boolean,modal:boolean,modified:boolean){
 if(editing||modal||modified)return null
 if(key==='1')return 'quarter'
 if(key==='2')return 'routes'
 if(key==='3')return 'life'
 if(key==='4')return 'memory'
 return null
}
