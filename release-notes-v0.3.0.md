## v0.3.0 — 纯扩展架构修正：捕获 ConversationRoot，不再复刻布局

重大架构修正。之前「接管 conversation 槽 + 自建渲染层 + 复刻布局」的方向被证明不可行，现已改为**纯扩展**的正确做法，端到端验证通过。

### 核心修正

**核心没有按 id 渲染的扩展点**（`ScopeBindingContext`/host 实例/renderArea 的内容 dispatch 都是包私有），而复刻 ConversationRoot 布局（hero/workspace picker/composer/测量/width handles）既不可能（内部组件和 CSS 不导出）也不可维护（395 行复杂逻辑）。

**正确做法**：**捕获原生 `ConversationRoot` 组件，喂给它 pane 会话的数据与 dispatch**——每个 pane 渲染真正的原生对话界面。

### 变更

- `PaneConversation`：捕获 `conversation` 槽的原生 `ConversationRoot` 条目（component + inject + locale），按 pane 会话通过 by-id kit 重新托管——**原生对话界面逐字节渲染**（hero、workspace picker、composer、消息流、width handles），只是 session 不同
- **复用 ConversationRoot 条目的 inject**（原生 `selectWorkspace` + `hooks.composerBlock`）——工作区选择逻辑无需重写
- `renderPane` 渲染 ConversationRoot（单窗格=current session，分屏=各 pane 自己的 session）；删除 `PaneBody`
- render-host 新增 `renderConversationRoot()`（选中非 takeover 的原生条目）、store/inject 缓存、owner props 合并、槽级 inject 工厂、memo/forwardRef 组件支持
- kit 的 absent hook 与渲染器 maybe-hook 语义一致（selector 不被调用——hero 态 `useSession`/`useConversation` 返回 undefined，不再报 `undefined.promptError`）

### 验证

- takeover 渲染原生 chrome（header + composer，无「未知 surface」）
- 分屏各 pane 渲染原生对话（15k+ HTML、分隔条、新建对话 hero、无 fallback）
- 31 tests 全绿，typecheck + build 通过

### 修复的历史问题

- 「首页新建对话只剩标题+按钮」→ ConversationRoot 的 hero 原生保留
- 「未知 surface 事件」→ chat node 的 memo 组件 + dispatch 修复
- 「丢失 composer/workspace picker」→ ConversationRoot 原生保留
- 「状态丢失」→ render-host 的 store/inject 缓存

纯扩展，免补丁。