# dsh-split-panes 架构设计文档

> 免补丁（不修改、不重打包核心）实现 DSH Web 多窗格分屏对话。
> 适用核心版本：`0.1.5-alpha.1+`。插件版本：`v0.5.0`。

---

## 1. 目标与约束

### 1.1 产品目标

- **分屏组合**：header 分屏按钮 + `mod+shift+方向键`，`mod+shift+w` 关闭；分隔条可拖拽/键盘调节
- **每窗格独立会话**：每个 pane 绑定各自的会话；新分出的 pane 是"新建对话"占位
- **焦点即全局选中**：点 pane → 焦点 + 全局选中跟随；点侧边栏会话 → **改的是焦点 pane**
- **信息流本体 100% 原生**：pane 内的 header / 消息流 / composer / hero 全部是核心组件、核心渲染逻辑

### 1.2 硬约束

| 约束 | 内容 |
|---|---|
| **免补丁** | 不修改核心源码、不重打包、不 patch dist |
| **只用公开面** | 只用 `ctx.*` 服务、slot registry、公开类型 |
| **渲染语义不自己写** | 不复刻 outlet 的合成顺序（那是漂移的来源） |

---

## 2. 核心渲染机制调研：为什么没有"按 id 渲染"的缝

核心 Web 界面由 slot 系统装配，所有 session 作用域槽的渲染 props 来自**唯一的** `ScopeProvider`：

```
ctx.slots.renderSlot('root')
  └─ ScopeProvider(scope='session-maybe')   ← 读 host.scope('session').current
       └─ AppFrame → conversation 槽 → ConversationRoot → 各子槽
```

逐条验证过（0.1.5-alpha.1）：

| 机制 | 状态 | 结论 |
|---|---|---|
| `ScopeProvider` | `bindings.tsx:130-143` 硬编码 `adapter.current` | 只能渲染**当前选中**会话 |
| `ScopeBindingContext` / `RootBindingContext` | `bindings.tsx` 内 `createContext`，**全仓库无 re-export** | 无法给核心渲染树提供自定义 binding |
| `installScope` | `registry.ts:300-315`，已存在同名 scope 抛错 | `'session'` 被 ui-session 占用，无法替换 |
| `SlotScope` | `ui-slots/index.ts:101` = `'root'\|'session-maybe'\|'session'` | 自定义 scope 名会被当 root 处理 |
| `ctx.slots.renderSlot(key)` | `registry.ts:349` 只允许 `'root'` | 不能直接渲染 conversation 子树 |
| `adapter.renderArea(binding, props)` | `ui-session/session-provider.tsx` 只是 `<Fragment key>` | 不提供 binding，只做 keyed fragment |
| `ctx.slots.install(renderer)` | `registry.ts:242` boot-once | 不能替换渲染器 |
| `"./src/*"` 导出 | `ui-renderer/package.json` 有，但 npm 包**只发布 `lib/`** | 深导入源码在内联后会造出第二份 context → 不生效 |

**结论**：上游 #604 设想的 `conversation.panes` 缝（核心自己按 id 渲染）**无法靠扩展实现**——缝必须被核心渲染器消费，而消费点全是私有/一次性。

---

## 3. 方案选择

| 方案 | 做法 | 结论 |
|---|---|---|
| **A. 手写 dispatch**（v0.4.0） | 捕获账本上的原生组件，自己复刻 outlet 的合成顺序 | ❌ 等于手抄核心 953 行渲染器；实测漂移出 6 处偏差（`t` 座位每帧新函数、keyed hook 每帧重订阅、缺 store scope、缺授权检查、缺 `SessionProvider`、边界不 abdicate），表现为"输入框乱渲染/内容消失" |
| **B. 上游加缝** | 等 #604 | ❌ 等不到，且靠扩展做不到（§2） |
| **C. vendor 渲染器 + 合成 host** | 把核心渲染器搬进 pane 里跑 | ✅ **采用** |

### C 为什么成立

`SlotRendererHost` 是**公开接口**（`ui-slots/renderer.ts:127-205`），`createSlotRenderer().renderRoot(host, props)` 的**每一个依赖都从 host 上读**：

