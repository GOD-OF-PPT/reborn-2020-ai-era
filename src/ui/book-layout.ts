/** CSS columns include the page gap in every stride except the last. */
export function bookPageCount(extent:number,width:number,gap:number){
 if(!Number.isFinite(extent)||!Number.isFinite(width)||width<=0)return 1
 return Math.max(1,Math.ceil((extent+gap-1)/(width+gap)))
}
export function bookPageAt(left:number,width:number,gap:number,pages:number){
 return Math.max(0,Math.min(pages-1,Math.floor((left+1)/(width+gap))))
}
