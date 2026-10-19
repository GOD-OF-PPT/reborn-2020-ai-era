import {expect,it} from 'vitest'
import {bookPageAt,bookPageCount} from './book-layout.ts'

it('keeps every column reachable including a last page with a single line',()=>{
 expect(bookPageCount(900,900,48)).toBe(1)
 expect(bookPageCount(1848,900,48)).toBe(2)
 expect(bookPageCount(1849,900,48)).toBe(2)
 expect(bookPageCount(1850,900,48)).toBe(3)
 expect(bookPageCount(9432,900,48)).toBe(10)
 expect(bookPageAt(948*9,900,48,10)).toBe(9)
 // clientWidth rounds this to 806, which incorrectly invented a fifth, empty page.
 expect(bookPageCount(3370,806.3984375,48)).toBe(4)
})
it('keeps a selected chapter in bounds after dynamic content collapses',()=>{
 expect(bookPageAt(948*9,900,48,2)).toBe(1)
 expect(bookPageAt(-20,900,48,2)).toBe(0)
 expect(bookPageCount(0,0,48)).toBe(1)
})