```
renderRoot(host)
 ├─ HostContext.Provider(host)
 ├─ RootStandardProvider   ← host.root
 ├─ ScopeProvider          ← host.scope('session').current      ★ binding 的唯一来源
 └─ RootOutlet             ← host.entriesOfSlot('root')
```

**谁提供 host，谁就决定这一整棵树的 scope binding。** 于是每个 pane 拿一个"本 pane 作用域"的 host，核心渲染器就把原生会话渲染进这个 pane——outlet 的合成顺序、locale `t` 座位、store 座位、slot 级 inject 工厂、owner 覆盖、single/keyed/list/chain 派发、session-maybe 化身、条目错误边界，全部是核心代码，**零复刻**。

`createSlotRenderer` 未从已发布的 `@deepseek-ai/dsh-client-ui-renderer` 导出，因此渲染器源码 vendor 进仓库（§11）。

---

## 4. 架构总览

自核心 `0.1.5-alpha.2` 起，中央列不再直接渲染 `conversation` 槽，而是渲染 **`main`（keyed / root scope）**：
`main` 的 `'conversation'` key 承载官方 `ConversationPanel`（一个纯壳，只 `renderSlot('main.conversation')`），
会话根组件 `ConversationRoot` 注册在 **`main.conversation`（single / session-maybe）**。

```
main 槽 key='conversation'（ui-layout 声明 keyed root）
 └─ PaneWorkspace（插件注册，priority -1，shadow 官方 ConversationPanel，永久占据）
      ├─ 单 leaf：SinglePane（渲染 current，逐字节等同原生）
      └─ 分屏：SplitContainer → 每个 leaf 一个 PaneFrame
           └─ renderPane(pane.sessionId, paneId)
                └─ PaneConversation（按 (ctx, binding) memo）
                     └─ createSlotRenderer().renderRoot(paneHost, {})   ← vendored 核心渲染器
                          └─ RootOutlet → 合成 root entry（PaneRoot）
                               └─ renderSlot('main.conversation', {})
                                    └─ SessionMaybeEntry(原生 ConversationRoot)   ← binding = 本 pane 的
                                         ├─ 原生 header（crumbs/tabs/actions/corner）
                                         ├─ 原生消息流（session → view → chat.node）
                                         ├─ 原生 composer（chain → bar → InputBar）
                                         └─ 原生 hero（workspace picker / agentPreset）
```

三个职责层：

| 层 | 文件 | 职责 |
|---|---|---|
| **host 层** | `pane-host.ts` + `root-binding.ts` | 合成 `SlotRendererHost`：root 槽、pane scope adapter、store 解析、崩溃 abdication |
| **渲染层** | `vendor/renderer/*` + `PaneConversation.tsx` + `PaneRoot.tsx` | 核心渲染器逐字节副本 + 每个 pane 的实例化 |
| **容器层** | `PaneWorkspace.tsx` + `pane-layout-store.ts` | 分屏树、焦点路由、拖拽、快捷键（**不含任何对话布局**） |

> **为什么 shadow `main` 而不是注册新 key**：`main` 是 keyed 槽，同 key 不同 priority 时**低 priority 赢**（cell shadowing），
> 所以在 `key='conversation'` 上以 priority -1 注册即可成为默认主面板——不改 sidebar / AppFrame 的选择逻辑，
> 官方 `ConversationPanel` 仍留在账本上（pane 内渲染的是它的子槽 `main.conversation` 里的 `ConversationRoot`）。

---

## 5. pane host 详解（`pane-host.ts`）

| host 成员 | 实现 | 依据 |
|---|---|---|
| `entriesOf / entriesOfSlot / specOf / subscribe / getVersion` | 委托真实 `ctx.slots`；`'root'` 返回合成 entry；`entriesOf('conversation')` 过滤插件自己的影子 | 全公开 API |
| `scope('session'\|'session-maybe')` | 返回本 pane 适配器：`current` = 常量 observable（值 = `adapter.resolve(paneSessionId)`，无会话时用 `paneAbsentBinding`）、`resolve`/`renderArea` 用真实的 | `SlotScopeAdapter` 公开 |
| `root` | `root-binding.ts` 按 `ctx.inject` **反应式**拼装：`sessions` / `sessionPendingInteraction` 立即，`workspaces` / keyed `resource` 等 owner 上线后再补 | `provideRoot` 调用点全核对 |
| `storeOf` | per-(handle, scopeKey) 缓存 `handle.create(key)`；会话 binding 的 `bindStoreScope` 由 `adapter.resolve()` 内部完成 | `StoreHandle.create` 公开 |
| `reportEntryError` | 自建 abdication（WeakSet + 本地版本号），复刻"崩溃退位 → 下一个幸存者" | `SlotCore.reportEntryError` 语义 |
| `isLive` | 恒 true（pane 持有的 renderSlot 来自常驻的原生条目；条目注销后下次账本 tick 就换人） | — |
| `locale` | 真实 `ctx.locale`（`LocaleFace`） | 公开 |

