import type { Route } from './content-types.ts'
import type { RuleModel, GameRun } from './run-types.ts'
import type { ScheduledEvent } from './timeline.ts'
import type { RunOperation } from './content-types.ts'
export type Lifecycle = 'discovered' | 'preparing' | 'operating' | 'paused' | 'winding_down' | 'closed'
export interface BusinessDefinition { readonly id: string; readonly route: Route; readonly company: boolean; readonly capabilities: readonly string[]; readonly preparationKey: string | null; readonly minCashFen: number; readonly capacityUnits: number; readonly monthlyMaintenanceFen: number; readonly requiresPreparationJob: boolean }
export interface JobDefinition { readonly id: string; readonly purpose: 'prepare' | 'production' | 'maintenance'; readonly routes: readonly Route[]; readonly skill: string; readonly durationDays: number; readonly actionPoints: number; readonly costFen: number; readonly output: string }
export interface OfferDefinition { readonly id: string; readonly route: Route; readonly from: string; readonly to: string; readonly jobDefinitionId: string; readonly priceFen: number; readonly prepaymentFen: number; readonly deliveryDueAt: string; readonly reviewDays: number; readonly paymentDays: number; readonly acceptBps: number; readonly classification:'fictional'|'counterfactual'; readonly startWindow:{readonly from:string;readonly to:string}|null;readonly caseKey:string|null }
export interface WorkerDefinition { readonly id: string; readonly skills: readonly string[]; readonly units: number; readonly monthlyWageFen: number; readonly recruitmentCostFen: number }
export interface LoanDefinition { readonly id: string; readonly principalFen: number; readonly feeFen: number; readonly termDays: number }
export interface OperationsCatalog { readonly version: string; readonly profiles: readonly { readonly id: string; readonly monthlySalaryFen: number }[]; readonly businesses: readonly BusinessDefinition[]; readonly jobs: readonly JobDefinition[]; readonly offers: readonly OfferDefinition[]; readonly workers: readonly WorkerDefinition[]; readonly loans: readonly LoanDefinition[] }
export interface EmploymentPeriod { readonly id: string; readonly quarter: string; readonly limit: string; readonly actionId: string; readonly salaryFen: number; readonly segments: readonly { readonly from: string; readonly to: string | null }[] }
export interface BusinessInstance { readonly id: string; readonly definitionId: string; readonly route: Route; readonly accountId: string; readonly company: boolean; readonly lifecycle: Lifecycle; readonly prepared: boolean; readonly activeFrom: string | null; readonly stoppedAt: string | null; readonly distributedFen: number; readonly monthlyMaintenanceFen: number; readonly history: readonly { readonly date: string; readonly state: Lifecycle; readonly sourceId: string }[] }
export interface WorkerInstance { readonly id: string; readonly definitionId: string; readonly sponsorBusinessId: string; readonly from: string; readonly to: string | null; readonly units: number; readonly monthlyWageFen: number }
export interface ProductionJob { readonly id: string; readonly businessId: string; readonly definitionId: string; readonly contractId: string | null; readonly actionId: string; readonly resources: readonly string[]; readonly startAt: string; readonly completeAt: string; readonly releasedAt: string | null; readonly status: 'planned' | 'running' | 'completed' | 'interrupted' | 'cancelled'; readonly outputId: string | null }
export interface OperatingContract { readonly id: string; readonly businessId: string; readonly offerId: string; readonly jobId: string; readonly factId: string; readonly acceptedAt: string; readonly status: 'production' | 'review' | 'delivered' | 'settled' | 'rejected' | 'cancelled'; readonly submittedAt: string | null; readonly reviewedAt: string | null; readonly settledAt: string | null;readonly classification:'fictional'|'counterfactual';readonly caseKey:string|null }
export interface OfferDecision { readonly offerId:string;readonly kind:'declined'|'skipped'|'expired';readonly date:string;readonly sourceId:string }
export interface PayrollRecord { readonly id: string; readonly entityId: string; readonly kind: 'salary' | 'wage' | 'maintenance'; readonly month: string; readonly through: string; readonly amountFen: number; readonly operationId: string | null }
export interface OperatingLoan { readonly id: string; readonly offerId: string; readonly accountId: string; readonly date: string; readonly dueAt: string; readonly principalObligationId: string; readonly feePosted: boolean }
export interface OperatingLog { readonly id: string; readonly date: string; readonly sourceEventId: string; readonly text: string; readonly visibility: 'visible'; readonly parentIds: readonly string[] }
export interface OperationsState { readonly catalogVersion: string; readonly catalogHash: string; readonly profileId: string; readonly employment: readonly EmploymentPeriod[]; readonly businesses: readonly BusinessInstance[]; readonly workers: readonly WorkerInstance[]; readonly jobs: readonly ProductionJob[]; readonly contracts: readonly OperatingContract[]; readonly payroll: readonly PayrollRecord[]; readonly loans: readonly OperatingLoan[]; readonly logs: readonly OperatingLog[];readonly offerDecisions:readonly OfferDecision[] }
export type OperatingEvent = { readonly kind: 'operating_event'; readonly type: 'salary' | 'wage' | 'maintenance' | 'start_job' | 'finish_job' | 'customer_response' | 'collection' | 'loan_due'|'offer_expiry'; readonly entityId: string; readonly month: string | null; readonly date: string }
export type OperatingIntent =
 | { readonly kind: 'WorkQuarter' | 'QuitWork' }
 | { readonly kind: 'DiscoverBusiness'; readonly definitionId: string }
 | {readonly kind:'DeclineOffer'|'SkipOffer';readonly offerId:string}
 | { readonly kind: 'PrepareBusiness' | 'ActivateBusiness' | 'PauseBusiness' | 'ResumeBusiness' | 'WindDownBusiness' | 'CloseBusiness'; readonly businessId: string }
 | { readonly kind: 'FundBusiness' | 'DistributeProfit'; readonly businessId: string; readonly amountFen: number }
 | { readonly kind: 'HireWorker'; readonly businessId: string; readonly definitionId: string }
 | { readonly kind: 'DismissWorker'; readonly workerId: string }
 | { readonly kind: 'StartInternalJob'; readonly businessId: string; readonly definitionId: string; readonly resources: readonly string[]; readonly startAt: string }
 | { readonly kind: 'AcceptContract'; readonly businessId: string; readonly offerId: string; readonly resources: readonly string[]; readonly startAt: string }
 | { readonly kind: 'InterruptJob'; readonly jobId: string }
 | { readonly kind: 'RescheduleJob'; readonly jobId: string; readonly resources: readonly string[]; readonly startAt: string }
 | { readonly kind: 'SubmitDelivery' | 'CancelContract'; readonly contractId: string }
 | { readonly kind: 'RequestLoan'; readonly accountId: string; readonly offerId: string }
 | { readonly kind: 'PayObligation'; readonly accountId: string; readonly obligationId: string; readonly amountFen: number }
export type OperatingContext = Pick<RuleModel, 'controlledAccountIds' | 'economy' | 'world' | 'operations'> & {readonly market?:RuleModel['market'];readonly video?:RuleModel['video'];readonly course?:RuleModel['course'];readonly cursor?:RuleModel['timeline']['cursor'];readonly phase?:RuleModel['phase']}
export type OperatingModel = Omit<RuleModel, 'timeline'>
export interface RuntimeExtension {
 worldUpdated?(state:OperatingModel,event:ScheduledEvent<RunOperation>):{state:OperatingModel;newEvents?:readonly ScheduledEvent<RunOperation>[]}
 hasEntitlement?(state:OperatingContext,bindingId:string,id:string,date:string):boolean
 reduce(state: OperatingModel, event: ScheduledEvent<RunOperation>): { readonly state: OperatingModel; readonly newEvents?: readonly ScheduledEvent<RunOperation>[]; readonly pauseReason?: string; readonly skippedReason?: string }
 capacityAvailable(state: OperatingContext, bindingId: string, date: string, days: number): number
 validate(run: GameRun): void
}
