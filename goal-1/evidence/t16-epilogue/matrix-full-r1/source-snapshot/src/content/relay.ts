import type { JobDefinition } from '../core/operations-types.ts'
/** Every provider, grant, rate and service incident is fictional game content. */
const rates=(id:string,extra:number)=>[
 {id:id+'-2020',anchorId:'H001',from:'2020-06-11',unitCostFen:6+extra,benchmarkFen:10},
 {id:id+'-2023',anchorId:'H004',from:'2023-03-14',unitCostFen:5+extra,benchmarkFen:9},
 {id:id+'-2024',anchorId:'H006',from:'2024-05-06',unitCostFen:4+extra,benchmarkFen:8},
 {id:id+'-v3',anchorId:'H008',from:'2024-12-26',unitCostFen:3+extra,benchmarkFen:6},
 {id:id+'-r1',anchorId:'H009',from:'2025-01-20',unitCostFen:2+extra,benchmarkFen:4}]
export const RELAY_CONTENT={version:'relay-work-v2',unit:'one_thousand_simulated_tokens',availableAt:'2020-06-11',
 suppliers:[
  {id:'cedar-direct',label:'杉木直供（虚构）',failureDomain:'cloud-east',availableAt:'2020-06-11',creditLimitFen:2000000,billing:'postpaid',rates:rates('cedar',0)},
  {id:'cedar-reseller',label:'青桥转售（虚构，与杉木共享上游）',failureDomain:'cloud-east',availableAt:'2023-03-14',creditLimitFen:0,billing:'prepaid',rates:rates('bridge',1)},
  {id:'harbor-independent',label:'港湾独立供应（虚构）',failureDomain:'cloud-west',availableAt:'2023-03-14',creditLimitFen:1200000,billing:'postpaid',rates:rates('harbor',2)}],
 updateAnchorIds:['H004','H006','H008','H009','H010'],permissionDays:366,applicationAcceptBps:9000,trafficBps:8500,billingErrorBps:500,
 serviceDays:28,capacityUnits:300000,supportCapacity:20,creditTermDays:7,customerCreditDays:14,customerMaxCreditFen:2000000,
 offers:[{id:'low_margin',label:'低价用量方案',serviceFeeFen:0,defaultUnitPriceFen:10},{id:'managed_support',label:'有实际支持的服务费方案',serviceFeeFen:50000,defaultUnitPriceFen:6}],
 minUnitPriceFen:1,maxUnitPriceFen:100,marketingCostFen:200000,minimumCapitalFen:500000,
} as const
export const RELAY_JOBS:readonly JobDefinition[]=[
 {id:'relay-preparation',purpose:'prepare',routes:['api_relay'],skill:'general',durationDays:7,actionPoints:1,costFen:10000,output:'relay-application-materials'},
 {id:'relay-basics',purpose:'prepare',routes:['api_relay'],skill:'general',durationDays:7,actionPoints:1,costFen:100000,output:'relay-technical-training'},
 {id:'relay-application',purpose:'prepare',routes:['api_relay'],skill:'general',durationDays:7,actionPoints:1,costFen:100000,output:'permission-decision-and-baseline-connection-report'},
 {id:'relay-adapter',purpose:'maintenance',routes:['api_relay'],skill:'general',durationDays:7,actionPoints:1,costFen:100000,output:'tested-supplier-adapter'},
 {id:'relay-marketing',purpose:'maintenance',routes:['api_relay'],skill:'general',durationDays:7,actionPoints:1,costFen:200000,output:'actual-service-prospects'},
 {id:'relay-service',purpose:'production',routes:['api_relay'],skill:'general',durationDays:28,actionPoints:1,costFen:300000,output:'served-and-metered-period'},
 {id:'relay-support-guided',purpose:'maintenance',routes:['api_relay'],skill:'general',durationDays:7,actionPoints:1,costFen:150000,output:'client-support-receipt'},
 {id:'relay-support-assisted',purpose:'maintenance',routes:['api_relay'],skill:'general',durationDays:4,actionPoints:1,costFen:100000,output:'agent-assisted-client-support'},
 {id:'relay-support-delegated',purpose:'maintenance',routes:['api_relay'],skill:'general',durationDays:2,actionPoints:1,costFen:70000,output:'explicitly-delegated-client-support'},
 {id:'relay-support-self',purpose:'maintenance',routes:['api_relay'],skill:'general',durationDays:14,actionPoints:2,costFen:0,output:'limited-client-support'},
 {id:'relay-meter-audit',purpose:'maintenance',routes:['api_relay'],skill:'general',durationDays:3,actionPoints:1,costFen:10000,output:'independent-usage-reconciliation'},
 {id:'relay-requote',purpose:'maintenance',routes:['api_relay'],skill:'general',durationDays:7,actionPoints:1,costFen:0,output:'customer-price-response'}]