**shadowing 镜像**：`winnersOf(key)` 按 cell（single/keyed 的 `key`/list 的 `id`）分组，按 priority 升序、同 priority 按注册序取第一个未被 abdicate 的条目——与 `SlotCore.entriesOfSlot` 同语义。

**为什么不会出现 store 双实例**：插件永久占据 conversation 槽，核心从不渲染原生会话 → 核心的 `storeOf` 永不被调用，只有 pane facade 创建实例。

---

## 6. 合成 root entry（`PaneRoot.tsx`）

```ts
const PANE_ROOT_ENTRY = {
  component: PaneRoot,                                   // (props) => props.renderSlot('conversation', {})
  options: { id: 'panes.root' },
  children: { 'conversation': { kind: 'single', scope: 'session-maybe' } },
}
```

核心渲染器永远从 `'root'` outlet 起步，pane 不是应用外壳，所以 host 把 `entriesOfSlot('root')` 指向这个 entry。它的 `children` 声明让核心的 `standardKit` **自动**给 `PaneRoot` 装上 `renderSlot`；`PaneRoot` 一调用，`SlotOutlet` 就走 `session-maybe` 分支，用 `useScopeBinding()`（= 本 pane 的 binding）渲染原生 `ConversationRoot`，并自动 `entry.inject(paneSessionId)` 拿到**正确会话**的 `selectWorkspace` / `composerBlock`。

## 7. 数据面

### 7.1 binding 解析

`ctx.uiSession.adapter.resolve(sessionId)` 返回该会话**完整物化**的 `ScopedStandardSourceBinding`（`hooks` / `keyedHooks` / `props` / `ctx`）——正是核心渲染当前会话时用的同一份东西；ui-session 按 sessionId 缓存，身份稳定。

### 7.2 absent binding（新建对话 pane）

不能手写 shape：核心的 absent binding 由**所有已声明 source 名**组成（每个名字映射到 `undefined`），少一个名字就会让 session-maybe 组件读到 `undefined` 当作 hook 函数（实测 `useConversation is not a function` / `useWorkspaces is not a function`）。`paneAbsentBinding(ctx)` 因此从 `adapter.current` 的 roster 派生：

- 当前无选中 → 直接返回核心自己的 absent binding
- 当前有选中 → 用它的 hooks/keyedHooks/props 名字集映射成 `undefined`

### 7.3 非当前会话的窗口

核心只 stage 当前会话（`followCurrent()` 的注释：窗口打开 ⟺ 会话在台上），所以 pinned pane 必须自己开窗：`ctx.sessions.binding(id).session.open()`（幂等、与 stage 无关）。`SessionFace` 类型上不含 `open`，这是**全插件唯一的窄化 cast**（`pane-session.ts`）。

### 7.4 store 生命周期

会话 binding 的物化路径内部已调 `ctx.slots.bindStoreScope(binding)`，会话销毁时清理持久化。

---

## 8. 焦点模型（OpenCode）

核心只有一个 `current`，所以设计成 **"焦点 pane 是 current 的镜像"**：

| 事件 | 处理 | 实现 |
|---|---|---|
| 点 pane | `focusPane(id)`；有会话则 `sessions.open(id)`（全局选中跟随，侧边栏高亮同步） | `PaneFrame.onPointerDown` |
| 点侧边栏会话 | 直接写入**焦点 pane**；其余 pane 保持 pinned | capture 阶段 click 通道（`session-row.ts` 反查行 → 会话 id） |
| 选中变化（命令面板/程序化） | 同上，绑定焦点 pane | `useEffect([current])` |
| 拖会话到中心/四边 | 替换 / 向该侧分屏 | `usePaneDrop` |
| 在占位 pane 里选工作区新建 | 新会话落回**发起它的 pane** | `wrapPaneEntry` 包住原生 `selectWorkspace`，成功后把新会话绑回该 pane 并聚焦 |
| 全屏 / 退出全屏 | 只显示该 pane，**树不动** | store 的 `fullscreenPaneId`；按钮在 pane header，`Esc` 退出 |

