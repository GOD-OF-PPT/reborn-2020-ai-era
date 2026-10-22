import type {GameRun} from '../core/run-types.ts'

export type RelaySupplierId='cedar-direct'|'cedar-reseller'|'harbor-independent'
export type RelayOfferKind='low_margin'|'managed_support'
export type RelayCustomerMode='prepaid'|'postpaid'
export type RelaySupportMode='guided'|'self'|'assisted'|'delegated'
export interface RelayShape{
 readonly id:string
 readonly supplierId:RelaySupplierId
 readonly offerKind:RelayOfferKind
 readonly unitPriceFen:10|6
 readonly customerMode:RelayCustomerMode
 readonly supportMode:RelaySupportMode
}
export interface RelayShapeIdentity{
 readonly name:string
 readonly backgroundId:'technical_employee'|'content_employee'
 readonly seed:'t16-campaign-0'|'t16-campaign-1'|'t16-campaign-2'
}
export interface RelayCoreCase{
 readonly id:string
 readonly identityId:string
 readonly identity:RelayShapeIdentity
 readonly shape:RelayShape
 readonly folder:string
}
export const RELAY_CORE_CHECKPOINTS=[
 'public_prerequisites_and_original_identity',
 'real_offer_and_contract',
 'real_recharge_or_customer_credit',
 'own_cash_and_supplier_asset_or_postpaid_credit',
 'original_service_and_support_jobs_with_actual_resource_AP_and_dates',
 'actual_daily_usage_and_blocked_reasons',
 'actual_support_fee_or_noncompletion_and_compensation',
 'paid_meter_audit_of_already_observed_records',
 'separate_correction_preserving_old_quantities_versions_and_references',
 'due_collections_supplier_settlement_and_remaining_old_assets_liabilities',
] as const
export type RelayCoreCheckpointName=typeof RELAY_CORE_CHECKPOINTS[number]
export interface RelayShapeCallbacks{
 readonly milestone?:(name:string,run:GameRun)=>void
}
export const RELAY_SHAPES:readonly RelayShape[]=
 (['cedar-direct','cedar-reseller','harbor-independent'] as const).flatMap(supplierId=>
 (['low_margin','managed_support'] as const).flatMap(offerKind=>
 (['prepaid','postpaid'] as const).flatMap(customerMode=>
 (['guided','self','assisted','delegated'] as const).map(supportMode=>({
  id:[supplierId,offerKind,customerMode,supportMode].join('--'),supplierId,offerKind,
  unitPriceFen:offerKind==='low_margin'?10:6,customerMode,supportMode,
 })))))
