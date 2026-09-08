[![dshfind](https://dshfind.com/api/card/lehhair/dsh-split-panes?lang=zh)](https://dshfind.com/zh/plugins/lehhair/dsh-split-panes?ref=badge)

# dsh-split-panes

DSH 对话分屏插件（PiUI 风格）：把信息流分成多个可独立操作的窗格，每个窗格绑定自己的会话——分屏/层叠、四向拖拽分配、侧边栏会话拖入、单行融合 header。信息流本体完全复用原生渲染（重新托管核心注册的原生组件），插件只做容器与交互。

**免补丁**：不再依赖任何核心源码补丁。插件通过核心**公开**的 slot 注册 / ui-session / sessions-service 面组装出按 id 渲染路径，直接运行于官方核心。

## 功能

- **分屏组合**：header 操作行分屏按钮 + `mod+shift+方向键`（左右/上下），`mod+shift+w` 关闭窗格；分隔条可拖拽、可键盘调节（比例 0.1–0.9）
- **每窗格独立会话**：每个窗格绑定各自的会话；分屏是**纯视图操作**——新窗格是"新建对话"占位（不创建 host 会话），在占位窗格里开始对话时才真正创建会话并绑定到该窗格，互不干扰
- **侧边栏拖拽分配**：把侧边栏会话拖到窗格上——中心落下替换该窗格会话，四条边缘落下向该侧分屏（被拖会话进新窗格，焦点跟随）；拖拽通道完全插件化（capture dragstart 反查）
- **原生视觉**：未分屏时逐字节等同原生（无边框、无 chrome）；分屏后窗格带焦点蓝边框（选中 `deepseek-500` / 未选中灰）；header 单行化 + PiUI 渐变 + 内容留白

## 效果预览

![dsh-split-panes 分屏效果](screenshots/split-panes.png)

## 架构（免补丁，纯扩展）

核心（≥ 0.1.3-alpha.1）的渲染器只把**当前选择**会话的 standard-source binding 提供给 slot 组件，**没有提供按任意 id 渲染的扩展点**（`ScopeBindingContext`/host 实例/renderArea 的内容 dispatch 都是包私有或不渲染内容）。插件因此**不自建渲染层、不复刻布局**，而是**捕获原生 `ConversationRoot` 组件，喂给它 pane 会话的数据与 dispatch**——每个 pane 渲染真正的原生对话界面。

| 核心公开面 | 插件用途 |
|---|---|
| `ctx.uiSession.adapter.resolve(id)` | 按 pane 会话解析其**完整 standard-source binding**（session/conversation/input hooks、projection keyed hooks、inputActions props）——by-id 数据底座 |
| `ctx.sessions.sessionOf(scopeCtx)` | 触发 pane 会话的 `open()`（幂等、与 stage 无关），拉取历史窗口与实时事件流 |
| `ctx.slots.entries('conversation')` | 捕获 **`ConversationRoot` 条目**（component + inject + locale）——**原生对话界面本身**，含 hero/workspace picker/composer/测量/width handles |
| `ConversationRoot 条目的 inject` | **复用原生 `selectWorkspace`**（工作区选择 + draft 迁移）与 `hooks.composerBlock`——不需要自己实现 |

- **`src/client/kit.ts`**：`buildPaneKit` 把 pane binding 的裸 observable 绑定成本插件的 uSES selector hooks（与官方 renderer 的 bind 契约一致，含 absent/maybe hook 语义），并触发会话打开
- **`src/client/render-host.tsx`**：捕获 `ctx.slots.entries()` 的条目，为每窗格重组其 kit + inject + store + 子槽 dispatch（`renderSlot`/`renderSlotChain`），包错误边界
- **`src/client/PaneConversation.tsx`**：一个 pane 的 `ConversationRoot` 渲染——memoize kit/host，调 `renderConversationRoot()` 捕获并渲染原生组件
- **`src/client/PaneWorkspace.tsx`**：注册为 `conversation` 槽的**低优先级影子**（slot shadow），只管分屏树/focus/拖拽调度；单窗格=渲染 ConversationRoot（current），分屏=分屏树（每 pane 渲染 ConversationRoot（pane session））
- **`src/client/pane-layout-store.ts`**：分屏树 store（split/close/ratio/splitPaneToSide），插件模块单例，跨会话共享

**每个 pane 渲染真正的 `ConversationRoot`**（原生对话界面），布局 100% 原生：hero、workspace picker、composer、消息流、测量、width handles 全部保留，只是 session 不同。无任何核心修改，无补丁。

## 安装

```sh
git clone https://github.com/lehhair/dsh-split-panes.git
dsh plugin --profile web add link:/path/to/dsh-split-panes
```

重启 `dsh web` 即可使用（右上角/header 出现分屏按钮）。

## 使用

- **分屏**：点 header 的分屏按钮，或拖侧边栏会话到对话区域边缘
- **替换**：拖侧边栏会话到窗格中心，替换该窗格会话
- **新建**：分屏出的新窗格是当前工作区的新建对话（相互独立），直接在窗格内开始对话
- **关闭**：窗格 header 的关闭按钮或 `mod+shift+w`

## 开发

```sh
pnpm install        # devDeps link 到 ../dsh2026/deepseek-harness（DSH 源码，需先构建其 client 包）
pnpm run check      # typecheck + test + build
```

- `src/client/`：浏览器半（槽位注册、分屏树 store、kit、render-host、拖拽、全局 chrome）
- `src/index.ts`：node 半（空）
- 构建产物 `lib/client.js` 由 harness 以 `/plugins/<id>/client.js` 提供

测试通过 vitest，resolve 到核心 `../dsh2026/deepseek-harness` 的 **src**（vitest.config.ts 的 alias），因此跑的是核心源码、非构建产物，能即时反映上游 API 变化。

## 布局

```
src/client/
  kit.ts                # 每窗格标准 kit（binding → selector hooks + ensure open）
  render-host.tsx       # 捕获原生条目 + 每窗格 inject/store/子槽 dispatch + 错误边界
  PaneBody.tsx          # 一个 pane 的原生会话正文（header + view + composer）
  PaneWorkspace.tsx     # conversation 槽影子：分屏树/单窗格、拖拽 drop、快捷键、focus
  pane-layout-store.ts  # 分屏树 store（split/close/ratio/splitPaneToSide）
  PaneDropOverlay.tsx   # 拖拽 drop-zone 高亮（ref 驱动）
  SplitContainer.tsx    # 分隔条容器（拖拽/键盘调节）
  SplitPaneButton.tsx / SplitVerticalButton.tsx / ClosePaneButton.tsx  # header 按钮
  PaneGlobal.module.css # 插件全局 chrome（单行 header、渐变、内容留白、侧边栏融合）
```

## License

BSD-3-Clause

## 友情链接 / Friend Links

- [DSHFind](https://dshfind.com/) — DeepSeek Harness 插件市场与学习社区