**为什么需要 capture click 通道**：`sessions.open(id)` 在 id 已经是 current 时也会 `notifyNow()`，但快照的 `current` 值不变 → 选择器不重渲染 → 监听不到"再次点了同一个会话"。capture 阶段先于行自身的 handler 绑定焦点 pane，覆盖这个 case。单窗格状态渲染 `current`，不需要任何路由。

**焦点语义的两个方向**
- 点 pane → current 跟随（侧边栏高亮跟着焦点走）
- 点侧边栏 → 只改焦点 pane（其它 pane 不动）

**全屏**：`fullscreenPaneId` 只影响**渲染**（只渲染那个 leaf，走 `.fullscreenHost` 全宽），`root` 树一个字节都不动，所以退出全屏就是回到原来的分屏比例与所有 pane 的会话；`closePane` 关掉全屏 pane、或树塌成单 leaf 时自动清空该状态；在全屏里再分屏也会自动退出全屏（因为要看到两个 pane）。单 pane 本身就是全宽，按钮此时不渲染。

---

## 9. 注册面（`index.ts`）

```
inject = ['slots', 'locale', 'sessions', 'uiSession']
  （workspaces / resources 用 ctx.inject 反应式绑定，不进硬依赖）

1. main 槽 key='conversation'（priority -1，shadow 官方 ConversationPanel，永久占据）
   - inject 返回 operations：openSession/splitWithNew/splitFocused/closeFocused/
     hasSplit/toggleFullscreen/isFullscreen/usePaneStore/paneActions/renderPane/resolveRowSession
2. conversation.session.header.actions（list，session scope）
   - panes-split / panes-split-v / panes-fullscreen / panes-close，每个声明 locale: NS
3. 拖拽通道（document dragstart capture）
4. 全局快捷键（window keydown + Escape 退全屏；编辑目标豁免）
```

卸载语义：插件卸载 → priority -1 条目消失 → 官方 ConversationPanel 重新成为 `main` 赢家，原生单列恢复。

---

## 10. 踩坑记录（每条都在真机或测试里复现过）

