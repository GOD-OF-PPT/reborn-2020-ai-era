import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js'
import { canonicalJson } from './identity.ts'

export function utf8Length(value: string): number { return utf8ToBytes(value).length }
export function hashText(value: string): string { return bytesToHex(sha256(utf8ToBytes(value))) }
export function hashValue(value: unknown): string { return hashText(canonicalJson(value)) }
