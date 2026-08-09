/** Pane-chrome copy (the 'panes' dictionary namespace). */
export type PaneKey =
  | 'pane.split'
  | 'pane.split.horizontal'
  | 'pane.split.vertical'
  | 'pane.close'
  | 'pane.split.divider'
  | 'pane.new.conversation'

export const zh = {
  'pane.split': '分屏',
  'pane.split.horizontal': '左右分屏',
  'pane.split.vertical': '上下分屏',
  'pane.close': '关闭窗格',
  'pane.split.divider': '调整分屏比例',
  'pane.new.conversation': '新建对话',
} satisfies Record<PaneKey, string>

export const en = {
  'pane.split': 'Split',
  'pane.split.horizontal': 'Split horizontal',
  'pane.split.vertical': 'Split vertical',
  'pane.close': 'Close pane',
  'pane.split.divider': 'Resize split',
  'pane.new.conversation': 'New conversation',
} satisfies Record<PaneKey, string>