| 症状 | 根因 | 结论 |
|---|---|---|
| `useConversation is not a function` | absent binding 手写了 shape，缺 `conversation` 等 seat | absent binding 必须从 adapter roster 派生 |
| `useWorkspaces is not a function` | apply 时 workspace 服务尚未 provide，`ctx.get` 拿到 undefined 并**固化**进 root binding | 可选 root 贡献用 `ctx.inject` 反应式补，并 bump 绑定 |
| 输入框乱渲染 / 内容消失（v0.4.0） | 手写 dispatch 与核心漂移（`t` 每帧新身份 → `memo(InputBar)` 每帧重渲染；keyed hook 每帧重订阅） | 不要手写 dispatch，vendor 渲染器 |
| pane 内多出 `[data-slot="root"]` / `[data-slot="conversation"]` 锚点 | `renderRoot`/`SlotOutlet` 自带 `display:contents` 锚点 | 已核对核心 CSS：只有 `[data-slot='conversation.session']` 一条属性选择器，且在 ConversationRoot 内部，不受影响 |
| 空白会话的 pane 没有 header | 核心对 blank 会话隐藏 header（`.headerHidden`） | pane 对 `sessionId === null` **或** blank 会话渲染插件自己的新建对话 header |
| 新建对话的标题和旁边会话 header 的标题行不一致 | 那栏原先是"32px 高 + `--pane-pad-top` 变量"，而 `.pane` 把变量改成 3px：标题比会话标题**高 6px、行高多 2px、左边少 8px** | 该栏照抄核心的 `.header` 顶内边距（10px）+ `.titleRow` 行高（30px），标题盒照抄 `.crumb`/`.crumbCurrent`（14px/20px、`padding: 4px 8px`）；`tests/pane-chrome.spec.ts` 直接从核心 CSS 读这些值比对 |
| `slot "conversation" is not declared`（0.1.5-alpha.2） | alpha.2 把中央列改成 keyed 的 `main` 槽，会话根挪到 `main.conversation`；插件仍旧注册 `conversation` | 接管面改为 `main`（key），每 pane 捕获 `main.conversation` 的 ConversationRoot |
| vendored 文件"漂移"但内容没改（Windows） | git autocrlf 把工作区副本改成 CRLF，纯字节比对误报 | 漂移比对先归一化换行（`tests/renderer-vendor.spec.ts` + sync 脚本） |
| `lib/client.js` 每次构建字节都不同 | CSS Modules 类名映射对象的 key 顺序来自 lightningcss 的 hash 依赖迭代顺序 | 序列化前对 key 排序（`tsdown.config.ts`），构建变确定性 |
| pane header 的图标和右则栏"不像一家"（0.1.5-alpha.2） | 图标是**手抄**的，上游 alpha.2 重画了右则栏 glyph（14px 描边→16px figma 实心），手抄件留在 alpha.1 | 改为 `scripts/sync-icons.mjs` 从核心源码**提取生成** + `icons:check` 漂移门 + `upgrade-core` 自动重提取 |
| 关闭按钮比邻居小/大一圈 | 用了别场景的 glyph：`IconCloseFill14`（dockkit 标签 chip 的 14px 实心）放进 16px 的 header 行；新建对话 header 又用 `IconCloseOutline16`，同一动作两种尺寸 | 统一 `IconCloseOutline16`——核心自己在会话 chrome 行（QueueDock/GoalBar/FloatLayer）就用它 |
| 分隔条上出现"虚白色"长条 | 插件给分隔条加了 `:hover`/`:focus-visible` 的 `interactive-bg-hover` 填充；核心的 resize handle 是**裸命中条**（`AppFrame.module.css`："No handle draws a visible pill"，只有 `cursor: col-resize`），从不画任何填充 | 分隔条静止/悬停/拖拽全部不画（只留 cursor）；仅键盘 `:focus-visible` 给一条品牌色描边，保住键盘可调 |

---

## 11. 漂移防护

- `src/client/vendor/renderer/{bind.ts,bindings.tsx,scoped-slots.tsx}`：核心渲染器**逐字节副本**
- `scripts/sync-renderer-vendor.mjs`：从 `../dsh2026/deepseek-harness/packages/client/ui-renderer/src/client/` 同步；`--check` 只比对
- `tests/renderer-vendor.spec.ts`：在测试里再做一次逐字节比对 → 上游一改就红
- `pnpm run check` 先跑 `vendor:renderer:check` 再 typecheck/test/build

本地修改这三个文件**不支持**：要改行为就改 facade（`pane-host.ts`）。

## 12. 上游跟踪与升级（何时要重新同步）

**不需要每次上游更新都同步**。插件与上游的接触面是有限的：

| 接触面（变化才需要升级） | 为什么 |
|---|---|
| `ui-renderer/src/client/{bind,bindings,scoped-slots}.ts*` | vendored 渲染器本身 |
| `ui-conversation`（`contract/`、`skeleton/`）、`ui-session/`、`ui-layout/` | 渲染器喂给原生组件的座位契约 |
| 其它任何上游代码 | 与插件无关，忽略 |

**自动跟踪**：`.github/workflows/upstream-track.yml` 每 6h 检测上游 `dsh-v*` release：

1. 新 tag 的 commit 与当前钉死 ref 做 compare，**只**检查上面接触面
   - 没变 → 静默跳过，不开 PR、不发版（避免空 PR / 空版本）
   - 变了 → 改写 `core-pin.json` 的钉死 ref + 重新 vendor（`scripts/upgrade-core.mjs`）
2. 检出新 commit 的 harness 构建 → 安装 → 全量 `pnpm run check`
   - 红 → **不开 PR**，需要先适配（见 §10）
   - 绿 → 开 PR `chore: track dsh-vX.Y.Z`，正文写明构建产物 `lib/client.js` 是否变化（= 发 patch 版本是否有意义）
3. 发版仍是**人工闸门**：合 PR 后手动 `gh release`（`build-release` 出 tarball）

