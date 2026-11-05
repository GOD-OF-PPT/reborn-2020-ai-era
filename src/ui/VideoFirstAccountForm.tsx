import type {ReactNode} from 'react'
import './video-first-account.css'

/** The original fields, handlers and terms are supplied by VideoSceneChoice. */
export function VideoFirstAccountForm({audience,nameField,terms}:{audience:ReactNode;nameField:ReactNode;terms:ReactNode}){
 return <section className="video-first-account-form" aria-label="第一份作品的受众与名字">{audience}{nameField}{terms}</section>
}
