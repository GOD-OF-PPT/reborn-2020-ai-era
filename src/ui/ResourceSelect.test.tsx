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
