window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-split-panes",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/pane-layout-store.ts
		/**
		* Pane-layout store: one split-pane tree per session. Splitting CLONES the
		* single-pane conversation: the original pane keeps the current session, and
		* the new pane is a fresh new-conversation entry (null session) that binds
		* the session it starts. Pane state is viewing state — sessions themselves
		* live in the object layer, never here.
		*/
		/** Ratio bounds for the divider drag/keyboard (PiUI parity: a pane can shrink to 10% but never collapse). */
		const MIN_RATIO = .1;
		const MAX_RATIO = .9;
		let paneSeq = 0;
		let splitSeq = 0;
		const genPaneId = () => `pane-${++paneSeq}`;
		const genSplitId = () => `split-${++splitSeq}`;
		/** Collect every leaf id in tree order. */
		function allLeaves(node) {
			if (node.type === "leaf") return [node];
			return [...allLeaves(node.first), ...allLeaves(node.second)];
		}
		/** Locate one leaf by id. */
		function findLeaf(node, paneId) {
			if (node.type === "leaf") return node.id === paneId ? node : null;
			return findLeaf(node.first, paneId) ?? findLeaf(node.second, paneId);
		}
		/** Replace one node by id (identity-preserving). */
		function replaceNode(node, paneId, next) {
			if (node.type === "leaf") return node.id === paneId ? next : node;
			const first = replaceNode(node.first, paneId, next);
			const second = replaceNode(node.second, paneId, next);
			if (first === node.first && second === node.second) return node;
			return {
				...node,
				first,
				second
			};
		}
		/**
		* The pane-layout store factory (one handle per registration site; the two
		* panes-plugin surfaces share one instance through the handle).
		* @returns the store pair (create/define).
		*/
		function createPaneLayoutStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => {
					const id = genPaneId();
					return {
						root: {
							type: "leaf",
							id,
							sessionId: null
						},
						focusedPaneId: id
					};
				},
				actions: {
					focusPane: (d, paneId) => {
						if (d.focusedPaneId === paneId) return;
						d.focusedPaneId = paneId;
					},
					splitPane: (d, paneId, direction, currentSessionId) => {
						const leaf = findLeaf(d.root, paneId);
						if (leaf === null) return;
						const newLeaf = {
							type: "leaf",
							id: genPaneId(),
							sessionId: null
						};
						d.root = replaceNode(d.root, paneId, {
							type: "split",
							id: genSplitId(),
							direction,
							ratio: .5,
							first: {
								...leaf,
								sessionId: leaf.sessionId ?? currentSessionId
							},
							second: newLeaf
						});
						d.focusedPaneId = newLeaf.id;
					},
					splitPaneToSide: (d, paneId, side, sessionId, currentSessionId) => {
						const leaf = findLeaf(d.root, paneId);
						if (leaf === null) return;
						const original = {
							...leaf,
							sessionId: leaf.sessionId ?? currentSessionId
						};
						const dropped = {
							type: "leaf",
							id: genPaneId(),
							sessionId
						};
						const horizontal = side === "left" || side === "right";
						const first = side === "left" || side === "top" ? dropped : original;
						const second = side === "left" || side === "top" ? original : dropped;
						d.root = replaceNode(d.root, paneId, {
							type: "split",
							id: genSplitId(),
							direction: horizontal ? "horizontal" : "vertical",
							ratio: .5,
							first,
							second
						});
						d.focusedPaneId = dropped.id;
					},
					closePane: (d, paneId) => {
						if (d.root.type === "leaf") return;
						if (allLeaves(d.root).length === 1) return;
						const prune = (node) => {
							if (node.type === "leaf") return node.id === paneId ? null : node;
							const first = prune(node.first);
							const second = prune(node.second);
							if (first === null && second === null) return null;
							if (first === null) return second;
							if (second === null) return first;
							if (first === node.first && second === node.second) return node;
							return {
								...node,
								first,
								second
							};
						};
						const next = prune(d.root);
						if (next === null) return;
						d.root = next;
						if (d.focusedPaneId === paneId || findLeaf(d.root, d.focusedPaneId ?? "") === null) d.focusedPaneId = allLeaves(d.root)[0]?.id ?? null;
					},
					setRatio: (d, splitId, ratio) => {
						const clamp = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
						const set = (node) => {
							if (node.type === "leaf" || node.id !== splitId || node.ratio === clamp) return node;
							return {
								...node,
								ratio: clamp
							};
						};
						d.root = set(d.root);
					},
					setPaneSession: (d, paneId, sessionId) => {
						const set = (node) => {
							if (node.type === "leaf") {
								if (node.id !== paneId || node.sessionId === sessionId) return node;
								return {
									...node,
									sessionId
								};
							}
							const first = set(node.first);
							const second = set(node.second);
							if (first === node.first && second === node.second) return node;
							return {
								...node,
								first,
								second
							};
						};
						d.root = set(d.root);
					}
				}
			});
		}
		//#endregion
		//#region \0dsh-css:E:\dev\dsh-split-panes\src\client\SplitContainer.module.css.mjs
		const css$3 = ".ytwmKG_host{flex:1;min-width:0;min-height:0;display:flex}.ytwmKG_split{flex:1;min-width:0;min-height:0;display:grid}.ytwmKG_paneSide{min-width:0;min-height:0;display:flex}.ytwmKG_paneSide>*{flex:1;min-width:0;min-height:0}.ytwmKG_divider{z-index:1;touch-action:none;cursor:col-resize;background:0 0;position:relative}.ytwmKG_split[data-direction=vertical] .ytwmKG_divider{cursor:row-resize}.ytwmKG_divider:hover,.ytwmKG_divider:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:none}";
		const tagId$3 = "@dsh-external/dsh-split-panes/SplitContainer.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-split-panes";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var SplitContainer_module_css_default = {
			"host": "ytwmKG_host",
			"split": "ytwmKG_split",
			"divider": "ytwmKG_divider",
			"paneSide": "ytwmKG_paneSide"
		};
		//#endregion
		//#region src/client/SplitContainer.tsx
		/**
		* Recursive split-pane container: renders a grid with a draggable +
		* keyboard-resizable divider between the two sides (role=separator, arrow
		* keys step the ratio).
		*
		* Drag follows the PiUI model: while dragging, the divider writes the grid
		* template directly on the DOM element (no store traffic per move, so large
		* conversation trees do not re-render); on release it commits the final
		* ratio to the store once. The divider's hit area extends past its 6px
		* visual gap (generous negative margins), and the ratio clamps to [0.1, 0.9]
		* so a pane can never collapse to zero.
		*/
		const STEP = .05;
		/** Visual gap between panes in px (PiUI parity). */
		const SPLIT_GAP = 6;
		/** Build a CSS grid-template value like "49.5fr 6px 50.5fr". */
		function buildGridTemplate(ratio) {
			const r = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
			return `${r}fr ${SPLIT_GAP}px ${1 - r}fr`;
		}
		/**
		* Render the pane tree as nested grids with labeled dividers.
		* @param node - the tree node to render.
		* @param dividerLabel - accessible divider label (also the keyboard hint).
		* @param onSetRatio - ratio commit (drag end / keyboard step).
		* @param renderLeaf - leaf renderer.
		* @returns the nested split surface.
		*/
		function SplitContainer(props) {
			if (props.node.type === "leaf") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: props.renderLeaf(props.node) });
			const { node, dividerLabel, onSetRatio, renderLeaf } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: SplitContainer_module_css_default.host,
				"data-direction": node.direction,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SplitView, {
					node,
					dividerLabel,
					onSetRatio,
					renderLeaf
				})
			});
		}
		function SplitView(props) {
			const { node, dividerLabel, onSetRatio, renderLeaf } = props;
			const containerRef = (0, react.useRef)(null);
			const dragging = (0, react.useRef)(false);
			const isHorizontal = node.direction === "horizontal";
			const startDrag = (event) => {
				if (dragging.current) return;
				const container = containerRef.current;
				if (container === null) return;
				event.preventDefault();
				dragging.current = true;
				const splitId = node.id;
				const rect = container.getBoundingClientRect();
				const base = {
					left: rect.left,
					top: rect.top,
					width: rect.width,
					height: rect.height
				};
				const apply = (clientX, clientY) => {
					const size = isHorizontal ? base.width : base.height;
					if (size === 0) return;
					const offset = isHorizontal ? clientX - base.left : clientY - base.top;
					const tpl = buildGridTemplate(Math.min(MAX_RATIO, Math.max(MIN_RATIO, offset / size)));
					if (isHorizontal) container.style.gridTemplateColumns = tpl;
					else container.style.gridTemplateRows = tpl;
				};
				const onMove = (moveEvent) => {
					apply(moveEvent.clientX, moveEvent.clientY);
				};
				const onUp = (upEvent) => {
					window.removeEventListener("pointermove", onMove);
					window.removeEventListener("pointerup", onUp);
					document.body.style.cursor = "";
					document.body.style.userSelect = "";
					dragging.current = false;
					container.style.gridTemplateColumns = "";
					container.style.gridTemplateRows = "";
					const size = isHorizontal ? base.width : base.height;
					if (size > 0) {
						const offset = isHorizontal ? upEvent.clientX - base.left : upEvent.clientY - base.top;
						onSetRatio(splitId, Math.min(MAX_RATIO, Math.max(MIN_RATIO, offset / size)));
					}
				};
				document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
				document.body.style.userSelect = "none";
				window.addEventListener("pointermove", onMove);
				window.addEventListener("pointerup", onUp);
			};
			const onKeyDown = (event) => {
				if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
				event.preventDefault();
				const delta = (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) * STEP;
				onSetRatio(node.id, node.ratio + delta);
			};
			const gridTemplate = buildGridTemplate(node.ratio);
			const hitSize = 14;
			const negMargin = -10;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: containerRef,
				className: SplitContainer_module_css_default.split,
				"data-direction": node.direction,
				style: isHorizontal ? {
					gridTemplateColumns: gridTemplate,
					gridTemplateRows: "1fr"
				} : {
					gridTemplateRows: gridTemplate,
					gridTemplateColumns: "1fr"
				},
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SplitContainer_module_css_default.paneSide,
						children: node.first.type === "split" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SplitView, {
							node: node.first,
							dividerLabel,
							onSetRatio,
							renderLeaf
						}) : renderLeaf(node.first)
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SplitContainer_module_css_default.divider,
						role: "separator",
						"aria-label": dividerLabel,
						"aria-orientation": isHorizontal ? "vertical" : "horizontal",
						"aria-valuemin": Math.round(MIN_RATIO * 100),
						"aria-valuemax": Math.round(MAX_RATIO * 100),
						"aria-valuenow": Math.round(node.ratio * 100),
						tabIndex: 0,
						style: isHorizontal ? {
							width: hitSize,
							marginLeft: negMargin,
							marginRight: negMargin
						} : {
							height: hitSize,
							marginTop: negMargin,
							marginBottom: negMargin
						},
						onPointerDown: startDrag,
						onKeyDown
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: SplitContainer_module_css_default.paneSide,
						children: node.second.type === "split" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SplitView, {
							node: node.second,
							dividerLabel,
							onSetRatio,
							renderLeaf
						}) : renderLeaf(node.second)
					})
				]
			});
		}
		//#endregion
		//#region src/client/icons.tsx
		/** Split side-by-side: a frame with a vertical center line. */
		function IconSplitHorizontal16(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				...props,
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "1.5",
					y: "2.5",
					width: "13",
					height: "11",
					rx: "1.5",
					stroke: "currentColor",
					strokeWidth: "1.2"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M8 2.5v11",
					stroke: "currentColor",
					strokeWidth: "1.2"
				})]
			});
		}
		/** Split stacked: a frame with a horizontal center line. */
		function IconSplitVertical16(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				...props,
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "1.5",
					y: "2.5",
					width: "13",
					height: "11",
					rx: "1.5",
					stroke: "currentColor",
					strokeWidth: "1.2"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M1.5 8h13",
					stroke: "currentColor",
					strokeWidth: "1.2"
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:E:\dev\dsh-split-panes\src\client\PaneDropOverlay.module.css.mjs
		const css$2 = ".kY1GGq_layer{z-index:30;pointer-events:none;position:absolute;inset:0}.kY1GGq_center,.kY1GGq_left,.kY1GGq_right,.kY1GGq_top,.kY1GGq_bottom{border:1px solid var(--dsw-static-deepseek-500);background:color-mix(in srgb, var(--dsw-static-deepseek-500) 12%, transparent);border-radius:10px;position:absolute}.kY1GGq_center{inset:20%}.kY1GGq_left{left:var(--drop-pad,0px);right:calc(50% + 3px);top:var(--drop-pad,0px);bottom:var(--drop-pad,0px)}.kY1GGq_right{left:calc(50% + 3px);right:var(--drop-pad,0px);top:var(--drop-pad,0px);bottom:var(--drop-pad,0px)}.kY1GGq_top{left:var(--drop-pad,0px);right:var(--drop-pad,0px);top:var(--drop-pad,0px);bottom:calc(50% + 3px)}.kY1GGq_bottom{left:var(--drop-pad,0px);right:var(--drop-pad,0px);top:calc(50% + 3px);bottom:var(--drop-pad,0px)}.kY1GGq_center,.kY1GGq_left,.kY1GGq_right,.kY1GGq_top,.kY1GGq_bottom{transition:left .15s ease-out,right .15s ease-out,top .15s ease-out,bottom .15s ease-out}";
		const tagId$2 = "@dsh-external/dsh-split-panes/PaneDropOverlay.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-split-panes";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var PaneDropOverlay_module_css_default = {
			"layer": "kY1GGq_layer",
			"top": "kY1GGq_top",
			"bottom": "kY1GGq_bottom",
			"left": "kY1GGq_left",
			"center": "kY1GGq_center",
			"right": "kY1GGq_right"
		};
		/**
		* Resolve which drop zone a normalized point inside a pane falls into.
		* @param xRel - normalized X relative to the pane, 0-1.
		* @param yRel - normalized Y relative to the pane, 0-1.
		* @returns the zone, or null outside the pane.
		*/
		function resolveDropZone(xRel, yRel) {
			if (xRel < 0 || xRel > 1 || yRel < 0 || yRel > 1) return null;
			if (Math.abs(xRel - .5) < .2 && Math.abs(yRel - .5) < .2) return "center";
			const dLeft = xRel;
			const dRight = 1 - xRel;
			const dTop = yRel;
			const dBottom = 1 - yRel;
			const min = Math.min(dLeft, dRight, dTop, dBottom);
			if (min === dLeft) return "left";
			if (min === dRight) return "right";
			if (min === dTop) return "top";
			return "bottom";
		}
		/** The overlay itself: pointer-transparent so it never blocks pane clicks. */
		const PaneDropOverlay = (0, react.forwardRef)(function PaneDropOverlay(_props, ref) {
			const [zone, setZone] = (0, react.useState)(null);
			(0, react.useImperativeHandle)(ref, () => ({ setZone(next) {
				setZone((prev) => prev === next ? prev : next);
			} }), []);
			return zone === null ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(DropZoneVisual, { zone });
		});
		/** The pure highlight: center box or edge half, brand blue, 150ms morph. */
		const DropZoneVisual = (0, react.memo)(function DropZoneVisual({ zone }) {
			const area = (() => {
				switch (zone) {
					case "center": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: PaneDropOverlay_module_css_default.center });
					case "left": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: PaneDropOverlay_module_css_default.left });
					case "right": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: PaneDropOverlay_module_css_default.right });
					case "top": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: PaneDropOverlay_module_css_default.top });
					case "bottom": return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: PaneDropOverlay_module_css_default.bottom });
				}
			})();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: PaneDropOverlay_module_css_default.layer,
				"data-drop-zone": zone,
				children: area
			});
		});
		//#endregion
		//#region \0dsh-css:E:\dev\dsh-split-panes\src\client\PaneWorkspace.module.css.mjs
		const css$1 = ".wYQfYq_host{flex:1;min-width:0;min-height:0;padding:8px;display:flex}.wYQfYq_singleSurface{--drop-pad:8px;flex-direction:column;flex:1;min-width:0;min-height:0;display:flex;position:relative}.wYQfYq_pane{background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;flex-direction:column;flex:1;min-width:0;min-height:0;display:flex;position:relative;overflow:hidden}.wYQfYq_pane>*{flex:1;min-width:0;min-height:0}.wYQfYq_pane[data-focused]{border-color:var(--dsw-static-deepseek-500)}.wYQfYq_heroHeader{min-height:32px;padding:var(--pane-pad-top,12px) 20px 0;flex:none;justify-content:space-between;align-items:center;gap:16px;display:flex}.wYQfYq_heroTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:16px;overflow:hidden}.wYQfYq_heroActions{flex:none;align-items:center;gap:2px;display:flex}.wYQfYq_pane{--pane-pad-top:3px}.wYQfYq_splitButton,.wYQfYq_closeButton,.wYQfYq_heroButton{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;padding:0;display:flex}.wYQfYq_splitButton:hover,.wYQfYq_splitButton:focus-visible,.wYQfYq_closeButton:hover,.wYQfYq_closeButton:focus-visible,.wYQfYq_heroButton:hover,.wYQfYq_heroButton:focus-visible{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}";
		const tagId$1 = "@dsh-external/dsh-split-panes/PaneWorkspace.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-split-panes";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var PaneWorkspace_module_css_default = {
			"heroButton": "wYQfYq_heroButton",
			"singleSurface": "wYQfYq_singleSurface",
			"heroActions": "wYQfYq_heroActions",
			"closeButton": "wYQfYq_closeButton",
			"splitButton": "wYQfYq_splitButton",
			"pane": "wYQfYq_pane",
			"host": "wYQfYq_host",
			"heroTitle": "wYQfYq_heroTitle",
			"heroHeader": "wYQfYq_heroHeader"
		};
		//#endregion
		//#region src/client/PaneWorkspace.tsx
		/**
		* Pane-workspace entry (the 'conversation.panes' wrapping seam declared by
		* ui-layout, ROOT scope): renders the STOCK conversation column full-bleed as
		* a single pane, or as a split-pane tree once the user splits. Splitting
		* CLONES the single-pane conversation into two panes — the original keeps
		* the current session, the new pane starts a FRESH conversation — and EVERY
		* pane renders the FULL native conversation UNCHANGED, including its own
		* header (crumbs, tabs, header actions): a session pane reuses the stock
		* header with the pane actions (split H/V / close) in its actions row. The
		* new-conversation surface (no session, or a BLANK session — the stock hero
		* hides its header) gets the plugin's new-conversation header (title + split
		* H/V + close while split) in BOTH the single full-bleed state and split
		* panes. Splitting always seeds the new pane as an INDEPENDENT fresh
		* conversation of the current workspace — each pane mints its own blank
		* session on the host (never the New Session reuse), so typing in one pane
		* never surfaces in another; with no workspace it stays the plain
		* add-a-workspace hero. Panes are scoped to their OWN session through the
		* framework's SessionScope global seat.
		*
		* The split tree is GLOBAL viewing state (root scope, one store): switching
		* sessions never rebuilds it. The CURRENT selection tracks the FOCUSED
		* pane: focusing a pane opens its session (the side-bar highlights it),
		* clicking a session in the side-bar (or starting a new one) binds the
		* focused pane, and every other pane keeps its pinned session — so several
		* panes may show the SAME session.
		*/
		/**
		* HTML5 data-transfer type carrying a dragged session id (written by the
		* side-bar session rows in ui-workspace; read here on dragover/drop). The
		* mime string is the cross-package channel — no import between the two
		* plugin packages.
		*/
		const SESSION_DRAG_TYPE = "application/x-dsh-session";
		/** The new-conversation header: title + split H/V (+ close while split). */
		function HeroHeader(props) {
			const { paneId, split, current, workspaceId, actions, splitWithNew, t } = props;
			const doSplit = (direction) => {
				splitWithNew(paneId, direction, split ? null : current ?? null, workspaceId);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: PaneWorkspace_module_css_default.heroHeader,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: PaneWorkspace_module_css_default.heroTitle,
					children: t("pane.new.conversation")
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: PaneWorkspace_module_css_default.heroActions,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: PaneWorkspace_module_css_default.heroButton,
							"aria-label": t("pane.split.horizontal"),
							title: t("pane.split.horizontal"),
							onClick: () => {
								doSplit("horizontal");
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSplitHorizontal16, {})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: PaneWorkspace_module_css_default.heroButton,
							"aria-label": t("pane.split.vertical"),
							title: t("pane.split.vertical"),
							onClick: () => {
								doSplit("vertical");
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSplitVertical16, {})
						}),
						split && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: PaneWorkspace_module_css_default.heroButton,
							"aria-label": t("pane.close"),
							title: t("pane.close"),
							onClick: () => {
								actions.closePane(paneId);
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
						})
					]
				})]
			});
		}
		/**
		* Session drag & drop wiring for one pane (PiUI drop model): while a session
		* is dragged over the pane, a ref-driven overlay highlights the target zone —
		* CENTER replaces the pane's session, the four EDGE halves split to that
		* side with the dropped session landing in the NEW pane (focus stays on the
		* original). High-frequency dragover events update only the tiny overlay
		* through its imperative handle, never the pane subtree.
		* @param leaf - this pane's leaf.
		* @param single - true on the single full-bleed surface: edge splits anchor
		*   the current selection and a center drop OPENS the dragged session; in
		*   the split tree the original pane keeps itself and a center drop binds
		*   the pane's session slot.
		* @param current - the global current selection (single-pane split anchor).
		*/
		function usePaneDrop(leaf, single, current, actions, openSession) {
			const overlayRef = (0, react.useRef)(null);
			const zoneRef = (0, react.useRef)(null);
			const writeZone = (zone) => {
				if (zoneRef.current === zone) return;
				zoneRef.current = zone;
				overlayRef.current?.setZone(zone);
			};
			const zoneAt = (event) => {
				const rect = event.currentTarget.getBoundingClientRect();
				if (rect.width <= 0 || rect.height <= 0) return null;
				return resolveDropZone((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
			};
			const onDragOver = (event) => {
				if (!Array.from(event.dataTransfer.types).includes("application/x-dsh-session")) return;
				event.preventDefault();
				event.dataTransfer.dropEffect = "move";
				writeZone(zoneAt(event));
			};
			const onDragLeave = (event) => {
				const related = event.relatedTarget;
				if (related !== null && event.currentTarget.contains(related)) return;
				writeZone(null);
			};
			const onDrop = (event) => {
				const sessionId = event.dataTransfer.getData(SESSION_DRAG_TYPE);
				if (sessionId === "") return;
				event.preventDefault();
				const zone = zoneAt(event);
				writeZone(null);
				if (zone === null) return;
				if (zone === "center") {
					if (single) {
						if (current !== sessionId) openSession(sessionId);
					} else if (leaf.sessionId !== sessionId) {
						actions.setPaneSession(leaf.id, sessionId);
						actions.focusPane(leaf.id);
						openSession(sessionId);
					}
					return;
				}
				const anchor = single ? current ?? null : null;
				actions.splitPaneToSide(leaf.id, zone, sessionId, anchor);
				openSession(sessionId);
			};
			return {
				onDragOver,
				onDragLeave,
				onDrop,
				overlay: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PaneDropOverlay, { ref: overlayRef })
			};
		}
		/** One split leaf: focus frame + (new-conversation header | stock header) + scoped conversation. */
		function PaneFrame(props) {
			const { leaf, focused, current, workspaceId, useSessions, SessionScope, renderConversation, actions, openSession, splitWithNew, t } = props;
			const isNewConversation = useSessions((s) => leaf.sessionId === null ? true : s.byId[leaf.sessionId]?.blank ?? false);
			const { onDragOver, onDragLeave, onDrop, overlay } = usePaneDrop(leaf, false, current, actions, openSession);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: PaneWorkspace_module_css_default.pane,
				"data-focused": focused || void 0,
				onPointerDown: () => {
					actions.focusPane(leaf.id);
					if (leaf.sessionId !== null) openSession(leaf.sessionId);
				},
				onDragOver,
				onDragLeave,
				onDrop,
				children: [
					isNewConversation && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HeroHeader, {
						paneId: leaf.id,
						split: true,
						current,
						workspaceId,
						actions,
						splitWithNew,
						t
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionScope, {
						sessionId: leaf.sessionId ?? void 0,
						children: renderConversation()
					}),
					overlay
				]
			});
		}
		/** The single full-bleed surface (session or new-conversation state): the
		stock conversation verbatim plus the drop zone for the FIRST split. */
		function SinglePane(props) {
			const { leaf, current, workspaceId, showHeroHeader, renderConversation, actions, openSession, splitWithNew, t } = props;
			const { onDragOver, onDragLeave, onDrop, overlay } = usePaneDrop(leaf, true, current, actions, openSession);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: PaneWorkspace_module_css_default.singleSurface,
				onDragOver,
				onDragLeave,
				onDrop,
				children: [
					showHeroHeader && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HeroHeader, {
						paneId: leaf.id,
						split: false,
						current,
						workspaceId,
						actions,
						splitWithNew,
						t
					}),
					renderConversation(),
					overlay
				]
			});
		}
		/**
		* Render the conversation as a full-bleed pane, or as the split-pane tree
		* once the user splits. Each session pane is the FULL stock conversation
		* (its own header included) inside a focus-grabbing frame; new-conversation
		* panes get the plugin's new-conversation header.
		* @param props - composed slot props (see PaneWorkspaceProps).
		* @returns the pane surface wrapping the stock conversation column.
		*/
		function PaneWorkspace({ useStore, actions, renderConversation, useSessions, useWorkspaces, SessionScope, openSession, splitWithNew, t }) {
			const state = useStore((s) => s);
			const current = useSessions((s) => s.current);
			const workspaceId = useWorkspaces((s) => s.recentWorkspaceId);
			const currentIsBlank = useSessions((s) => current !== void 0 ? s.byId[current]?.blank ?? false : false);
			const showSingleHeroHeader = current === void 0 || currentIsBlank;
			const prevCurrent = (0, react.useRef)(current);
			const stateRef = (0, react.useRef)(state);
			stateRef.current = state;
			(0, react.useEffect)(() => {
				if (current === prevCurrent.current) return;
				prevCurrent.current = current;
				if (current === void 0) return;
				const tree = stateRef.current;
				if (tree.root.type === "leaf") return;
				const paneId = tree.focusedPaneId ?? allLeaves(tree.root)[0]?.id;
				if (paneId !== void 0) actions.setPaneSession(paneId, current);
			}, [current, actions]);
			const latest = (0, react.useRef)({
				state,
				actions,
				current,
				workspaceId,
				splitWithNew
			});
			latest.current = {
				state,
				actions,
				current,
				workspaceId,
				splitWithNew
			};
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return;
					const target = event.target;
					if (target !== null && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
					const latestNow = latest.current;
					const paneId = latestNow.state.focusedPaneId ?? allLeaves(latestNow.state.root)[0]?.id;
					if (paneId === void 0) return;
					const anchor = latestNow.state.root.type === "leaf" ? latestNow.current ?? null : null;
					switch (event.key) {
						case "ArrowRight":
							event.preventDefault();
							latestNow.splitWithNew(paneId, "horizontal", anchor, latestNow.workspaceId);
							break;
						case "ArrowDown":
							event.preventDefault();
							latestNow.splitWithNew(paneId, "vertical", anchor, latestNow.workspaceId);
							break;
						case "w":
						case "W":
							event.preventDefault();
							latestNow.actions.closePane(paneId);
					}
				};
				window.addEventListener("keydown", onKeyDown);
				return () => {
					window.removeEventListener("keydown", onKeyDown);
				};
			}, []);
			if (state.root.type === "leaf") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SinglePane, {
				leaf: state.root,
				current,
				workspaceId,
				showHeroHeader: showSingleHeroHeader,
				renderConversation,
				actions,
				openSession,
				splitWithNew,
				t
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: PaneWorkspace_module_css_default.host,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SplitContainer, {
					node: state.root,
					dividerLabel: t("pane.split.divider"),
					onSetRatio: (splitId, ratio) => {
						actions.setRatio(splitId, ratio);
					},
					renderLeaf: (leaf) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PaneFrame, {
						leaf,
						focused: state.focusedPaneId === leaf.id,
						current,
						workspaceId,
						useSessions,
						SessionScope,
						renderConversation,
						actions,
						openSession,
						splitWithNew,
						t
					}, leaf.id)
				})
			});
		}
		//#endregion
		//#region src/client/SplitPaneButton.tsx
		/**
		* Render the header split button.
		* @param props - composed slot props (see SplitPaneButtonProps).
		* @returns the split button element.
		*/
		function SplitPaneButton({ useStore, useSessions, useWorkspaces, splitWithNew, t }) {
			const state = useStore((s) => s);
			const current = useSessions((s) => s.current);
			const workspaceId = useWorkspaces((s) => s.recentWorkspaceId);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: PaneWorkspace_module_css_default.splitButton,
				"aria-label": t("pane.split"),
				title: t("pane.split"),
				onClick: () => {
					if (state.focusedPaneId !== null) splitWithNew(state.focusedPaneId, "horizontal", state.root.type === "leaf" ? current ?? null : null, workspaceId);
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSplitHorizontal16, {})
			});
		}
		//#endregion
		//#region src/client/SplitVerticalButton.tsx
		/**
		* Render the header split-stacked button.
		* @param props - composed slot props (see SplitVerticalButtonProps).
		* @returns the split button element.
		*/
		function SplitVerticalButton({ useStore, useSessions, useWorkspaces, splitWithNew, t }) {
			const state = useStore((s) => s);
			const current = useSessions((s) => s.current);
			const workspaceId = useWorkspaces((s) => s.recentWorkspaceId);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: PaneWorkspace_module_css_default.splitButton,
				"aria-label": t("pane.split.vertical"),
				title: t("pane.split.vertical"),
				onClick: () => {
					if (state.focusedPaneId !== null) splitWithNew(state.focusedPaneId, "vertical", state.root.type === "leaf" ? current ?? null : null, workspaceId);
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconSplitVertical16, {})
			});
		}
		//#endregion
		//#region src/client/ClosePaneButton.tsx
		/**
		* Render the header close-pane button (single-pane state renders nothing).
		* @param props - composed slot props (see ClosePaneButtonProps).
		* @returns the close button, or null while there is no split to close.
		*/
		function ClosePaneButton({ useStore, actions, t }) {
			const root = useStore((s) => s.root);
			const focusedPaneId = useStore((s) => s.focusedPaneId);
			if (root.type === "leaf") return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: PaneWorkspace_module_css_default.closeButton,
				"aria-label": t("pane.close"),
				title: t("pane.close"),
				onClick: () => {
					const paneId = focusedPaneId ?? allLeaves(root)[0]?.id;
					if (paneId !== void 0) actions.closePane(paneId);
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const zh = {
			"pane.split": "分屏",
			"pane.split.horizontal": "左右分屏",
			"pane.split.vertical": "上下分屏",
			"pane.close": "关闭窗格",
			"pane.split.divider": "调整分屏比例",
			"pane.new.conversation": "新建对话"
		};
		const en = {
			"pane.split": "Split",
			"pane.split.horizontal": "Split horizontal",
			"pane.split.vertical": "Split vertical",
			"pane.close": "Close pane",
			"pane.split.divider": "Resize split",
			"pane.new.conversation": "New conversation"
		};
		//#endregion
		//#region \0dsh-css:E:\dev\dsh-split-panes\src\client\PaneGlobal.module.css.mjs
		const css = "[data-phase]>header:not([aria-hidden=true]){padding:var(--pane-pad-top,12px) 20px 0 20px;z-index:5;border-bottom:none;grid-template-columns:1fr auto auto;align-items:center;gap:16px;display:grid;position:relative}[data-phase]>header:not([aria-hidden=true])>div:first-child{display:contents}[data-phase]>header:not([aria-hidden=true])>div:first-child nav{grid-column:1;min-width:0}[data-phase]>header:not([aria-hidden=true])>div:nth-child(2){grid-column:2;justify-content:flex-end;margin:0;padding:0}[data-phase]>header:not([aria-hidden=true])>div:nth-child(2) button{align-items:center;padding:0 0 4px;display:flex}[data-phase]>header:not([aria-hidden=true])>div:first-child>div:last-child{grid-column:3;align-items:center;gap:2px;display:flex}[data-phase]>header:not([aria-hidden=true]):after{content:\"\";pointer-events:none;background:linear-gradient(to bottom, var(--dsw-alias-bg-base), transparent);height:32px;position:absolute;top:100%;left:0;right:0}[data-phase]>[data-conversation-scroll]{padding-top:12px}:root{--dsw-specific-sidebar-fill:var(--dsw-static-neutral-bluish-00)}body[data-ds-dark-theme]{--dsw-specific-sidebar-fill:var(--dsw-static-neutral-bluish-950)}";
		const tagId = "@dsh-external/dsh-split-panes/PaneGlobal.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-split-panes";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin (pane chrome copy). */
		const NS = "panes";
		/** Services required by the panes plugin. */
		const inject = [
			"slots",
			"locale",
			"sessions"
		];
		/**
		* Register the panes-plugin surfaces over ONE shared layout store instance:
		* the 'conversation.panes' workspace (declared by the ui-layout frame, ROOT
		* scope — the split tree is global viewing state) and the split/close
		* buttons inside the conversation header's actions row (declared by
		* ui-conversation, session scope; registered through an erased name so this
		* package keeps its one-way dependency direction). The framework pins one
		* scope per store HANDLE, so each registration gets its own wrapper handle
		* whose create() returns the SAME live instance — every surface operates on
		* one split tree regardless of its slot's scope. Registrations wait on their
		* owner's declaration via slots.inject; absent this plugin, the frame falls
		* back to the plain conversation render.
		* @param ctx - Client root context.
		*/
		function apply(ctx) {
			const paneStore = createPaneLayoutStore().create();
			const sharedHandle = () => ({ create: () => paneStore });
			/**
			* Split, leaving the new pane as a NEW-CONVERSATION PLACEHOLDER (no host
			* session — the split is a pure view operation). The placeholder renders
			* the stock hero (workspace picker): choosing a workspace there starts the
			* conversation, which creates the session and binds it to that pane. A
			* stack of placeholders stays independent by construction — nothing is
			* shared until each pane actually starts its own conversation.
			*/
			const splitWithNew = (paneId, direction, anchor) => {
				paneStore.actions.splitPane(paneId, direction, anchor);
			};
			ctx.effect(() => {
				return ctx.locale.register(NS, {
					zh,
					en
				});
			}, "ui-panes: dictionaries");
			ctx.effect(() => {
				const onDragStart = (event) => {
					const row = event.target?.closest("[role=\"treeitem\"][draggable=\"true\"]");
					if (row === null || event.dataTransfer === null) return;
					if (Array.from(event.dataTransfer.types).includes("application/x-dsh-session")) return;
					const sessionId = resolveSessionIdFromRow(row, ctx.sessions.list.getSnapshot().byId);
					if (sessionId !== null) event.dataTransfer.setData(SESSION_DRAG_TYPE, sessionId);
				};
				document.addEventListener("dragstart", onDragStart, true);
				return () => {
					document.removeEventListener("dragstart", onDragStart, true);
				};
			}, "ui-panes: session drag data");
			ctx.effect(() => ctx.slots.inject("conversation.panes", () => ctx.slots.register({
				name: "conversation.panes",
				store: sharedHandle(),
				locale: NS,
				inject: () => ({
					openSession: (sessionId) => {
						ctx.sessions.open(sessionId);
					},
					splitWithNew
				})
			}, PaneWorkspace)), "ui-panes: workspace registration");
			ctx.effect(() => ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
				name: "conversation.session.header.actions",
				id: "panes-split",
				order: 1e3,
				store: sharedHandle(),
				locale: NS,
				inject: () => ({ splitWithNew })
			}, SplitPaneButton)), "ui-panes: header split button");
			ctx.effect(() => ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
				name: "conversation.session.header.actions",
				id: "panes-split-v",
				order: 1001,
				store: sharedHandle(),
				locale: NS,
				inject: () => ({ splitWithNew })
			}, SplitVerticalButton)), "ui-panes: header split-vertical button");
			ctx.effect(() => ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
				name: "conversation.session.header.actions",
				id: "panes-close",
				order: 1002,
				store: sharedHandle(),
				locale: NS
			}, ClosePaneButton)), "ui-panes: header close-pane button");
		}
		/**
		* Resolve the dragged session id from a side-bar row's DOM against the live
		* session roster. The row's title cell renders the session's displayTitle
		* verbatim, so an exact cell match is the reliable probe; a blank New
		* Session row renders the localized label and resolves to nothing (blank
		* sessions are not draggable). A longest-substring fallback covers rows
		* whose title cell is not a direct child.
		* @param row - the draggable session row (role=treeitem).
		* @param byId - the live session summary map.
		* @returns the session id, or null when no roster session matches the row.
		*/
		function resolveSessionIdFromRow(row, byId) {
			const cells = [...row.querySelectorAll(":scope > span")].map((cell) => cell.textContent.trim()).filter((text) => text.length > 0);
			for (const summary of Object.values(byId)) if (cells.includes(summary.displayTitle)) return summary.id;
			const text = row.textContent.trim();
			let best = null;
			let bestLength = 0;
			for (const summary of Object.values(byId)) if (summary.displayTitle.length > bestLength && text.includes(summary.displayTitle)) {
				best = summary.id;
				bestLength = summary.displayTitle.length;
			}
			return best;
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
