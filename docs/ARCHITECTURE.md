# dsh-split-panes 架构设计文档

> 纯扩展（免补丁）实现 DSH Web 客户端多窗格分屏对话的完整技术方案。
> 适用核心版本：`0.1.3-alpha.1+`。插件版本：`v0.4.0`。

---

## 1. 目标与约束

### 1.1 产品目标

在 DSH Web GUI 中实现 PiUI 风格的对话分屏：

- **分屏组合**：header 操作行分屏按钮 + `mod+shift+方向键`（左右/上下），`mod+shift+w` 关闭窗格；分隔条可拖拽/键盘调节
- **每窗格独立会话**：每个 pane 绑定各自的会话；新分出的 pane 是"新建对话"占位（不创建 host 会话），在占位里开始对话才真正创建并绑定
- **焦点同步**（OpenCodeUI 模型）：点击 pane → 全局 current 跟随该 pane 的会话（侧边栏高亮同步）；点侧边栏会话 → 新会话路由到**焦点 pane**，其余 pane 保持 pinned
- **侧边栏拖拽分配**：拖会话到 pane 中心=替换，四条边缘=向该侧分屏（会话进新 pane）
- **信息流本体 100% 复用原生渲染**：插件只做容器与交互，pane 内的 header/消息流/composer/hero 全部是核心原生组件

### 1.2 硬约束（调研结论）

| 约束 | 内容 |
|---|---|
| **免补丁** | 不修改核心源码（不重打包、不 patch dist） |
| **核心无 by-id 渲染扩展点** | 见 §2 的穷尽调研——这是整个设计最大的前提 |
| **纯公开面** | 只用 `ctx.*` 服务、slot registry、捕获的注册条目 |

---

## 2. 核心渲染机制调研（为什么必须走"捕获组件"这条路）

### 2.1 核心渲染器的工作方式

核心 Web 界面由 slot 系统装配：

```
ctx.slots.renderSlot('root')                     ← 唯一 ctx 级渲染入口
  └─ ScopeProvider(scope='session-maybe')        ← 提供 scope binding
       └─ AppFrame（root 槽，ui-layout 注册）
            ├─ sidebar 槽（侧边栏）
            ├─ conversation 槽（session-maybe，ui-conversation 注册 ConversationRoot）
            │    └─ ConversationRoot（原生对话界面组件）
            │         ├─ renderSlot('conversation.session.header')  header
            │         ├─ renderSlot('conversation.session')          消息流
            │         │    └─ renderSlot('conversation.view') → ChatView
            │         │         └─ renderSlot('conversation.chat.node', {entryKey})  keyed
            │         ├─ renderSlotChain('conversation.composer')    composer 链
            │         └─ conversation.hero.*                         hero
            └─ details 槽
```

**关键**：所有 session-scoped 槽的渲染 props（`useSession`/`useConversation`/`useInput`/`inputActions`…）来自 **`ScopeProvider` 的 binding**，而 `ScopeProvider` 硬编码使用 `adapter.current`——**当前选中会话**。

### 2.2 穷尽调研：核心没有按 id 渲染的扩展点

这是整个设计的最重要结论。逐项验证过：

| 机制 | 状态 | 结论 |
|---|---|---|
| `ScopeBindingContext` / `RootBindingContext` | `bindings.tsx` 内 `const`，**不导出** | 无法给核心渲染树提供自定义 binding |
| `ScopeProvider` | 硬编码 `adapter.current` | 只能渲染当前会话 |
| `SlotRendererHost`（`storeOf`/`entriesOfSlot`/`specOf`/`scope()`） | 类型公开，**实例私有**（`SlotRegistry.hostFace` 是 private getter） | 拿不到 host 实例 |
| `ctx.slots.install(renderer)` | **boot-once**（二次 install 抛错），核心 boot 已装 `createSlotRenderer()` | 不能替换渲染器/包装捕获 host（test-runtime 的捕获手法在生产不可用） |
| `ctx.slots.renderSlot(key)` | ctx 级**只允许 'root'** | 无法直接渲染 conversation 子树 |
| `adapter.renderArea(binding, props)` | 接受 binding，但只是 `<Fragment key={sessionId}>`（key remount + empty 分支） | **不渲染 slot 内容**，只是个 keyed fragment |
| `createSlotRenderer()` | 经 `./src/*` 导出可达，但需要 host 参数 | 有 renderer 没 host 依然无法 dispatch |
| `ConversationRoot`/`HeroShell`/`WorkspaceChip`/`WidthHandle` 组件 | **ui-conversation 内部组件，不导出** | 无法直接 import 渲染 |

