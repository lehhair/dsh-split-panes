[![dshfind](https://dshfind.com/api/card/lehhair/dsh-split-panes?lang=zh)](https://dshfind.com/zh/plugins/lehhair/dsh-split-panes?ref=badge)

# dsh-split-panes

DSH 对话分屏插件（PiUI 风格）：把信息流分成多个可独立操作的窗格，每个窗格绑定自己的会话——分屏/层叠、四向拖拽分配、侧边栏会话拖入。**每个窗格都跑核心自己的渲染器**，插件只提供容器、焦点路由与交互。

**免补丁**：不修改、不重打包核心。插件把核心的 slot 渲染器（`createSlotRenderer`）**逐字节 vendor** 进仓库，给每个 pane 构造一个 **pane 作用域的 host**（`SlotRendererHost` 是公开接口），于是核心的 outlet 用这个 pane 的 session binding 渲染——header / 消息流 / composer / hero 全部是核心代码。

## 功能

- **分屏组合**：header 分屏按钮 + `mod+shift+方向键`（左右/上下），`mod+shift+w` 关闭窗格；分隔条可拖拽、可键盘调节（比例 0.1–0.9）
- **窗格全屏**：pane header 的全屏按钮把该窗格铺满整列，**分屏树原样保留**；再点一次或按 `Esc` 退出，精确回到分屏状态
- **每窗格独立会话**：每个 pane 绑定各自的会话；分屏是**纯视图操作**——新窗格是"新建对话"占位（不创建 host 会话），在占位里选工作区才真正创建会话并绑定到该 pane
- **焦点即全局选中（OpenCode 模型）**：点 pane → 它成为焦点并让全局选中跟随（侧边栏高亮同步）；点侧边栏会话 → **改的是焦点 pane 的内容**，其余 pane 保持 pinned
- **侧边栏拖拽分配**：拖会话到 pane 中心=替换，四条边缘=向该侧分屏（拖拽通道完全插件化：capture 阶段反查行 DOM）
- **原生视觉**：单窗格时逐字节等同原生（无边框无 chrome）；分屏后焦点 pane 带品牌蓝边框

## 效果预览

![dsh-split-panes 分屏效果](screenshots/split-panes.png)

## 为什么需要 vendor 核心渲染器

核心**没有**"按任意 session id 渲染"的扩展点（详见 `docs/ARCHITECTURE.md` §2：`ScopeProvider` 硬编码 `adapter.current`，binding context 私有、`installScope` 一次性、`renderSlot()` 只允许 `'root'`、`SlotScope` 是封闭联合）。

但核心**公开了渲染器的输入契约** `SlotRendererHost`：

```
renderRoot(host)
 ├─ HostContext.Provider(host)
 ├─ RootStandardProvider        ← 读 host.root
 ├─ ScopeProvider               ← 读 host.scope('session').current   ★ 决定 binding
 └─ RootOutlet                  ← 读 host.entriesOfSlot('root')
```

**host 由调用方提供**。所以每个 pane 用一个合成 host（`scope('session')` 指向本 pane 的 binding、`entriesOfSlot('root')` 返回一个只有一行 `renderSlot('conversation')` 的合成 root、`entriesOfSlot('conversation')` 过滤掉插件自己的影子），核心渲染器就把原生会话渲染进这个 pane 了。

`createSlotRenderer` 没有从已发布的 `@deepseek-ai/dsh-client-ui-renderer` 导出（npm 包只带 `lib/`），所以渲染器源码 vendor 进 `src/client/vendor/renderer/`，由 `scripts/sync-renderer-vendor.mjs` 同步、`tests/renderer-vendor.spec.ts` 逐字节守门。

## 安装

```sh
git clone https://github.com/lehhair/dsh-split-panes.git
dsh plugin --profile web add link:/path/to/dsh-split-panes
```

重启 `dsh web` 即可使用（会话 header 出现分屏按钮）。

**版本**：开发与测试基线是核心 **`0.1.5-alpha.2`**（vendor 的渲染器副本来自该版本；alpha.2 引入的 `main` 面板模型已适配）。`0.1.2-rc.1` 也实测可用（分屏 / 双 pane 各自会话 / 焦点路由 / 拖拽），0.1.5 才有的东西（右侧栏等）在该版本上不存在，插件优雅降级。

上游跟踪：`.github/workflows/upstream-track.yml` 每 6 小时检测核心新 release，**只在**上游真正触碰本插件消费的接触面（`ui-renderer` 渲染器文件 + `ui-conversation`/`ui-session`/`ui-layout` 契约）时才开升级 PR（全绿才开）；发版仍由人工合 PR 后执行。本地一键：`pnpm run upgrade:core dsh-vX.Y.Z`。想验证"开 PR"那半边链路（定时路径平时走不到），手动 dispatch 加 `force: true`。

## 使用

- **分屏**：点会话 header 的分屏按钮，或 `mod+shift+←/→`（左右）、`mod+shift+↓`（上下）
- **切会话**：点 pane 让它成为焦点，然后在侧边栏点另一个会话 → 焦点 pane 换成它
- **替换**：拖侧边栏会话到窗格中心
- **新建**：分屏出的新窗格是当前工作区的新建对话，直接在窗格内选工作区开始
- **关闭**：窗格 header 的关闭按钮或 `mod+shift+w`
- **全屏**：点窗格 header 的全屏按钮（或全屏后按 `Esc` 退出）

## 开发

```sh
pnpm install          # devDeps link 到 ../dsh2026/deepseek-harness（核心源码）
pnpm run check        # vendor 漂移检查 + typecheck + test + build
```

- `src/client/`：浏览器半（slot 注册、分屏树 store、pane host facade、拖拽、焦点路由）
- `src/client/vendor/renderer/`：核心 slot 渲染器的逐字节副本（不要手改，用 `pnpm run vendor:renderer`）
- `src/index.ts`：node 半（空）
- 构建产物 `lib/client.js` 由 harness 以 `/plugins/<id>/client.js` 提供

测试跑 vitest，resolve 到核心 `../dsh2026/deepseek-harness` 的 **src**（`vitest.config.ts` 的 alias），因此跑的是核心源码、非构建产物，能即时反映上游 API 变化。

真机验证脚本（本地）：`.dev/scenario.mjs` 用 Playwright 驱动真实浏览器完成"开会话 → 分屏 → 切侧边栏 → 点回第一个 pane"，输出截图与 console 错误。

## 布局

```
src/client/
  pane-host.ts          # 合成 SlotRendererHost（root 槽 / pane scope adapter / store / abdication）
  PaneRoot.tsx          # 合成 root entry：一行 renderSlot('conversation')
  PaneConversation.tsx  # 一个 pane：binding + host + 核心渲染器
  root-binding.ts       # root standard-source binding（按 ctx.inject 反应式补齐 workspaces/resources）
  pane-session.ts       # 非当前会话的窗口打开（session.open）
  session-row.ts        # 侧边栏会话行的 drag / click 反查
  PaneWorkspace.tsx     # 分屏树 / 焦点路由 / 拖拽 / 快捷键（无对话布局）
  pane-layout-store.ts  # 分屏树 store（模块单例）
  SplitContainer.tsx    # 分隔条容器
  PaneDropOverlay.tsx   # 拖拽 drop-zone 高亮
  SplitPaneButton.tsx / SplitVerticalButton.tsx / FullscreenPaneButton.tsx / ClosePaneButton.tsx
  vendor/renderer/      # 核心渲染器逐字节副本（bind.ts / bindings.tsx / scoped-slots.tsx）
```

## License

BSD-3-Clause（与核心渲染器副本同许可）

## 友情链接 / Friend Links

- [DSHFind](https://dshfind.com/) — DeepSeek Harness 插件市场与学习社区
