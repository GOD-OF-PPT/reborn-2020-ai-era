import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { expect, it } from 'vitest'
import { createCampaignCodec } from '../application/campaign.ts'
import { GameController } from '../application/game-controller.ts'
import { IndexedDbRunStore } from '../persistence/indexeddb.ts'
import { MemoryWriterAccess } from '../testing/memory-writer-access.ts'
import { MainlineCompass } from './MainlineCompass.tsx'
import { EndingVerdictBanner } from './EndingVerdictBanner.tsx'
import type { PlayFeatures } from './game-types.ts'
import { projectEndingVerdict, projectMainlineHud } from './mainline-projection.ts'

for (const backgroundId of ['technical_employee', 'content_employee']) {
  for (const wishId of ['financial_independence', 'own_brand', 'important_technology', 'autonomy'] as const) {
    it(`reads and renders real committed campaign projections for ${backgroundId}/${wishId}`, async () => {
      const codec = createCampaignCodec()
      const store = new IndexedDbRunStore({ codec, factory: new IDBFactory(), keyRange: IDBKeyRange, name: `v2-${backgroundId}-${wishId}` })
      let sequence = 0
      const controller = new GameController({ codec, store, locks: new MemoryWriterAccess(), id: () => `v2-${++sequence}` })
      try {
        await controller.initialize()
        await controller.newLife({ backgroundId, playerProfile: { wishId, approach: 'first_order' }, seed: 'v2-projection-regression' })
        for (const kind of [null, 'WorkQuarter', 'StartFirstOrder']) {
          if (kind) expect((await controller.submit(controller.prepare(kind, {}))).status).toBe('saved')
          const view = controller.snapshot.view!
          const features = view.features as unknown as PlayFeatures
          const saved = controller.exportSaved()
          const hud = projectMainlineHud(view, features)
          const verdict = projectEndingVerdict(view, features)
          expect(hud.act.year).toBe(2020)
          expect(hud.actQuests).toHaveLength(3)
          expect(verdict.radarAxes).toHaveLength(6)
          for (const axis of verdict.radarAxes) {
            expect(Number.isFinite(axis.value)).toBe(true)
            expect(axis.value).toBeGreaterThanOrEqual(0)
            expect(axis.value).toBeLessThanOrEqual(100)
          }
          const noAction = () => { throw new Error('READING_MAINLINE_MUST_NOT_ACT') }
          const p = { controller, view, features, request: noAction, accountId: 'personal' }
          expect(renderToStaticMarkup(createElement(MainlineCompass, { p, onNavigate: noAction }))).toContain('第一幕')
          expect(renderToStaticMarkup(createElement(EndingVerdictBanner, { p }))).toContain('综合时代指数')
          expect(controller.exportSaved()).toBe(saved)
        }
      } finally {
        await controller.close(true)
      }
    }, 20000)
  }
}
