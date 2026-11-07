import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {projectRun} from '../core/commands.ts'
import type {GamePanelProps,PlayFeatures} from './game-types.ts'
import {RoomExploration} from './RoomExploration.tsx'
import {CinematicRoom} from './CinematicRoom.tsx'
import {RoomMoment} from './RoomMoment.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {roomSpots,roomExplorationReading,type RoomSpot} from './room-exploration-reading.ts'
import {sceneShortcut} from './scene-season.ts'

// Normal in-memory Create projection. No controller commands, storage or compatibility workflow.
const hooks=vi.hoisted(()=>({owner:'child',index:0,values:{} as Record<string,unknown[]>}))
vi.mock('react',async original=>{
 const actual=await original<typeof import('react')>()
 const state=<T,>(initial:T|(()=>T))=>{const owner=hooks.owner,index=hooks.index++,cells=hooks.values[owner]??(hooks.values[owner]=[]);if(!(index in cells))cells[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [cells[index] as T,(next:T|((old:T)=>T))=>{cells[index]=typeof next==='function'?(next as (old:T)=>T)(cells[index] as T):next}] as const}
 return {...actual,useState:state,useRef:<T,>(initial:T)=>state(()=>({current:initial}))[0],useEffect:()=>{},useLayoutEffect:()=>{}}
})
afterEach(()=>{hooks.owner='child';hooks.index=0;hooks.values={};vi.clearAllMocks()})
type Element=ReactElement<Record<string,unknown>>
const elements=(v:unknown):Element[]=>Array.isArray(v)?v.flatMap(elements):isValidElement<Record<string,unknown>>(v)?[v,...elements(v.props.children)]:[]
const words=(v:unknown):string=>typeof v==='string'||typeof v==='number'?String(v):Array.isArray(v)?v.map(words).join(''):isValidElement<Record<string,unknown>>(v)?words(v.props.children):''
const registry=createCampaignRegistry(),run=createCampaignRun({runId:'room-exploration-ui',actorId:'player',commandId:'create',seed:'room-exploration-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function input():GamePanelProps{const f=registry.runtime!.project!(run),view:GamePanelProps['view']={...projectRun(run),features:f,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null};return {view,features:f as unknown as PlayFeatures,accountId:'personal',request:vi.fn(),controller:{snapshot:{view,busy:false}} as unknown as GamePanelProps['controller']}}
function driver(p=input(),urgent=false){
 const onNavigate=vi.fn(),onReturn=vi.fn(),onResponsibilities=vi.fn(),calendar=<span data-original-calendar="kept">原日历与完整费用</span>
 const render=()=>{hooks.owner='child';hooks.index=0;return elements(RoomExploration({p,urgent,headingRef:null,onNavigate,onReturn,onResponsibilities,calendar}))}
 const button=(screen:RoomSpot)=>render().find(n=>n.type==='button'&&n.props['aria-label']===roomSpots.find(s=>s.screen===screen)!.object+' · '+roomSpots.find(s=>s.screen===screen)!.verb+' · '+roomSpots.find(s=>s.screen===screen)!.preview)!
 const event=(screen:RoomSpot,key:'onClick'|'onFocus'|'onBlur'|'onPointerEnter'|'onPointerLeave')=>{const fn=button(screen).props[key];if(typeof fn!=='function')throw Error('EVENT_REQUIRED:'+key);fn()}
 return {p,render,button,event,onNavigate,onReturn,onResponsibilities,calendar,copy:()=>words(render().find(n=>n.props.id==='room-inspection-copy'))}
}

it('all four distinct objects preserve the original single reading destination and 1-4 key map',()=>{const ui=driver(),before=JSON.stringify(ui.p.features);expect(roomSpots.map(s=>s.screen).sort()).toEqual(['life','memory','quarter','routes']);for(const s of roomSpots){expect(sceneShortcut(s.key,false,false,false)).toBe(s.screen);expect(ui.button(s.screen).props['aria-keyshortcuts']).toBe(s.key);ui.event(s.screen,'onClick');if(s.screen==='life')expect(ui.onNavigate).toHaveBeenLastCalledWith('life',{accountId:'personal'});else expect(ui.onNavigate).toHaveBeenLastCalledWith(s.screen)}expect(ui.onNavigate).toHaveBeenCalledTimes(4);expect(ui.p.request).not.toHaveBeenCalled();expect(JSON.stringify(ui.p.features)).toBe(before)})
it('hover and keyboard focus reveal one relevant reading without opening a second decision',()=>{const ui=driver();ui.event('routes','onPointerEnter');expect(ui.copy()).toContain('做一份作品');ui.event('life','onFocus');expect(ui.copy()).toContain('别把自己');ui.event('memory','onPointerEnter');expect(ui.copy()).toContain('时代');ui.event('memory','onPointerLeave');expect(ui.copy()).toContain('别把自己');ui.event('life','onBlur');expect(ui.copy()).toContain('哪件东西');expect(ui.onNavigate).not.toHaveBeenCalled();expect(ui.p.request).not.toHaveBeenCalled()})
it('the exact inspected object describes the shared visible reading and all others remain direct entries',()=>{const ui=driver();ui.event('quarter','onFocus');expect(ui.button('quarter').props['aria-describedby']).toBe('room-inspection-copy');expect(ui.button('routes').props['aria-describedby']).toBeUndefined();expect(ui.copy()).toContain('工作与准备都在日历里');expect(ui.copy()).toContain('4点可用行动');expect(ui.p.request).not.toHaveBeenCalled()})
it('zero available action and original reservations are not called spent or a new reward',()=>{const p=input(),view={...p.view,budget:{...p.view.budget,available:0,reserved:2}},ui=driver({...p,view});expect(ui.copy()).toContain('暂没有可用行动');expect(ui.copy()).toContain('2点已留给原安排');expect(ui.copy()).not.toContain('用尽');for(const s of roomSpots)expect(ui.button(s.screen).props.disabled).toBeUndefined();expect(p.request).not.toHaveBeenCalled()})
it('the original calendar node is kept and return only invokes its UI callback',()=>{const ui=driver(),rows=ui.render();expect(rows).toContain(ui.calendar);const back=rows.find(n=>n.type==='button'&&words(n).startsWith('回到刚才在意的事'))!;(back.props.onClick as ()=>void)();expect(ui.onReturn).toHaveBeenCalledOnce();expect(ui.onNavigate).not.toHaveBeenCalled();expect(ui.p.request).not.toHaveBeenCalled()})
it('an actual attention flag keeps the original responsibility reader reachable',()=>{const ui=driver(input(),true),button=ui.render().find(n=>n.type==='button'&&words(n).startsWith('有件事，等你回应'))!;(button.props.onClick as ()=>void)();expect(ui.onResponsibilities).toHaveBeenCalledOnce();expect(ui.p.request).not.toHaveBeenCalled();hooks.values={};expect(driver().render().some(n=>n.type==='button'&&words(n).startsWith('有件事，等你回应'))).toBe(false)})
it('text-only mode retains all labels and reading actions without depending on image or SVG content',()=>{const p=input(),ui=driver({...p,textOnly:true});expect(ui.render().some(n=>n.type==='svg')).toBe(false);for(const s of roomSpots){expect(words(ui.button(s.screen))).toContain(s.verb);ui.event(s.screen,'onClick')}expect(ui.onNavigate).toHaveBeenCalledTimes(4);expect(p.request).not.toHaveBeenCalled()})
it('an updated public budget changes the reading while its selected object remains only a reading',()=>{const p=input();expect(roomExplorationReading(p,'quarter').hint).toContain('4点');expect(roomExplorationReading({...p,view:{...p.view,budget:{...p.view.budget,available:1}}},'quarter').hint).toContain('1点');expect(roomExplorationReading(p,'life').line).not.toContain('已完成');expect(p.request).not.toHaveBeenCalled()})
it('the original cinematic owner mounts exploration from its real room action and keeps its original Clock',()=>{const p=input(),onNavigate=vi.fn(),props={...p,headingRef:null,notice:null,onNavigate,onPeople:vi.fn(),onYear:vi.fn()};const render=()=>{hooks.owner='parent';hooks.index=0;return elements(CinematicRoom(props))};const first=render().find(n=>n.type===RoomMoment)!;(first.props.onExplore as ()=>void)();const child=render().find(n=>n.type===RoomExploration)!;expect(child.props.onNavigate).toBe(onNavigate);const calendar=child.props.calendar;expect(isValidElement<Record<string,unknown>>(calendar)&&calendar.type).toBe(ClockAdvance);expect(isValidElement<Record<string,unknown>>(calendar)&&calendar.props.p).toBe(props);(child.props.onReturn as ()=>void)();expect(render().some(n=>n.type===RoomMoment)).toBe(true);expect(onNavigate).not.toHaveBeenCalled();expect(p.request).not.toHaveBeenCalled()})

it('life reading explicitly returns to personal money from a presentation-only business reading context, without a game command',()=>{const p=input(),ui=driver({...p,accountId:'presentation-only-business-context'});ui.event('life','onClick');expect(ui.onNavigate).toHaveBeenCalledExactlyOnceWith('life',{accountId:'personal'});expect(p.request).not.toHaveBeenCalled();expect(ui.onReturn).not.toHaveBeenCalled()})
