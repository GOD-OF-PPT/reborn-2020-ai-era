import type {GamePanelProps} from './game-types.ts'

/** Only a genuinely empty public video history can use the first-account path.
 * Existing or orphaned records keep the original explicit account selector. */
export function videoFirstAccount(video:GamePanelProps['features']['video']|undefined):boolean{
 return !!video&&[video.channels,video.works,video.contracts,video.marketing,video.publications,video.settlements].every(rows=>Array.isArray(rows)&&rows.length===0)
}
export const videoFirstEntryCopy={
 title:'想让谁看见你的第一份作品？',
 line:'先选受众，再给账号起个名字。',
 detail:'作品、客户反馈与回款，各有自己的日子。',
 action:'选受众，起个名字',
} as const
