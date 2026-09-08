/**
 * PaneBody: the re-hosted native conversation for ONE pane session.
 *
 * Given a pane session id, this builds the pane's standard kit (kit.ts, the
 * by-id twin of the framework's current-selection kit) and a pane render
 * host (render-host.ts, the by-id twin of the framework's slot dispatch),
 * then renders the SAME registered occupants the stock shell renders —
 * `conversation.session` (the chat/trajectory view), `conversation.session.
 * header` (crumbs, tabs, actions) and `conversation.composer.bar` (the
 * composer card) — each bound to the pane session through its own kit.
 *
 * The compose order mirrors ui-conversation's ConversationRoot: header,
 * body (the active conversation view), then the composer card, with the
 * input-dock strips above the composer.
 */
import { memo } from 'react'
import type { ReactNode } from 'react'
import type { PaneContext } from './kit.ts'
import { buildPaneKit } from './kit.ts'
import { createPaneRenderHost, type PaneRenderHost } from './render-host.tsx'
import css from './PaneBody.module.css'

/** One pane body: header + view + input, all re-hosted natives. */
export const PaneBody = memo(function PaneBody(props: {
  ctx: PaneContext
  sessionId: string | undefined
  key: string
}): ReactNode {
  const { ctx, sessionId } = props
  const kit = buildPaneKit(ctx, sessionId as never)
  const host = createPaneRenderHost(ctx.slots, kit, ctx.locale)

  // The strict session slots (header, body, input docks) are gated on the
  // session identity exactly like ui-conversation's ConversationRoot: they
  // are declared session scope, and dispatching them without a binding
  // would hand the occupant an absent session kit (every session hook
  // undefined). The composer bar is a session-maybe slot — it renders
  // (inert) without a session, as the stock shell does.
  const header = sessionId === undefined
    ? null
    : host.renderSlot('conversation.session.header', {}, { fallback: null })
  const body = sessionId === undefined
    ? null
    : host.renderSlot('conversation.session', {}, { fallback: null })
  // Composer: the stock composer bar card + the input dock strips above it.
  const dockEntries = sessionId === undefined
    ? null
    : host.renderSlot('conversation.input.dock', {}, { fallback: null })
  const composer = host.renderSlot('conversation.composer.bar', {
    variant: 'composer',
  }, { fallback: null })

  return (
    <div className={css.body}>
      {header}
      <div className={css.viewport}>
        {body}
      </div>
      {dockEntries}
      {composer}
    </div>
  )
})