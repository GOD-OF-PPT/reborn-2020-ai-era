import { useId,useLayoutEffect,useRef,type KeyboardEvent,type ReactNode } from 'react'
import {ScreenBook} from './ScreenBook.tsx'
import {createPortal} from 'react-dom'
export function Dialog({title,children,onClose,className='',footer}:{title:string;children:ReactNode;onClose:()=>void;className?:string;footer?:ReactNode}){
 const titleId=useId()
 const ref=useRef<HTMLDialogElement>(null),close=useRef(onClose);close.current=onClose
 useLayoutEffect(()=>{const dialog=ref.current!,trigger=document.activeElement instanceof HTMLElement?document.activeElement:null;dialog.showModal();return ()=>{if(dialog.open)dialog.close();queueMicrotask(()=>{if(trigger?.isConnected&&trigger.getClientRects().length>0&&!(trigger instanceof HTMLButtonElement&&trigger.disabled))trigger.focus({preventScroll:true});else document.getElementById('main-content')?.focus({preventScroll:true})})}},[])
 const keepFocus=(event:KeyboardEvent<HTMLDialogElement>)=>{if((event.target as HTMLElement).closest('dialog')!==event.currentTarget)return;if(event.key!=="Tab")return;const dialog=event.currentTarget,items=[...dialog.querySelectorAll<HTMLElement>("button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,[tabindex]:not([tabindex=\"-1\"])")].filter(item=>item.tabIndex>=0&&!item.matches(":disabled")&&item.getClientRects().length>0),first=items[0],last=items.at(-1);if(!first){event.preventDefault();dialog.focus();return}if(event.shiftKey&&(document.activeElement===first||!dialog.contains(document.activeElement))){event.preventDefault();last?.focus()}else if(!event.shiftKey&&(document.activeElement===last||!dialog.contains(document.activeElement))){event.preventDefault();first.focus()}}
 const content=<dialog ref={ref} onKeyDownCapture={keepFocus} className={'dialog '+className} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();event.stopPropagation();close.current()}}><div className="dialog-heading"><h2 id={titleId}>{title}</h2><button type="button" aria-label="关闭对话框" onClick={onClose}>×</button></div><ScreenBook key={title} label={title}>{children}</ScreenBook>{footer}</dialog>
 // A modal belongs to the stage, never to the multicolumn page that opened it.
 const stage=typeof document==='undefined'?null:document.querySelector('.game-app')
 return stage?createPortal(content,stage):content
}
