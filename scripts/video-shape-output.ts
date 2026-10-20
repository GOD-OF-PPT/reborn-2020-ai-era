import {existsSync,realpathSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {resolve,relative,dirname,sep} from 'node:path'

/** Preflight before mkdir: keep each task's committed or staged evidence tree immutable. */
export function assertFreshVideoEvidencePath(root:string,args:readonly string[]):string{
 if(args.length!==2||args[0]!=='--output-dir'||!args[1]||/[\r\n]/.test(args[1]))throw Error('EXPLICIT_FRESH_VIDEO_OUTPUT_REQUIRED')
 const output=resolve(root,args[1]),name=relative(root,output).split(sep).join('/'),parts=name.split('/')
 if(parts[0]!=='goal-1'||parts[1]!=='evidence'||!parts[2]||parts.some(p=>p==='..'))throw Error('VIDEO_OUTPUT_MUST_BE_PROJECT_EVIDENCE')
 const taskRoot=parts.slice(0,3).join('/')
 if(execFileSync('rtk',['proxy','git','ls-files','-z','--',taskRoot],{cwd:root}).length)throw Error('IMMUTABLE_EVIDENCE_PARENT_USE_NEW_SIBLING')
 if(existsSync(output))throw Error('FRESH_VIDEO_OUTPUT_DIRECTORY_REQUIRED')
 let ancestor=dirname(output)
 while(!existsSync(ancestor)){const parent=dirname(ancestor);if(parent===ancestor)throw Error('VIDEO_OUTPUT_PARENT_REQUIRED');ancestor=parent}
 const lexical=relative(root,ancestor).split(sep).join('/'),physical=relative(realpathSync(root),realpathSync(ancestor)).split(sep).join('/')
 if(lexical!==physical||!(physical==='goal-1/evidence'||physical.startsWith('goal-1/evidence/')))throw Error('VIDEO_OUTPUT_SYMLINK_OR_SCOPE_ESCAPE')
 return output
}
