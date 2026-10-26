import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {guard} from '../io.mjs'
export const correctionOutput=path.dirname(fileURLToPath(import.meta.url))
export function put(name,value){const destination=path.resolve(correctionOutput,name);if(!destination.startsWith(correctionOutput+path.sep))throw Error('OWNED_CORRECTION_OUTPUT_REQUIRED');guard(path.dirname(destination));fs.writeFileSync(destination,typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'})}
