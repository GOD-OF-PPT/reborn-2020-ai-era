import { useLayoutEffect,useRef,type ReactNode } from 'react'
export function Dialog({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null),close=useRef(onClose);close.current=onClose
 useLayoutEffect(()=>{const dialog=ref.current!,trigger=document.activeElement instanceof HTMLElement?document.activeElement:null;dialog.showModal();return ()=>{if(dialog.open)dialog.close();queueMicrotask(()=>{if(trigger?.isConnected&&!(trigger instanceof HTMLButtonElement&&trigger.disabled))trigger.focus({preventScroll:true});else document.getElementById('main-content')?.focus({preventScroll:true})})}},[])
 return <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onCancel={event=>{event.preventDefault();close.current()}}><div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button type="button" aria-label="关闭对话框" onClick={onClose}>×</button></div>{children}</dialog>
}
