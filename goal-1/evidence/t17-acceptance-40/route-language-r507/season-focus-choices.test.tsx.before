import {expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,projectRun} from '../core/commands.ts'
import type {GameRun} from '../core/run-types.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {seasonFocusChoices,seasonFocusGroupFor,type SeasonFocusChoice} from './season-thread.ts'
import {SeasonFocusChoices,SeasonFocusDetails,seasonChoicePage} from './SeasonFocusChoices.tsx'
import {Dialog} from './Dialog.tsx'

// Normal in-memory gameplay projections, with no storage or codec APIs.
const registry=createCampaignRegistry()
const initial=createCampaignRun({runId:'bookmark-ui',actorId:'player',commandId:'create',seed:'bookmark-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){
 const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'ui-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId)
 if(result.status!=='proposed')throw Error('EXPECTED_NORMAL_PROPOSAL')
 return result.nextRun
}
const worked=act(initial,'WorkQuarter'),rested=act(worked,'StartLifeWork',{kind:'rest',personId:null,reference:null}),current=act(rested,'AdvanceTime',{date:'2020-01-06'})
const projected=registry.runtime!.project!(current),features=projected as unknown as PlayFeatures
const view:PlayingView={...projectRun(current),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
const all=seasonFocusChoices({view,features}),continuing=all.filter(c=>seasonFocusGroupFor(c)==='continue')

it('shows three real current objects together with their sources and next feedback, without auto-selecting',()=>{
 expect(continuing).toHaveLength(3)
 const onSelect=vi.fn(),html=renderToStaticMarkup(<SeasonFocusChoices choices={continuing} selectedId={null} currentDate={view.date} label="继续眼前的事" onSelect={onSelect}/>)
 expect((html.match(/type="radio"/g)??[]).length).toBe(3)
 for(const c of continuing)expect(html).toContain(c.title)
 expect(html).toContain('2020-01-08')
 expect(html).toContain('2020-01-31')
 expect(html).toContain('来源 2020-01-01')
 expect(html).not.toContain('checked=""')
 expect(html).not.toContain('screen-book')
 expect(html).not.toContain('工资与经营收入分别核对')
 expect(onSelect).not.toHaveBeenCalled()
})

it('keeps every original candidate and its order reachable across object pages',()=>{
 const seen:SeasonFocusChoice[]=[]
 for(let page=0;page<seasonChoicePage(all,0).pages;page++)seen.push(...seasonChoicePage(all,page).items)
 expect(seen).toEqual(all)
 expect(seasonChoicePage(all,999).page).toBe(Math.ceil(all.length/3)-1)
 expect(seasonChoicePage(continuing,999).items).toEqual(continuing)
 expect(seasonChoicePage([],3)).toEqual({page:0,pages:1,items:[]})
})

it('renders only the explicitly selected identity and keeps its original source object intact',()=>{
 const selected=continuing.find(c=>c.focus.kind==='life')!,before=JSON.stringify(continuing)
 const html=renderToStaticMarkup(<SeasonFocusChoices choices={continuing} selectedId={selected.id} currentDate={view.date} label="继续" onSelect={vi.fn()}/>)
 expect((html.match(/checked=""/g)??[]).length).toBe(1)
 expect(JSON.stringify(continuing)).toBe(before)
 expect(selected.focus.runId).toBe(view.runId)
})

it('keeps the complete explanation, money and original dates available in the separate reader',()=>{
 const rest=continuing.find(c=>c.focus.kind==='life')!,html=renderToStaticMarkup(<SeasonFocusDetails choice={rest} currentDate={view.date}/>)
 expect(html).toContain(rest.line)
 expect(html).toContain('¥0')
 expect(html).toContain('已耗1点')
 expect(html).toContain('2020-01-08')
 expect(html).toContain('合上后，再决定要不要换书签')
})

it('preserves provided historical and unavailable metadata instead of silently substituting a current object',()=>{
 // Presentational variants only; they do not claim a completed historical run.
 const historical:SeasonFocusChoice={...continuing[0]!,scope:'history',originQuarter:'2020-Q1',date:'2020-01-01',nextDate:null}
 const blocked:SeasonFocusChoice={...continuing[1]!,disabledReason:'原对象需要重新选择。'}
 const html=renderToStaticMarkup(<SeasonFocusChoices choices={[historical,blocked]} selectedId={null} currentDate="2020-04-01" label="记录" onSelect={vi.fn()}/>)
 expect(html).toContain('历史回看 · 2020-Q1 · 来源 2020-01-01')
 expect(html).toContain('原对象需要重新选择。')
 expect(html).toContain('disabled=""')
 expect(html).toContain('查看'+blocked.title+'的详情')
})

it('keeps Dialog reading pagination by default and makes direct layout explicit',()=>{
 const normal=renderToStaticMarkup(<Dialog title="原说明" onClose={vi.fn()}><p>完整说明</p></Dialog>)
 const direct=renderToStaticMarkup(<Dialog title="选择" layout="direct" onClose={vi.fn()}><p>直接选择</p></Dialog>)
 expect(normal).toContain('screen-book')
 expect(direct).not.toContain('screen-book')
 expect(direct).toContain('dialog-direct-body')
 expect(direct).toContain('关闭对话框')
})