**pin 为什么是数据文件而不是 workflow 里的一行**：默认 `GITHUB_TOKEN` 无法推送
`.github/workflows/` 下的任何改动（`permissions:` 里根本没有 `workflows` 这个键，
加权限也修不了）。tracker 一开始是改 `build-release.yml` 里的 `ref:`，push 直接被
GitHub 拒：

```
! [remote rejected] chore/upstream-... -> chore/upstream-...
  (refusing to allow a GitHub App to create or update workflow
   `.github/workflows/build-release.yml` without `workflows` permission)
```

所以 pin 挪到 `core-pin.json`（`build-release.yml` 用 `steps.core.outputs.ref` 读它），
tracker 的 PR 只碰非 workflow 文件 → 不需要任何 PAT／App 就能开 PR。顺带把"改 YAML
文本、还要保住 `ref:` 上面的注释"这一整类坑消掉了。

手动 dispatch 时给 `force: true` 可以**跳过接触面判定**，即使上游没碰接触面也照走
"钉 ref → 重新 vendor → 全量 check → 开 PR"，用来验证 PR 那半边链路没坏（定时路径
平时走不到它）。此时 PR 正文会注明这是强制触发、合并与发版都不必要。

> 顺序有讲究：harness 必须在 `Pin + re-vendor` **之前**检出——`upgrade-core.mjs` 是从
> 那棵树里拷渲染器与图标的，所以它需要源码（不需要 install）。`tests/upstream-track.spec.ts`
> 把这条顺序、以及下面几个坑都钉成了测试。

已经踩过的坑（都在 `tests/upstream-track.spec.ts` 里有回归测试）：

| 坑 | 症状 | 修法 |
|---|---|---|
| `$GITHUB_ENV` 写小写 `latest=`，步骤里读 `$LATEST` | 变量全空 → `upgrade-core` 收到空 tag/sha，把 `ref:` 写成**空值**，直到下一步才炸 | 写大写名；`upgrade-core` 对非 40-hex 的 sha 直接 `exit 128`，一个字节都不写 |
| `argv` 过滤用 `i !== filesIdx + 1` 排除 `--files` 的值 | `--files` 不存在时 `filesIdx+1 === 0`，**第一个位置参数（tag）被丢掉**：`upgrade:core dsh-v0.1.6` 报 usage，`upgrade:core <tag> <sha>` 把 sha 当 tag | 只有 `--files` 真存在时才跳过那两个槽位 |
| 图标提取源（`ui-dockkit/TabPanel.tsx`、`ui-sidebar-right/SidebarRight.tsx`）不在接触面清单里 | 上游重画图标 → tracker 静默跳过，插件永远停在旧图标（alpha.2 那次就是这么漏的） | 两个文件加入 `CONTACT_SURFACES`；测试反过来校验"同步脚本读的每个核心文件都必须被清单覆盖" |
| tracker 的 PR 里有 `.github/workflows/` 下的文件 | `git push` 被 GitHub 拒（`workflows` 权限），整条链路在最后一步死掉 | pin 挪进 `core-pin.json`；测试直接断言 `git add` 列表不含 `.github` |
| 构建产物里嵌了本机路径（CSS 类名 hash 来自 lightningcss 的 `filename`；rolldown 把模块 id 写进 `//#region` 注释） | 本地 `E:\dev\...` 构建的 `lib/client.js` 与 CI 在 `/home/runner/work/...` 构建的**永不相同** → tracker 的"bundle 是否变化"信号永远为真、tarball 不可复现 | 传给 lightningcss / 放进虚拟模块 id 的一律是仓库相对路径（`tsdown.config.ts` 的 `stableId`）；`pnpm run bundle:portable` 守门，产物里出现盘符或 `/home/` 直接失败 |

**本地一键**（开发时用，和 CI 同一套代码路径）：

```sh
node scripts/upgrade-core.mjs dsh-v0.1.6-alpha.1            # 从本地核心检出解析
node scripts/upgrade-core.mjs dsh-v0.1.6-alpha.1 <sha>       # 显式指定 commit
node scripts/upgrade-core.mjs --dry-run dsh-v0.1.6-alpha.1   # 只报要做什么
node scripts/upgrade-core.mjs --force dsh-v0.1.6-alpha.1 <sha>  # 跳过接触面判定
```

