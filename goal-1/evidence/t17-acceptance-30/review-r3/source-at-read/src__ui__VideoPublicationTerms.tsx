import type {VideoProjection} from '../core/video-projection.ts'
import {addDays} from '../core/calendar.ts'

export interface VideoPublicationTermsProps{
 readonly video:VideoProjection
 readonly date:string
 readonly workId:string
 readonly monetization:string
 readonly className?:string
}

/** Only the selected work, public channel eligibility and original measurement date are read. */
export function VideoPublicationTerms({video,date,workId,monetization,className}:VideoPublicationTermsProps){
 const sectionClass=className??'confirmation-context video-paper-terms'
 const works=video?.works.filter(work=>work.id===workId)??[]
 const work=works.length===1?works[0]:undefined
 const channels=work?video?.channels.filter(channel=>channel.id===work.channelId)??[]:[]
 const channel=channels.length===1?channels[0]:undefined
 if(!video||!work||!channel)return <section className={sectionClass}><p className="warning-box">这份作品与账号尚未匹配，请返回重新核对；没有换到其他作品。</p></section>
 const identity=<p>{channel.name} · 作品第{work.version}版</p>
 const publications=video.publications.filter(publication=>publication.workId===work.id&&publication.channelId===channel.id)
 if(publications.length){
  const publication=publications.length===1?publications[0]:undefined
  return <section className={sectionClass}>{identity}<p className="warning-box">这份作品已有发布记录。{publication?<>原发布日{publication.publishedAt}，原统计日{publication.measureAt}。</>:null}请返回核对这份发布，不重新统计或补计收入。</p></section>
 }
 if(!['none','ads','affiliate'].includes(monetization))return <section className={sectionClass}>{identity}<p>先明确本次发布方式，再核对这次能得到的反馈。</p></section>
 let measureAt:string
 try{measureAt=addDays(date,7)}catch{return <section className={sectionClass}>{identity}<p className="warning-box">尚未取得这次发布的当前日期，请返回重新核对。</p></section>}
 const programLabel=monetization==='ads'?'平台分成':'带货'
 const readApplications=video.applications.filter(application=>application.channelId===channel.id&&application.program===monetization&&application.resultRead===true)
 const readApprovals=readApplications.filter(application=>application.approved===true&&application.decidedAt!==null&&application.decidedAt<=date)
 const readCovered=readApprovals.some(application=>application.expiresAt!==null&&measureAt<application.expiresAt)
 const rawCovered=channel.eligiblePrograms.some(program=>program.program===monetization&&program.expiresAt!==null&&measureAt<program.expiresAt)
 const covered=readCovered&&rawCovered
 const unreadApplications=video.applications.filter(application=>application.channelId===channel.id&&application.program===monetization&&application.resultRead===false)
 const unreadReply=unreadApplications.some(application=>application.job?.status==='completed')
 return <section className={sectionClass}>
  {identity}
  <p>若在<time dateTime={date}>{date}</time>发布，将在<time dateTime={measureAt}>{measureAt}</time>统计实际曝光与询价。发布本身不增加现金。</p>
  {monetization==='none'?<p>这次只积累受众，不申请平台分成或带货变现。曝光、关注和询价都不是现金收入。</p>:covered?<p>当前{programLabel}资格覆盖这次统计窗口，仍要等待实际反馈；有资格也不保证收入。即使形成应收，也须按约定实际收取后才是现金。</p>:unreadReply?<p className="warning-box">这次申请回信尚未查看，先翻原回信核对收益条件；发布不保证到账。</p>:unreadApplications.length>0?<p className="warning-box">这次申请仍有尚待核对的记录，先查看原申请进度，再决定这次发布；发布不保证收入或到账。</p>:readCovered?<p className="warning-box">原批准与当前账号条件还需核对，请先翻原记录确认这次收益条件；发布不保证到账。</p>:<p className="warning-box">{readApprovals.length>0?'已查看的'+programLabel+'批准没有覆盖本次统计窗口。':'当前账号没有覆盖本次统计日的'+programLabel+'资格。'}本次只统计曝光与询价，不产生这项收入；以后取得资格也不会给这次发布补计收入。</p>}
  {monetization==='affiliate'?<p>只有本次资格覆盖、且统计时实际形成受众，才有后续订单观察；没有受众就没有该观察。有受众也不承诺订单、留存或收入。</p>:null}
 </section>
}