结论：**上游讨论 #604 提的三个扩展点（`ISessions.session(id)`、`SessionScope`、`conversation.panes` 缝）在新核心全部不存在**。曾经有效的老版本（v0.1.0）正是依赖补丁提供的 `SessionScope` + `conversation.panes` 缝。

### 2.3 但是——核心渲染器把组件放在了公开的账本上

虽然渲染器是私有的，**所有原生 UI 组件都注册在 slot ledger 上**，而 ledger 是公开的：

- `ctx.slots.entries(key)` → 该槽全部注册条目（`StoredEntry`：`component`、`inject`、`store`、`locale`、`options.key/id/order/priority`）
- `ctx.slots.entriesOfSlot(key)` → shadowing 赢家
- `ctx.slots.spec(key)` → 槽声明（kind/scope/children/slot 级 inject）
- `ctx.uiSession.adapter.resolve(id)` → **任意会话的完整 standard-source binding**（`{ key, ctx, hooks, keyedHooks, props }`）——渲染级数据底座，by-id 渲染的原料核心是给的
- `entry.inject(sessionId, actions)` → 条目的注入面（官方测试 `apply-inject` 自己就用这个手法断言）
- `storeHandle.create(sessionId)` → per-session store 实例（与渲染器 host 的 `storeOf` 同语义）

**于是唯一可行的纯扩展路线浮现了：**

> 核心渲染器 = dispatch 机制（私有）+ 组件账本（公开）+ 数据绑定（by-id 可解析）。
> 我们**不重写组件、不复刻布局**，而是**接管"dispatch"这一层**：自己实现一个
> 按会话解析的迷你渲染器，把账本上的原生组件"喂"给 pane 会话的数据。

---

## 3. 总体架构

```
接管 conversation 槽（注册 PaneWorkspace，priority -1，shadow 原生 ConversationRoot）
  ↓
PaneWorkspace（纯调度：分屏树 + 焦点同步 + 拖拽，不含任何对话布局）
  ├─ 单窗格：renderPane(current) ──────────┐
  └─ 分屏：SplitContainer                   │
       └─ 每个 PaneFrame：renderPane(pane.sessionId ?? undefined) ─┤
                                                                    ↓
                                            PaneConversation（memo，kit/host 按 session 缓存）
                                                                    ↓
                                            renderConversationRoot()
                                            = 从 entries('conversation') 选取
                                              非本插件 takeover 的原生条目
                                                                    ↓
                                    ConversationRoot（原生组件，完整原生布局逐字节渲染）
                                        props = by-id kit + 原生 inject + 我们的 dispatch
                                        ├─ 原生 header（crumbs/tabs/actions）
                                        ├─ 原生消息流（conversation.view → ChatView → chat.node）
                                        ├─ 原生 composer（chain → composer.bar → InputBar）
                                        └─ 原生 hero（HeroShell/workspace picker/agentPreset）
```

三个职责层：

| 层 | 文件 | 职责 |
|---|---|---|
| **数据层** | `kit.ts` | 把 `adapter.resolve(id)` 的 binding 组装成 pane 的标准 kit（uSES selector hooks），处理 absent/maybe 语义，触发会话 open |
| **dispatch 层** | `render-host.tsx` | 复刻核心渲染器的 slot dispatch（single/keyed/chain/list + owner 合并 + slot 级 inject 工厂 + store/inject 缓存 + 错误边界），并提供 `renderConversationRoot()` 渲染原生根组件 |
| **容器层** | `PaneWorkspace.tsx` | 分屏树渲染、焦点↔current 同步、拖拽分配、快捷键、header 按钮（**不含任何对话布局**） |

---

## 4. 数据层：`kit.ts`（by-id 标准 kit）

### 4.1 binding 解析与缓存

