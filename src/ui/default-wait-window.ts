import type {WorkbenchProjection} from '../application/workbench-projection.ts'

/** A known upper bound, not a promised feedback date. Only the semantic wait
 * channel may use it; a legacy direct command retains its original next date.
 */
export function defaultWaitDate(workbench:WorkbenchProjection,semanticWait:boolean):string{
 return workbench.progression.nextQuarterDate??(semanticWait?workbench.progression.quarterTarget:workbench.progression.nextDate)
}
export function defaultWaitLabel(workbench:WorkbenchProjection,semanticWait:boolean,legacy='让日子向前'):string{
 return workbench.progression.nextQuarterDate?'进入下一季':semanticWait?'等下一次反馈（最迟）':legacy
}
