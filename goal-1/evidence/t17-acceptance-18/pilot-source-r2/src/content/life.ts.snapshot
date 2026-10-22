import type {LifePerson,LifeWorkKind} from '../core/life-schema.ts'

interface WorkTerms {readonly costFen:number;readonly days:number;readonly points:1;readonly title:string}
interface PersonDefinition {readonly id:LifePerson;readonly name:string;readonly role:string;readonly goal:string;readonly work:LifeWorkKind;readonly promiseTitle:string;readonly promiseCostFen:number;readonly promiseDays:number;readonly boundary:string}
const people:readonly PersonDefinition[]=[
 {id:'tang-ying',name:'唐萤',role:'老友',goal:'生活有自己的节奏，也留出真正相处的时间。',work:'friend_visit',promiseTitle:'留出一次已经答应的陪伴',promiseCostFen:30000,promiseDays:3,boundary:'每年七月至八月已有自己的安排；关系不能靠付钱买断。'},
 {id:'linzhou',name:'林舟',role:'协作工具团队',goal:'保留团队独立，合作范围和工具边界能够说明白。',work:'linzhou_review',promiseTitle:'按约核对一次共同技术记录',promiseCostFen:20000,promiseDays:3,boundary:'只有原合作和已揭示的同意才支持新的共同工作；信任不改变原发布权。'},
 {id:'xu-cheng',name:'许澄',role:'创作同行',goal:'持续做自己的作品，公开笔记保留真实出处和署名。',work:'peer_notes',promiseTitle:'完成答应的署名与出处整理',promiseCostFen:20000,promiseDays:7,boundary:'2024年第一季度优先处理自己的作品，不成为玩家的免费生产资源。'},
 {id:'chen-yu',name:'陈屿',role:'项目合作人',goal:'只对已经交付的东西建立合作，少许诺，认真核对。',work:'partner_review',promiseTitle:'完成一次约定的交付复核',promiseCostFen:30000,promiseDays:7,boundary:'会选择其他项目；共同复盘不替换原合同客户，也不保证采购或融资。'},
]
const work:Readonly<Record<Exclude<LifeWorkKind,'promise_keep'>,WorkTerms>>={
 rest:{title:'留出七天休整',costFen:0,days:7,points:1},workspace:{title:'改善桌椅与照明',costFen:300000,days:7,points:1},
 friend_visit:{title:'安排一次见面',costFen:20000,days:3,points:1},linzhou_review:{title:'共同核对工具边界',costFen:30000,days:7,points:1},
 peer_notes:{title:'共同整理公开笔记',costFen:30000,days:7,points:1},partner_review:{title:'复盘一项真实交付',costFen:30000,days:7,points:1},
}
const busy:readonly {readonly id:string;readonly personId:LifePerson;readonly from:string;readonly to:string;readonly startText:string;readonly endText:string}[]=[
 ...Array.from({length:6},(_,n)=>({id:'tang-away-'+(2020+n),personId:'tang-ying' as const,from:(2020+n)+'-07-01',to:(2020+n)+'-09-01',startText:'唐萤按自己的计划离开一段时间，暂不安排新的共同活动。',endText:'唐萤结束自己的安排，可以再核对彼此的时间。'})),
 {id:'xu-project-2024',personId:'xu-cheng',from:'2024-01-01',to:'2024-04-01',startText:'许澄决定先完成自己的创作项目，这一季不接新的共同整理。',endText:'许澄完成自己的创作档期，可以重新讨论有限合作。'},
 {id:'chen-project-2021',personId:'chen-yu',from:'2021-04-01',to:'2021-07-01',startText:'陈屿选择投入另一项已有承诺的项目，暂不接新的共同复盘。',endText:'陈屿原项目的档期结束，仍会按实际履约记录选择合作。'},
]
export const LIFE_CONTENT={
 version:'life-work-v1',classification:'fictional' as const,people,work,busy,
 peerAvailableAt:'2022-08-22',offerDays:14,promiseDays:45,lastOfferDay:'11-30',lastDeadlineDay:'12-15',
 scene:{base:'room-2020-v1',workspace:'room-workspace-improved-v1'},
} as const