```ts
buildPaneKit(ctx, sessionId):
  binding = sessionId === undefined ? undefined
          : ctx.uiSession.adapter.resolve(sessionId)   // 按任意 id 解析渲染级 binding
  ensurePaneSessionOpen(ctx.sessions, binding)          // 触发 open() 拉历史窗口
```

- `adapter.resolve(id)` 内部会 lazy mint session scope（列表内会话均 eligible）并 materialize **全部 provide descriptors**（ui-conversation 的 conversation/input、ui-chat 的 chat 等）——**这正是核心渲染器给当前会话渲染时用的同一份 binding**，身份稳定（ui-session 按 sessionId 缓存）
- **历史窗口**：非 current 会话不被框架 staging（staging 跟随 `list.current`），pane 必须自己触发 `session.open()`（幂等、与 stage 无关）；Session face 经 `sessions.sessionOf(binding.ctx)` 解析，`open` 用窄化 cast（公开契约刻意不含 staging bridge）

### 4.2 kit 组装（镜像渲染器的 `{...root, ...session}` 合成顺序）

```
ROOT 标准源（渲染器的 provideRoot 贡献，就是服务本身）：
  hooks.sessions                  = ctx.sessions.list
  hooks.sessionPendingInteraction = ctx.uiSession.pendingInteractions
  hooks.workspaces                = ctx.workspaces.list（守卫式读取）

SESSION binding（若 binding 存在）：
  props      原样展开（inputActions、sessionId…）
  hooks      每个 source → bindSelector(source)（uSES selector hook）
  keyedHooks 每个 source → (key, selector) => bindSelector(source(key))(...)
```

**关键语义 1 — absent/maybe hook**：会话未绑定时（hero pane），`useSession`/`useConversation`/`useInput` 等**必须是函数**且**selector 永不被调用**（返回 undefined）——这是核心 `maybeObservableHook`/`useAbsentSnapshot` 的语义。如果 absent hook 去调 `selector(undefined)`，`InputBar` 的 `useSession(s => s.promptError)` 会变成 `undefined.promptError` 崩溃。

**关键语义 2 — hook 调用数恒定**：composer.bar 是 session-maybe 槽，其 `InputBar` 组件实例**跨 hero/active 转换保持**（核心设计："inert is a prop, not a different tree"）。因此 keyed hook（`useProjection`）的 absent 分支**也必须调用 uSES**（订阅 absent source），绝不能走"只返回值不订阅"的捷径——否则组件跨状态转换时 hook 调用数变化，React hook 链损坏（`Cannot read properties of null (reading 'destroy')`）。

**关键语义 3 — uSES 订阅契约**：`subscribe` 必须返回 unsubscribe 函数（React 清理时调用）；我们自建的 `ABSENT_SOURCE` 与核心的 `ABSENT_NOTICES` 等都满足。

### 4.3 缓存策略

kit 和 host 由 `PaneConversation` 用 `useMemo`（依赖 `[ctx, sessionId]`）缓存：

- kit 内的 selector hooks 身份稳定 → 子组件不换订阅
- pane 会话切换时 sessionId 变化 → kit 重建（hooks 随新 binding 的 source 重建）——**与核心行为一致**（核心渲染器同样是 binding 变化 → kit 重新合成 → source 变 → hook 变，组件实例保持）

---

## 5. dispatch 层：`render-host.tsx`（按会话解析的迷你渲染器）

这是整个方案最复杂的一层：**完整复刻核心渲染器的 dispatch 语义**。每一项都对应官方 `scoped-slots.tsx` 的一个机制：

### 5.1 dispatch 形态

```ts
renderSlot(key, owner, opts?)        // single / keyed(entryKey) / only(id) / list
renderSlotChain(key, owner, opts?)   // chain：遍历条目跑 select(owner)，第一个非 null 胜出
```

- **条目来源**：`ctx.slots.entries(key)`（读活账本，注册到达即出现）
- **解析过滤**：`component` 接受 function / class / **memo()·forwardRef() 对象**（`typeof 'object'` 的 React 元素包装器——只查 function 会把核心大量 memo 组件全部过滤掉，这正是 v0.2.x "未知 surface 事件"的根因）
- **错误边界**：每个 occupant 的渲染包 `PaneBoundary`（class boundary），单条目崩溃退化为 fallback 而非拖垮整个 pane