## 13. 验证

**单测/集成**（`pnpm test`）：`tests/pane-render.spec.tsx` 装配**真实 ui-conversation**，同时渲染两个 pane，断言各自的 header/消息流/composer 属于**自己的**会话、且没有 `[data-slot-error]`。

**真机**（`.dev/scenario.mjs`）：对本地 0.1.5-alpha.1 实例用 Playwright 走完
"开会话 → 分屏 → 切侧边栏 → 点回第一个 pane"，输出每步截图 + console 错误 + 每个 pane 的
composer/header/crash 事实。已验证结果：分屏后左 pane 保持 pinned、右（焦点）pane 随侧边栏切换而换会话，两 pane 各有自己的 composer 与 header，无 crash 面、无 console 错误。

本地起实例（不碰日常 profile）：

```sh
npm install --prefix .devruntime @deepseek-ai/dsh@0.1.5-alpha.1
# profiles/<name>/package.json 的 bundles 里加 @dsh-external/dsh-split-panes，
# node_modules 里 junction 到本仓库
node .devruntime/node_modules/@deepseek-ai/dsh/lib/bin.js --profile panesdev --port 54999 --no-open
node .dev/scenario.mjs "http://127.0.0.1:54999/?token=<printed>"
```

## 14. 已知边界

1. **vendored 渲染器跟随上游**：靠 sync 脚本 + 漂移测试守门；上游若改 outlet 语义，测试会红，然后同步即可。
2. **root binding 是重建的**：0.1.5 实际只有 `sessions` / `sessionPendingInteraction` / `workspaces` / keyed `resource`；第三方新增 root 贡献会缺（不崩，只是没有该 seat）。
3. **`session.open()` 的窄化 cast**：唯一非公开触达点（`SessionFace` 类型不含 `open`）。
4. **拖拽/点击通道依赖侧边栏行 DOM**：`[role="treeitem"][draggable="true"]` + title cell 文本反查；侧边栏改版需跟进（`session-row.ts`）。
5. **store 实例**：插件接管期间只有 pane facade 创建；若将来放开"未分屏时交还核心"，同一 handle×session 可能出现两份实例（持久化键相同）。
6. **全屏单 pane**（OpenCode 有）：未实现，树结构已支持。

## 15. 文件地图

```
src/client/
  pane-host.ts          # 合成 SlotRendererHost（root 槽 / pane scope / store / abdication）
  PaneRoot.tsx          # 合成 root entry（一行 renderSlot('conversation')）
  PaneConversation.tsx  # 一个 pane 的渲染器实例（binding + host + renderRoot）
  root-binding.ts       # root standard-source binding（ctx.inject 反应式）
  pane-session.ts       # 非当前会话的 open()
  session-row.ts        # 侧边栏行的 drag/click 反查 + dataTransfer 类型
  PaneWorkspace.tsx     # 分屏树 / 焦点路由 / 拖拽 / 快捷键
  pane-layout-store.ts  # 分屏树 store（模块单例）
  SplitContainer.tsx / PaneDropOverlay.tsx / *Button.tsx（含 FullscreenPaneButton）/ icons.tsx / locales.ts
  vendor/renderer/      # 核心渲染器逐字节副本 + README（出处与同步说明）
scripts/sync-renderer-vendor.mjs      # 逐字节同步 vendored 渲染器（--check 只比对）
scripts/upgrade-core.mjs              # 一键升级：接触面判定 + 改 pin + 同步 +（可选）check
core-pin.json                         # 钉死的核心 tag/commit（build-release 读它，tracker 改它）
.github/workflows/upstream-track.yml  # 每 6h 检测上游、开跟踪 PR
tests/
  renderer-vendor.spec.ts  # 漂移守门
  upstream-track.spec.ts   # tracker/upgrade-core：变量名、步骤顺序、接触面覆盖、pin 格式
  pane-render.spec.tsx     # 真实 ui-conversation 装配下按 pane 渲染
  pane-workspace.spec.tsx  # 容器行为（分屏/焦点路由/拖拽/快捷键/侧边栏 click）
  apply.spec.tsx           # 注册面 + 拖拽通道
  pane-layout-store.spec.ts / split-pane-button.spec.tsx
```
