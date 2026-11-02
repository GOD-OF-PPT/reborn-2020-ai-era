import {renderToStaticMarkup} from 'react-dom/server'
import {expect,it} from 'vitest'
import {ResourceSelect} from './ResourceSelect.tsx'
it('requires a fresh choice when the selected employee is no longer available',()=>{
 const html=renderToStaticMarkup(<ResourceSelect options={[{id:'player-production',label:'本人'}]} value="dismissed-worker" onChange={()=>{}}/>)
 expect(html).toContain('<option value="" disabled="" selected="">原资源不可用，请重新选择</option>');expect(html).not.toContain('value="player-production" selected')
})
it('retains the explicitly chosen active resource in an independent draft field',()=>{
 const html=renderToStaticMarkup(<ResourceSelect name="support-resource" options={[{id:'player-production',label:'本人'},{id:'worker',label:'助理'}]} initialValue="worker"/>)
 expect(html).toContain('name="support-resource"');expect(html).toContain('<option value="worker" selected="">助理</option>')
})
it('leaves a people choice empty until explicitly selected and keeps a lost worker from delegating to the player',()=>{
 const options=[{id:'player-production',label:'由我自己来做'},{id:'worker',label:'原员工'}]
 for(const value of ['', 'dismissed-worker']){
  const html=renderToStaticMarkup(<ResourceSelect appearance="people" name="actual-assignment" options={options} value={value} onChange={()=>{}}/>)
  expect(html).toContain('role="radiogroup"');expect(html).toContain('value="player-production"');expect(html).toContain('value="worker"');expect(html).not.toContain('checked=""')
  if(value)expect(html).toContain('原人手已不可用，请重新选择。')
 }
 expect(renderToStaticMarkup(<ResourceSelect appearance="people" name="empty-draft" options={options}/>)).not.toContain('checked=""')
 const html=renderToStaticMarkup(<ResourceSelect appearance="people" name="actual-assignment" options={options} value="worker" onChange={()=>{}}/>)
 const selectedInput=html.match(/<input\b[^>]*>/g)?.find(input=>input.includes('value="worker"'))
 expect(selectedInput).toContain('checked=""');expect(html).toContain('已选')
})