### 5.2 props 合成顺序（严格镜像官方 outlet）

```
1. kit.props                    （binding 的 plain props：inputActions…）
2. entry.inject(sessionId, actions) 的 face
   hooks/keyedHooks 隔离间 → standardHookPropName 绑定成 use<Name>
   【缓存 per (entry, sessionId)】——官方渲染器同样 memoize inject face，
   保证注入回调身份稳定、keyed hook 家族不抖动订阅
3. store 实例（若条目声明）
   handle.create(sessionId) 【缓存 per (handle, sessionId)】
   → useStore（uSES over 实例）+ actions
4. 全局标准座位：sessionId/useSession/useSessions/useProjection
   + kit.hooks 全量（undefined 的跳过——absent 语义由 kit 保证是函数）
5. locale t seat（条目声明 locale: NS 时，ctx.locale.bind(NS)）
   ——渲染器只为声明了 locale 的条目合成 t，漏声明 = "t is not a function"
6. slot 级 inject（槽 SPEC 上的 inject，非条目的）：
   固定成员直接并入；函数成员 = 工厂，按本次 dispatch 的 hookContext 绑定
   （chat node 的 useTurnData 走这里）
7. owner props 最后并入（胜出）——chat node dispatch 传的 node/selectedCallId/cwd…
   【教训：漏掉这步 → ToolCallTree 读 node.data 崩】
8. renderSlot / renderSlotChain（我们的递归 dispatch）
```

### 5.3 slot 级 inject 工厂（hookContext）

槽 SPEC 的 `inject.hooks` 成员若为函数，是 `(standard, hookContext) => hook` 工厂。官方在每次 dispatch 发生时用该次调用的 `hookContext` 绑定（`bindSlotHookFactories`）。我们的 dispatch 把 `opts.hookContext` 原样传入工厂——例如 ChatNodeSeat 调 `renderSlot('conversation.chat.node', owner, { entryKey, hookContext: turnData })`，工厂产出 `useTurnData` 闭包捕获该次 turn 的 data store。

### 5.4 `renderConversationRoot()`——捕获原生对话界面

```ts
// 从 conversation 槽选取"非 takeover"的原生 ConversationRoot 条目：
slots.entries('conversation')
  .find(raw => (raw.options?.priority ?? 0) > TAKEOVER_PRIORITY)   // -1 是我们自己
→ resolveOccupant(entry)
→ occupant.render(mount, renderChild, {}, EMPTY_SLOT_INJECT, undefined)
```

- **为什么可行**：ConversationRoot 的全部 props（`ConversationSlotProps` = PropsRuntime + PropsRenderSlots + InjectFace + PropsLocale）都能由我们的 kit + 条目 inject + 我们的 dispatch 组装
- **为什么 100% 原生**：hero 的 HeroShell/workspace picker、active 的 header/消息流/composer、测量（seatObserver/rootObserver）、width handles——**全部是 ConversationRoot 组件自己的代码**，我们一行都没碰
- **复用原生 inject**：ConversationRoot 条目自己的 `inject(sessionId)` 返回 `{ selectWorkspace, hooks.composerBlock }`——**工作区选择 + draft 迁移逻辑直接复用**，零重写
- **无递归**：ConversationRoot 内部只调 `renderSlot('conversation.session.*')` 等子槽，从不调 `renderSlot('conversation')`，而我们的 dispatch 对子槽按 pane 会话解析——不会绕回 takeover 自己

---

## 6. 容器层：`PaneWorkspace.tsx`（分屏树 + 焦点同步）

### 6.1 分屏树（`pane-layout-store.ts`）

模块级单例 store（**不是** per-session slot store——分屏树是全局视图态，跨会话切换保持）：

```ts
PaneNode = leaf { id, sessionId | null } | split { id, direction, ratio, first, second }
actions: focusPane / splitPane / splitPaneToSide / closePane / setRatio / setPaneSession
```

