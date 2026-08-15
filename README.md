# dsh-split-panes

DSH 对话分屏插件（PiUI 风格）：把信息流分成多个可独立操作的窗格，每个窗格绑定自己的会话——分屏/层叠、四向拖拽分配、侧边栏会话拖入、单行融合 header。信息流本体完全复用原生渲染，插件只做容器与交互。

## 功能

- **分屏组合**：header 操作行分屏按钮 + `mod+shift+方向键`（左右/上下），`mod+shift+w` 关闭窗格；分隔条可拖拽、可键盘调节（比例 0.1–0.9）
- **每窗格独立会话**：通过框架的 `SessionScope` 座位把每个窗格绑定到各自的会话；分屏是**纯视图操作**——新窗格是"新建对话"占位（不创建 host 会话），在占位窗格里开始对话时才真正创建会话并绑定到该窗格，互不干扰
- **侧边栏拖拽分配**：把侧边栏会话拖到窗格上——中心落下替换该窗格会话，四条边缘落下向该侧分屏（被拖会话进新窗格，焦点跟随）；拖拽通道完全插件化（capture dragstart 反查）
- **原生视觉**：未分屏时逐字节等同原生（无边框、无 chrome）；分屏后窗格带焦点蓝边框（选中 `deepseek-500` / 未选中灰）；header 单行化 + PiUI 渐变 + 内容留白

## 效果预览

![dsh-split-panes 分屏效果](screenshots/split-panes.png)

## 前置：渲染器会话绑定能力

分屏的核心依赖渲染器能**按 id 绑定会话**（`SessionScope` 全局座位 + by-id 座位）以及包裹原生会话列的 `conversation.panes` 缝。**官方 DeepSeek Harness（含当前 `0.1.0-rc.5` 发行版）尚未内置这两项能力**（提案已发官方讨论区：[deepseek-harness/discussions/604](https://github.com/deepseek-ai/deepseek-harness/discussions/604)），安装插件前需要运行环境具备它们：

| 方式 | 说明 |
|---|---|
| **官方合入后** | 纯插件安装，无需任何前置（讨论帖 604 推进中） |
| **带能力的 DSH** | 使用已内置该能力的内测发行版 |
| **渲染器补丁** | 对官方 `0.1.0-rc.5` 基线应用 `patches/dsh-session-scope-and-panes-rc5.patch`（约 500 行纯新增，应用方法见 [patches/README](patches/README.md)） |

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

- `src/client/`：浏览器半（槽位注册、分屏树 store、拖拽、全局 chrome）
- `src/index.ts`：node 半（空）
- 构建产物 `lib/client.js` 由 harness 以 `/plugins/<id>/client.js` 提供

## 布局

```
src/client/
  PaneWorkspace.tsx        # 槽位入口：单窗格/分屏树、拖拽 drop、SessionScope 绑定
  pane-layout-store.ts     # 分屏树 store（split/close/ratio/splitPaneToSide）
  PaneDropOverlay.tsx      # 拖拽 drop-zone 高亮（ref 驱动）
  SplitContainer.tsx       # 分隔条容器（拖拽/键盘调节）
  global-seats.ts          # GlobalStandardProps 类型合并（SessionScope/by-id 座位）
  PaneGlobal.module.css    # 插件全局 chrome（单行 header、渐变、内容留白、侧边栏融合）
patches/
  dsh-session-scope-and-panes-rc5.patch   # 核心能力补丁（官方 rc.5 基线，应用方法见 patches/README.md）
  dsh-renderer-session-scope-0809.patch   # 存档：旧快照（20260807）参考
```

## License

BSD-3-Clause

## 友情链接 / Friend Links

- [DSHFind](https://dshfind.com/) — DeepSeek Harness 插件市场与学习社区

