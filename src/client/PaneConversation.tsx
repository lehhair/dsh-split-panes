/**
 * PaneConversation: the re-hosted native ConversationRoot for ONE pane.
 *
 * Given a pane session id, this builds the pane's standard kit (kit.ts, the
 * by-id twin of the framework's current-selection kit) and a pane render
 * host (render-host.tsx, the by-id twin of the framework's slot dispatch),
 * then renders the STOCK ConversationRoot component captured from the
 * 'conversation' slot — the SAME component the shell renders for the
 * current session, bound to THIS pane's session through its own kit.
 *
 * This is the pure-extension path (no core patch, no layout
 * re-implementation): ConversationRoot owns its own chrome — the strict
 * session header (crumbs, tabs, actions), the session body (chat/trajectory
 * view), the composer card, the hero (brand mark, workspace picker, agent
 * preset), the measurements and width handles — all rendered verbatim,
 * just fed this pane's binding and child dispatch instead of the
 * current-selection ones.
 *
 * The kit and host are MEMOIZED per pane session, so hooks, store
 * instances, and inject faces stay identity-stable across renders (the
 * production renderer's own caches).
 */
import { memo, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { PaneContext } from './kit.ts'
import { buildPaneKit } from './kit.ts'
import { createPaneRenderHost } from './render-host.tsx'

/** One pane's re-hosted native conversation (the stock ConversationRoot). */
export const PaneConversation = memo(function PaneConversation(props: {
  ctx: PaneContext
  sessionId: string | undefined
  key: string
}): ReactNode {
  const { ctx, sessionId } = props
  // Memoize the kit and host per pane session: the kit's selector hooks and
  // the host's occupant/store/inject caches must be identity-stable, or
  // every render would re-mint subscriptions and lose per-session state
  // (view selection, draft mirrors, scroll memory).
  const kit = useMemo(() => buildPaneKit(ctx, sessionId as never), [ctx, sessionId])
  const host = useMemo(
    () => createPaneRenderHost(ctx.slots, kit, ctx.locale),
    [ctx.slots, kit, ctx.locale],
  )

  // Render the stock ConversationRoot verbatim: the component owns its own
  // layout (hero vs active, header/body/composer, measurements, width
  // handles) — we only supply this pane's binding and child dispatch.
  return host.renderConversationRoot()
})