- split：原 pane 保留会话（单窗格时锚定 current），新 pane 为**占位**（null = hero），焦点移到新 pane——**纯视图操作，不创建 host 会话**
- `splitPaneToSide`：四向拖拽分配，被拖会话进新 pane
- 树渲染：递归 CSS grid + 拖拽分隔条（拖动中直接写 DOM grid-template，松手一次性 commit ratio——大对话树不重渲染）

### 6.2 焦点 ↔ current 同步（OpenCodeUI 模型）

```
点 pane（onPointerDown）：
  focusPane(pane.id)
  + openSession(pane.sessionId)          ← 全局 current 跟随（侧边栏高亮同步）

点侧边栏会话（current 变化）：
  effect: 若分屏中 → setPaneSession(focusedPaneId, current)
                              ↑ 焦点 pane 采纳新会话，其余 pane 保持 pinned
```

- `focusedPaneId ?? 第一个 leaf` 兜底
- 单窗格时 pane 内容直接渲染 current（leaf.sessionId 为 null → renderPane(current)），无需同步
- hero pane（null）点击不 open（无会话可开），保持全局选择不动

### 6.3 每 pane 的渲染

```
PaneFrame（分屏 pane）:  renderPane(leaf.sessionId ?? undefined, leaf.id)
SinglePane（单窗格）  :  renderPane(leaf.sessionId ?? current,  leaf.id)
```

- `renderPane` → `PaneConversation`（memo，key = pane id 稳定 / sessionId 变化触发 kit 重建）
- hero pane（sessionId undefined）→ ConversationRoot 自己走 hero 分支（HeroShell + workspace picker + composer hero variant）——**新建对话 pane 的 UI 完全是原生的**
- pane 外框（焦点蓝边框/拖拽 drop zone/新对话 header）是插件仅有的自有 chrome

---

## 7. 注册面（`index.ts`）

```
inject = ['slots', 'locale', 'sessions', 'uiSession', 'workspaces']
                    ↑ cordis 严格模式：未 inject 的服务 getter 直接抛错

1. conversation 槽 takeover（priority -1，shadow 原生 ConversationRoot）
   - 无 store seat（分屏树是模块单例，经 inject 下发）
   - inject 返回 operations：openSession/splitWithNew/splitFocused/
     closeFocused/hasSplit/usePaneStore/paneActions/renderPane

2. conversation.session.header.actions（list，session scope）
   - 三个按钮：panes-split / panes-split-v / panes-close
   - 每个都声明 locale: NS（渲染器只为声明 locale 的条目合成 t）
   - 无 store seat（跨 scope 共享 handle 会被框架 handle-scope pin 拒绝；
     按钮经 inject 闭包操作共享树）

3. 拖拽通道（document dragstart capture）
   - 侧边栏会话行自身不带 session id 的 dataTransfer；
     插件在 capture 阶段反查行 DOM × 会话花名册回填 payload
```

**卸载语义**：takeover 是 slot shadow——插件卸载后 priority -1 条目消失，原生 ConversationRoot（priority 0，一直在账本上）自动恢复渲染，GUI 逐字节回原。

---

## 8. 踩坑全记录（每个都是官方隐含契约）

| 症状 | 根因 | 教训 |
|---|---|---|
| "未知 surface 事件"（chat node 全 fallback） | `typeof component !== 'function'` 把 **memo()/forwardRef() 对象**全过滤了 | React 组件有函数/类/memo 对象三种形态，条目解析必须都接受 |
| ToolCallTree `node.data` 崩 | dispatch **丢弃了 owner 参数** | 官方 outlet 的合并顺序：owner 最后并入**胜出** |
| chat node 的 useTurnData 缺失 | 槽 **SPEC 上的 inject**（工厂 + hookContext）没处理 | slot 级 inject ≠ 条目 inject；工厂按次绑定 hookContext |
| `t is not a function` | 渲染器**只为声明 locale 的条目**合成 t | 条目注册必须带 `locale: NS` |
| `cannot get property "workspaces" without inject` | cordis 严格模式：未 inject 的服务 getter 抛错 | inject 列表必须覆盖所有读取的 ctx 服务 |
| `undefined.promptError` | absent hook 去调 selector | 核心也许 hook **selector 永不被调用**（直接返回 undefined） |
| `Cannot read properties of null (reading 'destroy')` | keyed hook 的 absent 分支**不调 uSES**，InputBar 跨 hero/active 转 hook 数变化 | session-maybe 组件实例跨态保持 → **hook 调用数必须恒定**，absent 也订阅 absent source |
| 输入框时有时无 / "panel 内不变" | 上两条的间接表现（PaneBoundary fallback 吞掉崩溃） | pane 内任何崩溃都表现为"内容消失"，必须从 hook 契约层根治 |
| 首页新建对话丢失 hero/workspace picker | 曾接管 conversation 槽并**复刻** ConversationRoot 布局 | 内部组件/CSS 不导出，复刻不可行→必须捕获组件本体 |
| store/inject 状态丢失 | 每次 render 重建实例/face | 必须 per (handle, sessionId) / (entry, sessionId) 缓存，对齐官方 host.storeOf 语义 |

