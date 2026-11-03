import {expect,it} from 'vitest'
import {MONEY_LIMIT,sumMoney,cumulativeFee} from './money.ts'

// An independent integer oracle for valid operands, not a copy of the numeric
// fast path. Invalid operands and precedence have explicit contract examples.
function exact(values:readonly number[],signed=false){
 const total=values.reduce((sum,n)=>sum+BigInt(n),0n),limit=BigInt(MONEY_LIMIT)
 if(total<(signed?-limit:0n)||total>limit)expect(()=>sumMoney(values,signed)).toThrow('MONEY_OUT_OF_RANGE')
 else expect(sumMoney(values,signed)).toBe(Number(total))
}

it('keeps negative operands, temporary over-limit prefixes and final unsigned/signed limits separate',()=>{
 for(const signed of [false,true])for(const values of [[],[0],[-0],[-5,8],[MONEY_LIMIT,1,-1],[MONEY_LIMIT,MONEY_LIMIT,-MONEY_LIMIT],[-MONEY_LIMIT,-MONEY_LIMIT,MONEY_LIMIT,MONEY_LIMIT,42],[MONEY_LIMIT,1],[-MONEY_LIMIT,-1]])exact(values,signed)
 expect(Object.is(sumMoney([-0]),0)).toBe(true)
})

it('preserves every boundary length including sparse arrays on both sides of the safe-prefix bound',()=>{
 const bound=Math.floor(Number.MAX_SAFE_INTEGER/MONEY_LIMIT)
 expect(bound).toBe(1000)
 expect(BigInt(bound)*BigInt(MONEY_LIMIT)<=BigInt(Number.MAX_SAFE_INTEGER)).toBe(true)
 expect(BigInt(bound+1)*BigInt(MONEY_LIMIT)>BigInt(Number.MAX_SAFE_INTEGER)).toBe(true)
 for(const count of [0,1,2,3,bound-1,bound,bound+1,2004,4096]){
  const zero=Array<number>(count).fill(0);exact([...zero,MONEY_LIMIT]);exact([...zero,-MONEY_LIMIT],true)
  const sparse=Array<number>(count);expect(sumMoney(sparse)).toBe(0)
 }
 const nearBound=[...Array<number>(499).fill(MONEY_LIMIT),1,...Array<number>(499).fill(-MONEY_LIMIT),-1]
 expect(nearBound).toHaveLength(bound)
 exact(nearBound);exact([...nearBound].reverse(),true)
 exact(Array<number>(bound).fill(MONEY_LIMIT),true)
})

it('retains exact cancellation after intermediate sums exceed the safe-integer range',()=>{
 const prefix=Array<number>(1001).fill(MONEY_LIMIT),suffix=prefix.map(n=>-n),values=[...prefix,1,...suffix,-1]
 expect(values.reduce((a,n)=>a+BigInt(n),0n)).toBe(0n)
 expect(sumMoney(values)).toBe(0)
 expect(sumMoney(values.map(n=>-n),true)).toBe(0)
})

it('validates all operands in original order before checking the final aggregate',()=>{
 expect(()=>sumMoney([MONEY_LIMIT,MONEY_LIMIT,NaN])).toThrow('INVALID_MONEY')
 expect(()=>sumMoney([MONEY_LIMIT+1,NaN])).toThrow('MONEY_OUT_OF_RANGE')
 expect(()=>sumMoney([NaN,MONEY_LIMIT+1])).toThrow('INVALID_MONEY')
 expect(()=>sumMoney([...Array<number>(1001).fill(0),MONEY_LIMIT,MONEY_LIMIT,NaN])).toThrow('INVALID_MONEY')
 for(const value of [NaN,Infinity,-Infinity,0.5,Number.MAX_SAFE_INTEGER+1,true,'1',null,undefined,1n]){
  expect(()=>Reflect.apply(sumMoney,undefined,[[value]])).toThrow('INVALID_MONEY')
 }
 for(const value of [MONEY_LIMIT+1,-MONEY_LIMIT-1,Number.MAX_SAFE_INTEGER])expect(()=>sumMoney([value])).toThrow('MONEY_OUT_OF_RANGE')
})

it('matches exact integer arithmetic over deterministic mixed-sign histories around the boundary',()=>{
 let state=0x6f31b4a9
 const next=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return Math.floor(state/0x100000000*MONEY_LIMIT)}
 for(let sample=0;sample<4;sample++)for(const count of [1,2,17,999,1000,1001,2004,4097]){
  const values:number[]=[]
  while(values.length<count){const n=next();values.push(n);if(values.length<count)values.push(-n)}
  exact(values);exact(values,true);exact([...values].reverse(),true)
 }
})

it('keeps cumulative fee integer rounding at the money limit and for split charges',()=>{
 expect(cumulativeFee(0,MONEY_LIMIT,9999)).toBe(8_999_100_000_000)
 expect(cumulativeFee(0,1,5000)+cumulativeFee(1,1,5000)).toBe(1)
 expect(()=>cumulativeFee(MONEY_LIMIT,1,5000)).toThrow('MONEY_OUT_OF_RANGE')
})