---

## 9. 已知边界

1. **模拟 dispatch 的本质**：复用的是官方**组件本体**，但驱动机制（kit + dispatch）是按官方契约重建的。官方渲染器未来若增加隐含契约（新的合成顺序/新 seat），需同步跟进——本文件 §5.2 的顺序表就是跟进清单。
2. **单窗格也有 takeover**：未分屏时 conversation 槽由 PaneWorkspace 渲染 → ConversationRoot（current）。多一层组件壳，视觉逐字节等同（DOM 上多一层 `singleSurface` 容器）。
3. **store 生命周期**：per-(handle, sessionId) 缓存目前不随会话删除清理（WeakMap 以 handle 为根，handle 活着则实例缓存活）。长期可挂会话 prune 钩子。
4. **拖拽 payload**：依赖侧边栏行 DOM 结构反查（`:scope > span` 文本 × displayTitle），核心侧边栏改版需跟进。
5. **全屏单 pane**（OpenCodeUI 有）：未实现，树结构已支持（单 leaf 即全屏语义），可作为后续增量。

---

## 10. 与老版本（v0.1.0，补丁版）的对照

| | v0.1.0（补丁） | v0.4.0（纯扩展） |
|---|---|---|
| 渲染机制 | 补丁给核心加 `SessionScope`（按 id 渲染）+ `conversation.panes` 缝（包裹原生）；插件只包裹 + 换 session | 插件捕获账本上的原生组件，自建 by-id dispatch 喂数据 |
| 组件所有权 | 核心（渲染器 dispatch） | 组件仍核心；dispatch 是插件按官方契约重建 |
| 维护成本 | 补丁需随核心 rebase（2917+ commits/月） | 契约层跟进（§5.2 清单） |
| 上游合流 | #604 合入后补丁即 no-op | #604 合入后可整体切换到官方机制，dispatch 层可退役 |

---

## 11. 文件地图

```
src/client/
  kit.ts                 # 数据层：by-id binding → 标准 kit（uSES hooks + maybe 语义 + open）
  render-host.tsx        # dispatch 层：迷你渲染器（合成顺序/缓存/slot inject/renderConversationRoot）
  PaneConversation.tsx   # 单 pane：memo(kit/host) + 渲染原生 ConversationRoot
  PaneWorkspace.tsx      # 容器层：单窗格/分屏树 + 焦点同步 + 拖拽 + 快捷键（无对话布局）
  pane-layout-store.ts   # 分屏树 store（模块单例）
  SplitContainer.tsx     # 递归 grid 分隔条（拖拽直写 DOM，松手 commit）
  PaneDropOverlay.tsx    # 拖拽 drop-zone（ref 驱动，不重渲染 pane 子树）
  SplitPaneButton.tsx / SplitVerticalButton.tsx / ClosePaneButton.tsx
  icons.tsx / locales.ts
tests/
  pane-layout-store.spec.ts    # 树操作语义
  pane-workspace.spec.tsx      # 容器行为（split/焦点路由/拖拽/快捷键）
  pane-render-host.spec.tsx    # 真实装配渲染 ConversationRoot（header/composer/chat view）
  pane-dispatch.spec.tsx       # dispatch 回归（owner 合并 + hookContext 工厂）
  apply.spec.tsx               # 注册/shadow/drag 通道
  split-pane-button.spec.tsx
```
