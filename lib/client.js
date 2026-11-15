window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-split-panes",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
		//#endregion
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_ui_slots = require("@deepseek-ai/dsh-client-ui-slots");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let _deepseek_ai_dsh_client_store = require("@deepseek-ai/dsh-client-store");
		//#region node_modules/.pnpm/use-sync-external-store@1.2.0_react@18.3.1/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim.production.min.js
		/**
		* @license React
		* use-sync-external-store-shim.production.min.js
		*
		* Copyright (c) Facebook, Inc. and its affiliates.
		*
		* This source code is licensed under the MIT license found in the
		* LICENSE file in the root directory of this source tree.
		*/
		var require_use_sync_external_store_shim_production_min = /* @__PURE__ */ __commonJSMin(((exports) => {
			var e = require("react");
			function h(a, b) {
				return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
			}
			var k = "function" === typeof Object.is ? Object.is : h;
			var l = e.useState;
			var m = e.useEffect;
			var n = e.useLayoutEffect;
			var p = e.useDebugValue;
			function q(a, b) {
				var d = b(), f = l({ inst: {
					value: d,
					getSnapshot: b
				} }), c = f[0].inst, g = f[1];
				n(function() {
					c.value = d;
					c.getSnapshot = b;
					r(c) && g({ inst: c });
				}, [
					a,
					d,
					b
				]);
				m(function() {
					r(c) && g({ inst: c });
					return a(function() {
						r(c) && g({ inst: c });
					});
				}, [a]);
				p(d);
				return d;
			}
			function r(a) {
				var b = a.getSnapshot;
				a = a.value;
				try {
					var d = b();
					return !k(a, d);
				} catch (f) {
					return !0;
				}
			}
			function t(a, b) {
				return b();
			}
			var u = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? t : q;
			exports.useSyncExternalStore = void 0 !== e.useSyncExternalStore ? e.useSyncExternalStore : u;
		}));
		//#endregion
		//#region node_modules/.pnpm/use-sync-external-store@1.2.0_react@18.3.1/node_modules/use-sync-external-store/shim/index.js
		var require_shim = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			module.exports = require_use_sync_external_store_shim_production_min();
		}));
		//#endregion
		//#region node_modules/.pnpm/use-sync-external-store@1.2.0_react@18.3.1/node_modules/use-sync-external-store/cjs/use-sync-external-store-shim/with-selector.production.min.js
		/**
		* @license React
		* use-sync-external-store-shim/with-selector.production.min.js
		*
		* Copyright (c) Facebook, Inc. and its affiliates.
		*
		* This source code is licensed under the MIT license found in the
		* LICENSE file in the root directory of this source tree.
		*/
		var require_with_selector_production_min = /* @__PURE__ */ __commonJSMin(((exports) => {
			var h = require("react");
			var n = require_shim();
			function p(a, b) {
				return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
			}
			var q = "function" === typeof Object.is ? Object.is : p;
			var r = n.useSyncExternalStore;
			var t = h.useRef;
			var u = h.useEffect;
			var v = h.useMemo;
			var w = h.useDebugValue;
			exports.useSyncExternalStoreWithSelector = function(a, b, e, l, g) {
				var c = t(null);
				if (null === c.current) {
					var f = {
						hasValue: !1,
						value: null
					};
					c.current = f;
				} else f = c.current;
				c = v(function() {
					function a(a) {
						if (!c) {
							c = !0;
							d = a;
							a = l(a);
							if (void 0 !== g && f.hasValue) {
								var b = f.value;
								if (g(b, a)) return k = b;
							}
							return k = a;
						}
						b = k;
						if (q(d, a)) return b;
						var e = l(a);
						if (void 0 !== g && g(b, e)) return b;
						d = a;
						return k = e;
					}
					var c = !1, d, k, m = void 0 === e ? null : e;
					return [function() {
						return a(b());
					}, null === m ? void 0 : function() {
						return a(m());
					}];
				}, [
					b,
					e,
					l,
					g
				]);
				var d = r(a, c[0], c[1]);
				u(function() {
					f.hasValue = !0;
					f.value = d;
				}, [d]);
				w(d);
				return d;
			};
		}));
		//#endregion
		//#region src/client/vendor/renderer/bind.ts
		var import_with_selector = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
			module.exports = require_with_selector_production_min();
		})))();
		/**
		* Bind a bare observable source to a typed uSES selector hook.
		* subscribe/getSnapshot are captured once per source into stable closures
		* (also re-binds `this` for method-based sources), so components never
		* resubscribe across renders. Equality defaults to Object.is.
		* @param w - snapshot source (engine store, Session object, store instance).
		* @returns the selector hook.
		*/
		function bindSnapshotSelector(w) {
			const subscribe = (fn) => w.subscribe(fn);
			const getSnapshot = () => w.getSnapshot();
			return function useSelector(sel, eq) {
				return (0, import_with_selector.useSyncExternalStoreWithSelector)(subscribe, getSnapshot, void 0, sel, eq);
			};
		}
		//#endregion
		//#region src/client/vendor/renderer/errors.ts
		/** Shared renderer failure categories. @module */
		/** Renderer assembly failures that must escape component error boundaries. */
		var SlotAssemblyError = class extends Error {};
		//#endregion
		//#region src/client/vendor/renderer/bindings.tsx
		/** Internal React bindings for renderer hosts and standard-source scopes. */
		/** In-package renderer host context. */
		const HostContext = (0, react.createContext)(null);
		/**
		* Read the installed renderer host.
		* @returns the host API.
		*/
		function useHost() {
			const host = (0, react.useContext)(HostContext);
			if (host === null) throw new SlotAssemblyError("slot machinery rendered outside the installed renderer tree");
			return host;
		}
		const RootBindingContext = (0, react.createContext)(null);
		const ScopeBindingContext = (0, react.createContext)(null);
		/**
		* Read the root standard-source binding.
		* @returns the current root binding.
		*/
		function useRootBinding() {
			const binding = (0, react.useContext)(RootBindingContext);
			if (binding === null) throw new SlotAssemblyError("slot rendered outside the root standard-source provider");
			return binding;
		}
		/**
		* Read the current-session-optional binding.
		* @returns a binding whose key is absent when no Session is selected.
		*/
		function useScopeBinding() {
			const binding = (0, react.useContext)(ScopeBindingContext);
			if (binding === null) throw new SlotAssemblyError("scoped slot rendered outside its scope provider");
			return binding;
		}
		/**
		* Publish one resolved scope binding to a renderer subtree.
		* @param props - provider inputs.
		* @param props.binding - binding exposed to scoped entries.
		* @param props.children - subtree that inherits the binding.
		* @returns the scoped React provider.
		*/
		function ScopeBindingProvider({ binding, children }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ScopeBindingContext.Provider, {
				value: binding,
				children
			});
		}
		/**
		* Bind one observable source to an identity-stable selector Hook.
		* @param source - observable source.
		* @returns cached selector Hook.
		*/
		function observableHook(source) {
			let hook = hookCache.get(source);
			if (hook === void 0) {
				hook = bindSnapshotSelector(source);
				hookCache.set(source, hook);
			}
			return hook;
		}
		const hookCache = /* @__PURE__ */ new WeakMap();
		const absentSource = {
			getSnapshot: () => void 0,
			subscribe: () => () => {}
		};
		/**
		* Bind an optional source without changing Hook call order.
		* @param source - current source, or absence.
		* @returns selector Hook returning `undefined` while absent.
		*/
		function maybeObservableHook(source) {
			if (source !== void 0) return observableHook(source);
			return useAbsentSnapshot;
		}
		function useAbsentSnapshot(_selector, _equal) {
			observableHook(absentSource)(() => void 0);
		}
		/** Read the `(key, member)`, `(key, selector?, equal?)`, or `(selector, equal?)` call forms. */
		function keyedHookCall(defaultKey, keyOrSelector, second, equal) {
			if (typeof keyOrSelector !== "string") return {
				key: defaultKey,
				member: void 0,
				selector: keyOrSelector,
				equal: second
			};
			if (typeof second === "string") return {
				key: keyOrSelector,
				member: second,
				selector: void 0,
				equal: void 0
			};
			return {
				key: keyOrSelector,
				member: void 0,
				selector: second,
				equal
			};
		}
		/**
		* Bind an open-key source family.
		* @param source - keyed resolver, or absence for an optional scope.
		* @returns cached keyed selector Hook.
		*/
		function keyedObservableHook(source, defaultKey) {
			if (source === void 0) return absentKeyedHook;
			let hooks = keyedHookCache.get(source);
			if (hooks === void 0) {
				hooks = /* @__PURE__ */ new Map();
				keyedHookCache.set(source, hooks);
			}
			const cacheKey = defaultKey ?? NO_DEFAULT_KEY;
			let hook = hooks.get(cacheKey);
			if (hook === void 0) {
				hook = (keyOrSelector, second, equal) => {
					const call = keyedHookCall(defaultKey, keyOrSelector, second, equal);
					return observableHook((call.key === void 0 ? void 0 : call.member === void 0 ? source(call.key) : source(call.key, call.member)) ?? absentSource)(call.selector ?? identity, call.equal);
				};
				hooks.set(cacheKey, hook);
			}
			return hook;
		}
		const NO_DEFAULT_KEY = Symbol("no default key");
		const keyedHookCache = /* @__PURE__ */ new WeakMap();
		const identity = (value) => value;
		const absentKeyedHook = (keyOrSelector, second, equal) => {
			const call = keyedHookCall(void 0, keyOrSelector, second, equal);
			return observableHook(absentSource)(call.selector ?? identity, call.equal);
		};
		/** Subscribe the tree to the atomically assembled root standard-source roster. */
		function RootStandardProvider({ children }) {
			const binding = observableHook(useHost().root)((value) => value);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RootBindingContext.Provider, {
				value: binding,
				children
			});
		}
		/** Subscribe to the scope roster before resolving and binding its current adapter. */
		function ScopeProvider({ scope, children }) {
			const host = useHost();
			observableHook(host.scopeRevision)((value) => value);
			const adapter = host.scope(scope);
			if (adapter === void 0) throw new SlotAssemblyError(`scope '${scope}' rendered without an installed adapter`);
			const binding = observableHook(adapter.current)((value) => value);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ScopeBindingContext.Provider, {
				value: binding,
				children
			});
		}
		//#endregion
		//#region src/client/PaneRoot.tsx
		/**
		* Render one pane's conversation column.
		* @param props - kit props (only `renderSlot` is used).
		* @returns the conversation subtree for this pane's session.
		*/
		function PaneRoot(props) {
			return props.renderSlot?.("main.conversation", {}) ?? null;
		}
		//#endregion
		//#region src/client/pane-host.ts
		/** The synthetic 'root' occupant: a one-line dispatch into 'main.conversation'. */
		const PANE_ROOT_ENTRY = {
			component: PaneRoot,
			options: { id: "panes.root" },
			children: { "main.conversation": {
				kind: "single",
				scope: "session-maybe"
			} }
		};
		/** The built-in 'root' spec (SlotCore seeds it; a pane host must answer for it). */
		const ROOT_SPEC = {
			kind: "single",
			scope: "root"
		};
		/**
		* Read the registry's host face. `hostFace()` is TypeScript-private on
		* SlotRegistry but is the very object the core renderer receives; the pane
		* renderer must see the same Factory and store axes.
		* @param slots - the `ctx.slots` SlotRegistry.
		* @returns the registry host face.
		* @throws when this core build exposes no host face.
		*/
		function registryHostFace(slots) {
			const face = slots.hostFace;
			if (typeof face !== "function") throw new Error("[dsh-split-panes] this dsh core exposes no slot host face (unsupported core version)");
			return face.call(slots);
		}
		/**
		* The core's own abdication set, read live from the registry's SlotCore
		* (`_core.abdicated`, TS-private like `hostFace()`; same documented exception).
		* Reading the set itself — rather than mirroring `onEntryError` — keeps it
		* complete across plugin reloads and for abdications that predate this plugin.
		* @param slots - the `ctx.slots` SlotRegistry.
		* @returns membership test for core-abdicated entries.
		* @throws when this core build has no such set.
		*/
		function registryCoreAbdicated(slots) {
			const set = slots._core?.abdicated;
			if (!(set instanceof WeakSet)) throw new Error("[dsh-split-panes] this dsh core exposes no slot abdication set (unsupported core version)");
			return (entry) => set.has(entry);
		}
		/** The cell one entry occupies under its slot's kind (mirrors SlotCore.entriesOfSlot). */
		function cellOf(kind, entry) {
			if (kind === "keyed") return entry.options.key;
			if (kind === "list") return entry.options.id;
			if (kind === "hoc") return JSON.stringify([entry.options.key, entry.options.id]);
		}
		/**
		* Build the render host for one pane.
		* @param options - base host, adapter, pane binding, exclusion.
		* @returns the renderer host for this pane.
		*/
		function createPaneHost(options) {
			const { base, adapter, binding } = options;
			const excluded = options.excluded ?? (() => false);
			/** Entries retired by a pane-local abdicating crash. */
			const abdicated = /* @__PURE__ */ new WeakSet();
			const localVersions = /* @__PURE__ */ new Map();
			const localListeners = /* @__PURE__ */ new Map();
			const bump = (key) => {
				localVersions.set(key, (localVersions.get(key) ?? 0) + 1);
				for (const listener of [...localListeners.get(key) ?? []]) try {
					listener();
				} catch (error) {
					console.error("[dsh-split-panes] pane ledger subscriber failed:", error);
				}
			};
			const coreAbdicated = options.coreAbdicated ?? (() => false);
			/**
			* SlotCore.entriesOfSlot over the priority-sorted ledger, skipping entries
			* the core abdicated (mirrored set) and entries this pane hides.
			*/
			const winnersOf = (key) => {
				const all = base.entriesOf(key);
				const hidden = (entry) => abdicated.has(entry) || excluded(entry);
				if (!all.some(hidden)) return base.entriesOfSlot(key);
				const kind = base.specOf(key)?.kind ?? "single";
				if (kind === "chain") return all.filter((entry) => !hidden(entry));
				const seen = /* @__PURE__ */ new Set();
				const heads = [];
				for (const entry of all) {
					if (coreAbdicated(entry) || hidden(entry)) continue;
					const cell = cellOf(kind, entry);
					if (seen.has(cell)) continue;
					seen.add(cell);
					heads.push(entry);
				}
				return heads;
			};
			const paneScope = {
				current: binding,
				bindingSource: adapter.bindingSource.bind(adapter),
				...adapter.renderArea === void 0 ? {} : { renderArea: adapter.renderArea.bind(adapter) }
			};
			return Object.assign(Object.create(base), {
				subscribe(key, fn) {
					let set = localListeners.get(key);
					if (set === void 0) {
						set = /* @__PURE__ */ new Set();
						localListeners.set(key, set);
					}
					set.add(fn);
					const disposeBase = base.subscribe(key, fn);
					return () => {
						set?.delete(fn);
						disposeBase();
					};
				},
				getVersion: (key) => base.getVersion(key) + (localVersions.get(key) ?? 0),
				entriesOf: (key) => {
					if (key === "root") return [PANE_ROOT_ENTRY];
					const all = base.entriesOf(key);
					return all.some(excluded) ? all.filter((entry) => !excluded(entry)) : all;
				},
				entriesOfSlot: (key) => {
					if (key === "root") return [PANE_ROOT_ENTRY];
					return winnersOf(key);
				},
				isLive: (entry) => entry === PANE_ROOT_ENTRY || base.isLive(entry),
				reportEntryError(key, entry, error, info) {
					console.error(`[dsh-split-panes] pane occupant crashed in '${key}':`, error);
					options.onCrash?.(key, entry, error);
					if (!info.abdicate) return;
					abdicated.add(entry);
					bump(key);
				},
				specOf: (key) => key === "root" ? ROOT_SPEC : base.specOf(key),
				scope: (scope) => scope === "session" || scope === "session-maybe" ? paneScope : base.scope(scope),
				...factoryOverrides(base, options.wrapFactoryInject)
			});
		}
		/**
		* Hand the renderer a per-pane copy of each Factory definition whose inject
		* face passes through `wrap`. The copy is a distinct object, so every member
		* that keys on definition identity (liveness, store axes, occurrence
		* retention, crash reports) is translated back to the core's original.
		* @param base - registry host face.
		* @param wrap - pane-local inject transform, or undefined for no overrides.
		* @returns host members to overlay.
		*/
		function factoryOverrides(base, wrap) {
			if (wrap === void 0) return {};
			const copies = /* @__PURE__ */ new WeakMap();
			const originals = /* @__PURE__ */ new WeakMap();
			const original = (definition) => originals.get(definition) ?? definition;
			const copyOf = (definition) => {
				const inject = definition.inject;
				if (inject === void 0) return definition;
				let copy = copies.get(definition);
				if (copy === void 0) {
					copy = {
						...definition,
						inject: ((...args) => wrap(definition.name, inject(...args)))
					};
					copies.set(definition, copy);
					originals.set(copy, definition);
				}
				return copy;
			};
			return {
				factoryOf: (name) => {
					const definition = base.factoryOf(name);
					return definition === void 0 ? void 0 : copyOf(definition);
				},
				isFactoryLive: (definition) => base.isFactoryLive(original(definition)),
				factoryStoreOf: (definition, scopeBinding, occurrence) => base.factoryStoreOf(original(definition), scopeBinding, occurrence),
				retainFactoryOccurrence: (definition, occurrence) => base.retainFactoryOccurrence(original(definition), occurrence),
				reportFactoryError: (name, registration, error) => {
					base.reportFactoryError(name, originals.get(registration) ?? registration, error);
				}
			};
		}
		//#endregion
		//#region src/client/pane-session.ts
		/**
		* The Session the main view currently shows.
		* @param list - Session-list snapshot.
		* @returns the main-view Session id, or undefined when nothing is selected.
		*/
		function mainSessionId(list) {
			return Object.values(list.byId).find((summary) => (summary.retainedBy.mainView ?? 0) > 0)?.id;
		}
		/**
		* Select a Session in the main view through ui-workspace navigation.
		* @param ctx - client root context.
		* @param sessionId - Session to show.
		*/
		function openMainSession(ctx, sessionId) {
			const navigation = ctx.get("uiWorkspace");
			if (typeof navigation?.openSession !== "function") {
				console.error("[dsh-split-panes] uiWorkspace.openSession is unavailable; cannot select", sessionId);
				return;
			}
			navigation.openSession(sessionId);
		}
		/**
		* Retain one Session for a pane: starts its history opening and keeps its
		* Client generation alive until released.
		* @param ctx - client root context.
		* @param sessionId - Session the pane shows.
		* @returns the owned reference, or undefined when retention failed.
		*/
		function retainPaneSession(ctx, sessionId) {
			try {
				return ctx.sessions.retain(sessionId, { source: "splitPane" });
			} catch (error) {
				console.error("[dsh-split-panes] could not retain pane session:", sessionId, error);
				return;
			}
		}
		//#endregion
		//#region src/client/vendor/renderer/scoped-slots.tsx
		/**
		* React renderer for declarative slots. Per-entry bindings enforce child
		* authorization, and entry boundaries contain registrant failures.
		*/
		const factoryRenderCache = /* @__PURE__ */ new WeakMap();
		function boundRenderFactorySlot(caller) {
			let render = factoryRenderCache.get(caller);
			if (render !== void 0) return render;
			render = ((name, props, options) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FactoryOutlet, {
				name,
				inputProps: props,
				slots: options?.slots,
				fallback: options?.fallback,
				caller
			}));
			factoryRenderCache.set(caller, render);
			return render;
		}
		/**
		* Per-entry renderSlot bindings. The binding is identity-stable per entry
		* (memoized components must not resubscribe on unrelated re-renders) and dies
		* with the entry: a retained closure calling after the entry's disposal hits
		* the in-ledger check and throws.
		*/
		const renderSlotCache = /* @__PURE__ */ new WeakMap();
		function boundRenderSlot(host, entry) {
			let binding = renderSlotCache.get(entry);
			if (!binding) {
				binding = (key, owner, opts) => {
					if (!host.isLive(entry)) throw new _deepseek_ai_dsh_client_ui_slots.StaleAuthorizationError(`renderSlot('${key}') from a disposed registration`);
					const declared = entry.children?.[key];
					if (declared === void 0) throw new _deepseek_ai_dsh_client_ui_slots.SlotOwnershipError(`slot '${key}' is not declared by this entry's children`);
					if (declared.kind === "chain") throw new _deepseek_ai_dsh_client_ui_slots.SlotOwnershipError(`slot '${key}' is declared 'chain' — use renderSlotChain`);
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlotOutlet, {
						slotKey: key,
						ownerProps: owner,
						opts,
						declaredInline: declared.inline === true
					});
				};
				renderSlotCache.set(entry, binding);
			}
			return binding;
		}
		/**
		* Per-entry renderSlotChain bindings: identity-stable per entry (same cache
		* axis as renderSlot — a per-frame dispatch must not rebuild the binding) and
		* dead with the entry. The chain-kind check is the plain-JS backstop twin of
		* the declaration check; typed callers are narrowed to chain keys.
		*/
		const renderSlotChainCache = /* @__PURE__ */ new WeakMap();
		function boundRenderSlotChain(host, entry) {
			let binding = renderSlotChainCache.get(entry);
			if (!binding) {
				binding = (key, owner, opts) => {
					if (!host.isLive(entry)) throw new _deepseek_ai_dsh_client_ui_slots.StaleAuthorizationError(`renderSlotChain('${key}') from a disposed registration`);
					const declared = entry.children?.[key];
					if (declared === void 0) throw new _deepseek_ai_dsh_client_ui_slots.SlotOwnershipError(`slot '${key}' is not declared by this entry's children`);
					if (declared.kind !== "chain") throw new _deepseek_ai_dsh_client_ui_slots.SlotOwnershipError(`slot '${key}' is declared '${declared.kind}', not 'chain' — use renderSlot`);
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlotOutlet, {
						slotKey: key,
						ownerProps: owner,
						opts,
						declaredInline: declared.inline === true
					});
				};
				renderSlotChainCache.set(entry, binding);
			}
			return binding;
		}
		const factoryRenderSlotCache = /* @__PURE__ */ new WeakMap();
		const factoryRenderSlotChainCache = /* @__PURE__ */ new WeakMap();
		function boundFactoryRenderSlot(host, definition) {
			let binding = factoryRenderSlotCache.get(definition);
			if (binding !== void 0) return binding;
			binding = (key, owner, opts) => {
				if (!host.isFactoryLive(definition)) throw new _deepseek_ai_dsh_client_ui_slots.StaleAuthorizationError(`renderSlot('${key}') from a disposed Factory`);
				const declared = definition.children?.[key];
				if (declared === void 0) throw new _deepseek_ai_dsh_client_ui_slots.SlotOwnershipError(`slot '${key}' is not declared by this Factory`);
				if (declared.kind === "chain") throw new _deepseek_ai_dsh_client_ui_slots.SlotOwnershipError(`slot '${key}' is declared 'chain' — use renderSlotChain`);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlotOutlet, {
					slotKey: key,
					ownerProps: owner,
					opts,
					declaredInline: declared.inline === true
				});
			};
			factoryRenderSlotCache.set(definition, binding);
			return binding;
		}
		function boundFactoryRenderSlotChain(host, definition) {
			let binding = factoryRenderSlotChainCache.get(definition);
			if (binding !== void 0) return binding;
			binding = (key, owner, opts) => {
				if (!host.isFactoryLive(definition)) throw new _deepseek_ai_dsh_client_ui_slots.StaleAuthorizationError(`renderSlotChain('${key}') from a disposed Factory`);
				const declared = definition.children?.[key];
				if (declared === void 0) throw new _deepseek_ai_dsh_client_ui_slots.SlotOwnershipError(`slot '${key}' is not declared by this Factory`);
				if (declared.kind !== "chain") throw new _deepseek_ai_dsh_client_ui_slots.SlotOwnershipError(`slot '${key}' is declared '${declared.kind}', not 'chain' — use renderSlot`);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlotOutlet, {
					slotKey: key,
					ownerProps: owner,
					opts,
					declaredInline: declared.inline === true
				});
			};
			factoryRenderSlotChainCache.set(definition, binding);
			return binding;
		}
		/**
		* Inject results cache: root entries per entry, session entries per
		* (entry x scope binding). WeakMap keys are entry/binding objects (both
		* identity-stable per registration/session scope), so cache lifetime rides
		* the same axes as the values it memoizes.
		*/
		const rootInjectCache = /* @__PURE__ */ new WeakMap();
		const sessionInjectCache = /* @__PURE__ */ new WeakMap();
		const sessionMaybeInjectCache = /* @__PURE__ */ new WeakMap();
		const EMPTY_INJECTED_PROPS = {};
		function runInject(entry, binding, actions) {
			const inject = entry.inject;
			if (!inject) return EMPTY_INJECTED_PROPS;
			const args = [];
			if (binding !== void 0) args.push(binding.key);
			if (actions !== void 0) args.push(actions);
			return bindInjectSources(inject(...args));
		}
		/** Bind one entry-owned inject face on its existing cache axis. */
		function bindInjectSources(face) {
			const sources = face["hooks"];
			const keyedSources = face["keyedHooks"];
			if (sources === void 0 && keyedSources === void 0) return face;
			const { hooks: _hooks, keyedHooks: _keyedHooks, ...rest } = face;
			const bound = rest;
			for (const [name, source] of Object.entries(sources ?? {})) {
				const hookName = (0, _deepseek_ai_dsh_client_ui_slots.standardHookPropName)(name);
				bound[hookName] = observableHook(source);
			}
			for (const [name, source] of Object.entries(keyedSources ?? {})) {
				const hookName = (0, _deepseek_ai_dsh_client_ui_slots.standardHookPropName)(name);
				bound[hookName] = keyedObservableHook(source);
			}
			return bound;
		}
		const slotInjectCache = /* @__PURE__ */ new WeakMap();
		const EMPTY_SLOT_INJECT = { props: EMPTY_INJECTED_PROPS };
		/** Normalize one dispatcher-owned inject face by its stable object identity. */
		function cachedSlotInject(face) {
			if (face === void 0) return EMPTY_SLOT_INJECT;
			let bound = slotInjectCache.get(face);
			if (bound !== void 0) return bound;
			const definitions = face["hooks"];
			if (definitions === void 0) {
				bound = { props: face };
				slotInjectCache.set(face, bound);
				return bound;
			}
			const { hooks: _hooks, ...rest } = face;
			const props = rest;
			let factories;
			for (const [name, definition] of Object.entries(definitions)) {
				const hookName = (0, _deepseek_ai_dsh_client_ui_slots.standardHookPropName)(name);
				if (typeof definition === "function") {
					factories ??= {};
					factories[name] = definition;
				} else props[hookName] = observableHook(definition);
			}
			bound = factories === void 0 ? { props } : {
				props,
				slotHookFactories: factories
			};
			slotInjectCache.set(face, bound);
			return bound;
		}
		/** Bind deferred slot-level factories for one stable renderSlot occurrence. */
		function bindSlotHookFactories(factories, standard, hookContext) {
			const hooks = {};
			for (const [name, factory] of Object.entries(factories)) {
				const hookName = (0, _deepseek_ai_dsh_client_ui_slots.standardHookPropName)(name);
				hooks[hookName] = factory(standard, hookContext);
			}
			return hooks;
		}
		function cachedRootInject(entry, actions) {
			let props = rootInjectCache.get(entry);
			if (!props) {
				props = runInject(entry, void 0, actions);
				rootInjectCache.set(entry, props);
			}
			return props;
		}
		function cachedSessionInject(entry, binding, actions) {
			let perBinding = sessionInjectCache.get(entry);
			if (!perBinding) {
				perBinding = /* @__PURE__ */ new WeakMap();
				sessionInjectCache.set(entry, perBinding);
			}
			let props = perBinding.get(binding);
			if (!props) {
				props = runInject(entry, binding, actions);
				perBinding.set(binding, props);
			}
			return props;
		}
		function cachedSessionMaybeInject(entry, binding, actions) {
			let perBinding = sessionMaybeInjectCache.get(entry);
			if (!perBinding) {
				perBinding = /* @__PURE__ */ new WeakMap();
				sessionMaybeInjectCache.set(entry, perBinding);
			}
			let props = perBinding.get(binding);
			if (!props) {
				props = runInject(entry, binding, actions);
				perBinding.set(binding, props);
			}
			return props;
		}
		/**
		* Locale `t` seat bindings, cached per (face, namespace, revision). The
		* revision is part of the cache key ON PURPOSE: a locale switch mints a NEW
		* function reference per namespace, so `React.memo` components taking `t`
		* re-render through ordinary shallow comparison — freshness rides identity,
		* no extra invalidation channel. Within one revision the reference is stable
		* (memoized children do not churn on unrelated re-renders).
		*/
		const localeSeatCache = /* @__PURE__ */ new WeakMap();
		function localeSeat(face, ns) {
			let perNs = localeSeatCache.get(face);
			if (!perNs) {
				perNs = /* @__PURE__ */ new Map();
				localeSeatCache.set(face, perNs);
			}
			const revision = face.getSnapshot().revision;
			const cached = perNs.get(ns);
			if (cached && cached.revision === revision) return cached.t;
			const bound = face.bind(ns);
			const t = (key, params) => bound(key, params);
			perNs.set(ns, {
				revision,
				t
			});
			return t;
		}
		const noopSubscribe = () => () => {};
		const zeroRevision = () => 0;
		/**
		* Per-face subscribe/getSnapshot closure pair. Cached by face identity: the
		* face is one global source shared by every outlet, and uSES resubscribes
		* whenever the subscribe reference changes — fresh closures per render would
		* churn one unsubscribe/resubscribe pair per outlet per render.
		*/
		const localeSubscriptionCache = /* @__PURE__ */ new WeakMap();
		function localeSubscription(face) {
			let cached = localeSubscriptionCache.get(face);
			if (!cached) {
				cached = {
					subscribe: (fn) => face.subscribe(fn),
					getRevision: () => face.getSnapshot().revision
				};
				localeSubscriptionCache.set(face, cached);
			}
			return cached;
		}
		/**
		* Subscribe an outlet to the installed locale face's revision (0 while none
		* is installed — exactly one uSES call either way, keeping hook order
		* stable). Every outlet re-renders on a locale switch; entry bodies then
		* re-derive their `t` seat at the new revision. The face must be installed
		* before the first render that needs it — a face appearing later has no
		* notification channel to already-mounted outlets.
		*/
		function useLocaleRevision(face) {
			const subscription = face !== void 0 ? localeSubscription(face) : void 0;
			return (0, react.useSyncExternalStore)(subscription?.subscribe ?? noopSubscribe, subscription?.getRevision ?? zeroRevision);
		}
		/**
		* Entry-identity React keys for entry boundaries. An outlet renders one
		* winner per position (single/keyed/list/hoc cell head, chain election) through
		* an error boundary; without a key, a boundary that failed on entry A would
		* survive a winner change (re-election, shadowing fallback after an
		* abdication, HMR re-registration) and keep a healthy entry B blacked out.
		* Keying by entry identity remounts the boundary fresh whenever the winner
		* changes (entries are identity-stable per registration, so the key is
		* stable while the same entry stays the winner).
		*/
		let nextEntryKey = 0;
		const entryKeys = /* @__PURE__ */ new WeakMap();
		function entryKeyOf(entry) {
			let key = entryKeys.get(entry);
			if (key === void 0) {
				key = nextEntryKey++;
				entryKeys.set(entry, key);
			}
			return key;
		}
		let nextSessionGenerationKey = 0;
		const sessionGenerationKeys = /* @__PURE__ */ new WeakMap();
		function sessionGenerationKeyOf(binding) {
			let key = sessionGenerationKeys.get(binding.ctx);
			if (key === void 0) {
				key = nextSessionGenerationKey++;
				sessionGenerationKeys.set(binding.ctx, key);
			}
			return key;
		}
		/**
		* An error thrown by the content a hoc layer wraps. Layer boundaries pass it
		* through untouched, so content failures never retire or blame a layer; the
		* hoc outlet rethrows the original error to the boundaries above it.
		*/
		var HocContentError = class extends Error {
			original;
			constructor(original) {
				super("hoc slot content failed", { cause: original });
				this.original = original;
			}
		};
		/** Wrap the content inside one hoc layer: its errors leave as {@link HocContentError}. */
		var HocContentBoundary = class extends react.Component {
			static getDerivedStateFromError(error) {
				throw error instanceof HocContentError ? error : new HocContentError(error);
			}
			render() {
				return this.props.children;
			}
		};
		/** Surround a hoc slot's composed layers: content errors continue upward as their original error. */
		var HocOutletBoundary = class extends react.Component {
			static getDerivedStateFromError(error) {
				throw error instanceof HocContentError ? error.original : error;
			}
			render() {
				return this.props.children;
			}
		};
		/**
		* Per-entry isolation: one registrant crashing (component render or inject
		* factory) must not take down siblings. Assembly errors (missing providers)
		* rethrow — a miswired shell must fail loud, not degrade into fallbacks.
		* Every catch reports through `onEntryError` (the ledger's supervision
		* seam); for shadowing kinds the report abdicates the entry, the outlet
		* re-renders onto the cell's next survivor, and this boundary's crash face
		* only shows until that re-render lands (permanently once the cell is dry —
		* the outlet then owns the crash face). A hoc layer supplies `crashed`, its
		* inner content, which replaces the crash face for the rest of this mount;
		* hoc reports do not abdicate.
		*/
		var SlotErrorBoundary = class extends react.Component {
			state = { failed: false };
			static getDerivedStateFromError(error) {
				if (error instanceof SlotAssemblyError || error instanceof HocContentError) throw error;
				return { failed: true };
			}
			componentDidCatch(error) {
				console.error(`slot entry crashed in '${this.props.slotKey}':`, error);
				this.props.onEntryError(error);
			}
			render() {
				const Anchor = this.props.anchor ?? "div";
				if (this.state.failed) return this.props.crashed === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Anchor, { "data-slot-error": this.props.slotKey }) : this.props.crashed;
				return this.props.children;
			}
		};
		/** Contain one Factory occurrence without retiring the shared definition. */
		var FactoryErrorBoundary = class extends react.Component {
			state = { failed: false };
			static getDerivedStateFromError(error) {
				if (error instanceof SlotAssemblyError) throw error;
				return { failed: true };
			}
			componentDidCatch(error) {
				console.error(`slot factory occurrence crashed in '${this.props.name}':`, error);
				this.props.onEntryError(error);
			}
			render() {
				if (this.state.failed) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { "data-factory-error": this.props.name });
				return this.props.children;
			}
		};
		const rootStandardCache = /* @__PURE__ */ new WeakMap();
		const sessionStandardCache = /* @__PURE__ */ new WeakMap();
		const sessionMaybeStandardCache = /* @__PURE__ */ new WeakMap();
		/** Materialize one binding into stable framework Hook and plain-prop seats. */
		function materializeStandardBinding(binding, optional, defaultKey) {
			const standard = { ...binding.props };
			for (const [name, source] of Object.entries(binding.hooks)) {
				if (source === void 0 && !optional) throw new SlotAssemblyError(`strict standard hook '${name}' has no source`);
				standard[(0, _deepseek_ai_dsh_client_ui_slots.standardHookPropName)(name)] = optional ? maybeObservableHook(source) : observableHook(source);
			}
			for (const [name, source] of Object.entries(binding.keyedHooks)) {
				if (source === void 0 && !optional) throw new SlotAssemblyError(`strict keyed standard hook '${name}' has no source resolver`);
				standard[(0, _deepseek_ai_dsh_client_ui_slots.standardHookPropName)(name)] = keyedObservableHook(source, defaultKey);
			}
			return standard;
		}
		/** Stable official-props object used by contextual Hook factories. */
		function standardProps(scope, rootBinding, scopeBinding) {
			let root = rootStandardCache.get(rootBinding);
			if (root === void 0) {
				root = materializeStandardBinding(rootBinding, false);
				rootStandardCache.set(rootBinding, root);
			}
			if (scope === "root") return root;
			if (scopeBinding === void 0) throw new SlotAssemblyError(`scope '${scope}' rendered without a standard-source binding`);
			const cache = scope === "session" ? sessionStandardCache : sessionMaybeStandardCache;
			let perScope = cache.get(rootBinding);
			if (perScope === void 0) {
				perScope = /* @__PURE__ */ new WeakMap();
				cache.set(rootBinding, perScope);
			}
			let standard = perScope.get(scopeBinding);
			if (standard !== void 0) return standard;
			standard = {
				...materializeStandardBinding(rootBinding, false, scopeBinding.key),
				...materializeStandardBinding(scopeBinding, scope === "session-maybe")
			};
			perScope.set(scopeBinding, standard);
			return standard;
		}
		const scopeAreaCache = /* @__PURE__ */ new WeakMap();
		/** Bind one domain-owned scope area renderer to the current scope binding. */
		function scopeAreaProvider(adapter) {
			let Provider = scopeAreaCache.get(adapter);
			if (Provider !== void 0) return Provider;
			if (adapter.renderArea === void 0) throw new SlotAssemblyError("scope 'session' adapter does not provide its area renderer");
			const renderArea = adapter.renderArea.bind(adapter);
			Provider = function ScopeAreaProvider(props) {
				const inherited = useScopeBinding();
				const explicit = Object.hasOwn(props, "session");
				const source = adapter.bindingSource(props.session);
				const resolved = (0, react.useSyncExternalStore)((listener) => source.subscribe(listener), () => source.getSnapshot(), () => source.getSnapshot());
				const binding = explicit ? resolved : inherited;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ScopeBindingProvider, {
					binding,
					children: renderArea(binding, props)
				});
			};
			scopeAreaCache.set(adapter, Provider);
			return Provider;
		}
		/**
		* Standard-kit synthesis shared by both scope branches: the global
		* useSessions/useWorkspaces hooks, the per-session provide bundle (every
		* `hooks` source becomes a `use<Name>` selector hook — useSession is the
		* runtime's own 'session' contribution, no special case — and `props` spread
		* verbatim), the store pair when declared, the renderSlot binding when
		* children are declared, and the SessionProvider seat when the children
		* declare a session-scope slot. Hosts hand out BARE observable sources
		* (hooks never cross the host contract); every hook is bound HERE, cached
		* per source (observableHook), so spreading a fresh kit object per render
		* never churns child subscriptions.
		*/
		function standardKit(host, entry, scope, rootBinding, scopeBinding) {
			const standard = standardProps(scope, rootBinding, scopeBinding);
			const kit = {
				...standard,
				renderFactorySlot: boundRenderFactorySlot(entry)
			};
			if (entry.locale !== void 0) {
				const face = host.locale;
				if (face === void 0) throw new SlotAssemblyError(`entry declares locale namespace '${entry.locale}' but no locale face is installed (locale plugin missing from the composition?)`);
				kit["t"] = localeSeat(face, entry.locale);
			}
			const scopedStoreBinding = scopeBinding?.key === void 0 ? void 0 : scopeBinding;
			const store = host.storeOf(entry, scopedStoreBinding);
			if (store !== void 0) {
				kit["useStore"] = observableHook(store);
				kit["actions"] = store.actions;
			}
			if (entry.children !== void 0) {
				kit["renderSlot"] = boundRenderSlot(host, entry);
				if (Object.values(entry.children).some((spec) => spec.kind === "chain")) kit["renderSlotChain"] = boundRenderSlotChain(host, entry);
				if (Object.values(entry.children).some((spec) => spec.scope !== "root")) {
					const adapter = host.scope("session");
					if (adapter === void 0) throw new SlotAssemblyError("entry declares a session child without an installed 'session' scope adapter");
					kit["SessionProvider"] = scopeAreaProvider(adapter);
				}
			}
			return {
				kit,
				standard,
				actions: store?.actions
			};
		}
		/**
		* One rendered entry: standard kit + cached entry inject + common slot inject
		* + owner props (owner wins). The shares are erased at this render boundary;
		* the registration and renderSlot seams already proved their contracts.
		*/
		function ContextualEntry({ slotKey, Comp, kit, standard, injected, slotInjected, ownerProps, hookContext, hasHookContext, children }) {
			const contextual = (0, react.useMemo)(() => {
				if (!hasHookContext) throw new SlotAssemblyError(`slot '${slotKey}' has contextual injected Hooks but no hookContext`);
				return bindSlotHookFactories(slotInjected.slotHookFactories, standard, hookContext);
			}, [
				hasHookContext,
				hookContext,
				slotInjected.slotHookFactories,
				slotKey,
				standard
			]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Comp, {
				...kit,
				...injected,
				...slotInjected.props,
				...contextual,
				...ownerProps,
				children
			});
		}
		function renderEntry(slotKey, Comp, kit, standard, injected, slotInjected, ownerProps, hookContext, hasHookContext, children) {
			if (slotInjected.slotHookFactories === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Comp, {
				...kit,
				...injected,
				...slotInjected.props,
				...ownerProps,
				children
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ContextualEntry, {
				slotKey,
				Comp,
				kit,
				standard,
				injected,
				slotInjected,
				ownerProps,
				hookContext,
				hasHookContext,
				children
			});
		}
		function SessionEntry({ entry, ownerProps, binding, slotKey, slotInjected, hookContext, hasHookContext, children }) {
			const host = useHost();
			const rootBinding = useRootBinding();
			const Comp = entry.component;
			const { kit, standard, actions } = standardKit(host, entry, "session", rootBinding, binding);
			return renderEntry(slotKey, Comp, kit, standard, cachedSessionInject(entry, binding, actions), slotInjected, ownerProps, hookContext, hasHookContext, children);
		}
		function SessionMaybeEntryBody({ entry, ownerProps, binding, slotKey, slotInjected, hookContext, hasHookContext, children }) {
			const host = useHost();
			const rootBinding = useRootBinding();
			const Comp = entry.component;
			const { kit, standard, actions } = standardKit(host, entry, "session-maybe", rootBinding, binding);
			return renderEntry(slotKey, Comp, kit, standard, cachedSessionMaybeInject(entry, binding, actions), slotInjected, ownerProps, hookContext, hasHookContext, children);
		}
		/**
		* Session-maybe identity: adoption — the ONLY behavior (there is no
		* hold-identity-forever mode). An incarnation born session-less ADOPTS the
		* first session that arrives: identity holds across that one transition
		* (undefined → first id), so a blank shell's DOM survives the moment a
		* session appears. From then on the entry behaves exactly like a strict
		* session entry: switching to a DIFFERENT session remounts (component-local
		* state must not leak between sessions), and dropping back to no-session
		* remounts into a fresh blank incarnation, which will adopt again.
		* Component-local per-session state therefore clears by construction; state
		* that must SURVIVE a switch belongs in session-bound sources (machine,
		* store, hooks) — the existing layering rule, now load-bearing.
		*/
		function SessionMaybeEntry({ entry, ownerProps, slotKey, slotInjected, hookContext, hasHookContext, children }) {
			const binding = useScopeBinding();
			const epoch = useMaybeIncarnation(binding);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionMaybeEntryBody, {
				entry,
				ownerProps,
				binding,
				slotKey,
				slotInjected,
				hookContext,
				hasHookContext,
				children
			}, epoch);
		}
		const FIRST_INCARNATION = {
			adopted: void 0,
			epoch: 0
		};
		function useMaybeIncarnation(binding) {
			const identity = binding.key === void 0 ? void 0 : binding.ctx;
			const [state, setState] = (0, react.useState)(FIRST_INCARNATION);
			let { adopted, epoch } = state;
			if (identity !== void 0 && adopted === void 0) {
				adopted = identity;
				setState({
					adopted,
					epoch
				});
			} else if (adopted !== void 0 && identity !== void 0 && identity !== adopted) {
				adopted = identity;
				epoch += 1;
				setState({
					adopted,
					epoch
				});
			} else if (adopted !== void 0 && identity === void 0) {
				adopted = void 0;
				epoch += 1;
				setState({
					adopted,
					epoch
				});
			}
			return epoch;
		}
		function RootEntry({ entry, ownerProps, slotKey, slotInjected, hookContext, hasHookContext, children }) {
			const host = useHost();
			const rootBinding = useRootBinding();
			const Comp = entry.component;
			const { kit, standard, actions } = standardKit(host, entry, "root", rootBinding, void 0);
			return renderEntry(slotKey, Comp, kit, standard, cachedRootInject(entry, actions), slotInjected, ownerProps, hookContext, hasHookContext, children);
		}
		const FactoryOccurrenceContext = (0, react.createContext)(null);
		const FactoryAncestryContext = (0, react.createContext)(/* @__PURE__ */ new Set());
		const EMPTY_FACTORY_SELECTION = {};
		function useFactorySlotRuntime(name, fallback) {
			const occurrence = (0, react.useContext)(FactoryOccurrenceContext);
			if (occurrence === null) throw new SlotAssemblyError("useFactorySlot() called outside a Factory occurrence");
			if (!occurrence.host.isFactoryLive(occurrence.definition)) throw new _deepseek_ai_dsh_client_ui_slots.StaleAuthorizationError(`useFactorySlot('${name}') from a disposed Factory`);
			const declared = occurrence.definition.slots?.[name];
			if (declared === void 0) throw new _deepseek_ai_dsh_client_ui_slots.SlotOwnershipError(`local slot '${name}' is not declared by factory '${occurrence.definition.name}'`);
			const selected = occurrence.selected[name];
			const Selected = selected ?? fallback;
			const usesFallback = selected === void 0;
			const { definition, host } = occurrence;
			return (0, react.useMemo)(function bindFactoryLocalComponent() {
				return function BoundFactoryLocalComponent(localProps) {
					const current = (0, react.useContext)(FactoryOccurrenceContext);
					const localScopeBinding = useScopeBinding();
					const localMaybeEpoch = useMaybeIncarnation(localScopeBinding);
					if (!host.isFactoryLive(definition)) throw new _deepseek_ai_dsh_client_ui_slots.StaleAuthorizationError(`local slot '${name}' from a disposed Factory`);
					if (current === null || current.definition !== definition) throw new _deepseek_ai_dsh_client_ui_slots.SlotOwnershipError(`local slot '${name}' rendered outside factory '${definition.name}'`);
					if (declared.scope === "session" && localScopeBinding.key === void 0) throw new SlotAssemblyError(`strict session local slot '${name}' from factory '${definition.name}' rendered without a scope binding`);
					const localOwner = usesFallback ? definition : current.caller;
					const localScopeIdentity = declared.scope === "root" ? "root" : declared.scope === "session" ? `session:${sessionGenerationKeyOf(localScopeBinding)}` : `session-maybe:${localMaybeEpoch}`;
					const localStandard = standardProps(declared.scope, current.rootBinding, localScopeBinding);
					const localRegistrationKit = {
						...current.registrationKit,
						renderFactorySlot: boundRenderFactorySlot(localOwner)
					};
					assertNoPropOverlap(`factory '${definition.name}' local slot '${name}'`, localRegistrationKit, localStandard);
					const provided = {
						...localRegistrationKit,
						...localStandard
					};
					assertNoPropOverlap(`factory '${definition.name}' local slot '${name}'`, provided, localProps);
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FactoryErrorBoundary, {
						name: `${definition.name}:${name}`,
						onEntryError: (error) => {
							host.reportFactoryError(definition.name, localOwner, error);
						},
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Selected, {
							...provided,
							...localProps
						})
					}, `${definition.name}:${name}:${localScopeIdentity}`);
				};
			}, [
				Selected,
				declared.scope,
				definition,
				host,
				name,
				usesFallback
			]);
		}
		function assertNoPropOverlap(owner, provided, received) {
			for (const name of Object.keys(received)) if (Object.hasOwn(provided, name)) throw new SlotAssemblyError(`${owner} received duplicate prop '${name}'`);
		}
		function factoryKit(host, definition, rootBinding, scopeBinding, occurrence) {
			const standard = standardProps(definition.scope, rootBinding, scopeBinding);
			const registrationKit = { renderFactorySlot: boundRenderFactorySlot(definition) };
			if (definition.locale !== void 0) {
				const face = host.locale;
				if (face === void 0) throw new SlotAssemblyError(`factory declares locale namespace '${definition.locale}' but no locale face is installed`);
				registrationKit["t"] = localeSeat(face, definition.locale);
			}
			const scoped = scopeBinding?.key === void 0 ? void 0 : scopeBinding;
			const store = host.factoryStoreOf(definition, scoped, occurrence);
			if (store !== void 0) {
				registrationKit["useStore"] = observableHook(store);
				registrationKit["actions"] = store.actions;
			}
			if (definition.children !== void 0) {
				registrationKit["renderSlot"] = boundFactoryRenderSlot(host, definition);
				if (Object.values(definition.children).some((spec) => spec.kind === "chain")) registrationKit["renderSlotChain"] = boundFactoryRenderSlotChain(host, definition);
				if (Object.values(definition.children).some((spec) => spec.scope !== "root")) {
					const sessionAdapter = host.scope("session");
					if (sessionAdapter === void 0) throw new SlotAssemblyError("factory declares a session child without an installed 'session' scope adapter");
					registrationKit["SessionProvider"] = scopeAreaProvider(sessionAdapter);
				}
			}
			return {
				kit: {
					...standard,
					...registrationKit
				},
				registrationKit,
				actions: store?.actions
			};
		}
		function FactoryOccurrence({ definition, inputProps, selected, caller, binding, maybeEpoch }) {
			if (definition.scope === "root") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FactoryOccurrenceBody, {
				definition,
				inputProps,
				selected,
				caller
			});
			if (definition.scope === "session") {
				if (binding.key === void 0) throw new SlotAssemblyError(`strict session factory '${definition.name}' rendered without a scope binding`);
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FactoryOccurrenceBody, {
					definition,
					inputProps,
					selected,
					caller,
					scopeBinding: binding
				}, sessionGenerationKeyOf(binding));
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FactoryOccurrenceBody, {
				definition,
				inputProps,
				selected,
				caller,
				scopeBinding: binding
			}, maybeEpoch);
		}
		function FactoryOccurrenceBody({ definition, inputProps, selected, caller, scopeBinding }) {
			const host = useHost();
			const rootBinding = useRootBinding();
			const occurrence = (0, react.useRef)({}).current;
			const localeRevision = useLocaleRevision(host.locale);
			(0, react.useEffect)(() => host.retainFactoryOccurrence(definition, occurrence), [
				definition,
				host,
				occurrence
			]);
			const { kit, registrationKit, actions } = (0, react.useMemo)(() => factoryKit(host, definition, rootBinding, scopeBinding, occurrence), [
				definition,
				host,
				localeRevision,
				occurrence,
				rootBinding,
				scopeBinding
			]);
			const injected = (0, react.useMemo)(() => runInject(definition, scopeBinding, actions), [
				actions,
				definition,
				scopeBinding
			]);
			assertNoPropOverlap(`factory '${definition.name}' inject`, kit, injected);
			const provided = {
				...kit,
				...injected,
				useFactorySlot: useFactorySlotRuntime
			};
			assertNoPropOverlap(`factory '${definition.name}' occurrence`, provided, inputProps);
			const context = (0, react.useMemo)(() => ({
				host,
				definition,
				selected,
				registrationKit: {
					...registrationKit,
					...injected
				},
				rootBinding,
				caller
			}), [
				caller,
				definition,
				host,
				injected,
				registrationKit,
				rootBinding,
				selected
			]);
			const Comp = definition.component;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FactoryOccurrenceContext.Provider, {
				value: context,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Comp, {
					...provided,
					...inputProps
				})
			});
		}
		function FactoryOutlet({ name, inputProps, slots: selected = EMPTY_FACTORY_SELECTION, fallback, caller }) {
			const host = useHost();
			const ancestors = (0, react.useContext)(FactoryAncestryContext);
			const binding = useScopeBinding();
			const maybeEpoch = useMaybeIncarnation(binding);
			const version = (0, react.useSyncExternalStore)((listener) => host.subscribeFactory(name, listener), () => host.getFactoryVersion(name));
			const definition = host.factoryOf(name);
			const nextAncestors = (0, react.useMemo)(() => new Set(ancestors).add(name), [ancestors, name]);
			if (definition === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: fallback ?? null });
			if (ancestors.has(name)) throw new _deepseek_ai_dsh_client_ui_slots.SlotOwnershipError(`recursive render of factory '${name}'`);
			for (const localName of Object.keys(selected)) if (definition.slots?.[localName] === void 0) throw new _deepseek_ai_dsh_client_ui_slots.SlotOwnershipError(`local slot '${localName}' is not declared by factory '${name}'`);
			const scopeIdentity = definition.scope === "root" ? "root" : definition.scope === "session" ? binding.key === void 0 ? "session:absent" : `session:${sessionGenerationKeyOf(binding)}` : `session-maybe:${maybeEpoch}`;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FactoryErrorBoundary, {
				name,
				onEntryError: (error) => {
					host.reportFactoryError(name, definition, error);
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FactoryAncestryContext.Provider, {
					value: nextAncestors,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(FactoryOccurrence, {
						definition,
						inputProps,
						selected,
						caller,
						binding,
						maybeEpoch
					})
				})
			}, `${name}:${version}:${scopeIdentity}`);
		}
		function StrictSessionEntry({ slotKey, anchor, crashed, entry, ownerProps, slotInjected, hookContext, hasHookContext, onEntryError, children }) {
			const binding = useScopeBinding();
			if (binding.key === void 0) throw new SlotAssemblyError(`strict session slot '${slotKey}' rendered without a scope binding`);
			const scopedBinding = binding;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlotErrorBoundary, {
				slotKey,
				anchor,
				crashed,
				onEntryError,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionEntry, {
					entry,
					ownerProps,
					binding: scopedBinding,
					slotKey,
					slotInjected,
					hookContext,
					hasHookContext,
					children
				})
			}, sessionGenerationKeyOf(scopedBinding));
		}
		/** The innermost step: the owner's content unchanged, with no Component of its own. */
		const renderHocContent = (_owner, children) => children;
		/**
		* Build one hoc layer Component. Scope, entry, and crash reporting are fixed
		* here; a render passes only the owner share and the next inner layer. A
		* crashed layer renders that inner content for the rest of that occurrence's
		* mount and stays registered, so other occurrences keep it.
		* @param host - registry host owning the ledger.
		* @param slotKey - the hoc slot.
		* @param spec - its live declaration.
		* @param entry - the layer's registration.
		* @param renderInner - renders the content inside this layer.
		* @returns the layer Component.
		*/
		function hocLayer(host, slotKey, spec, entry, renderInner) {
			const anchor = spec.inline === true ? "span" : "div";
			const slotInjected = cachedSlotInject(spec.inject);
			const onEntryError = (error) => {
				host.reportEntryError(slotKey, entry, error, { abdicate: false });
			};
			let Layer;
			switch (spec.scope) {
				case "session":
					Layer = ({ owner, children }) => {
						const inner = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HocContentBoundary, { children: renderInner(owner, children) });
						return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StrictSessionEntry, {
							slotKey,
							anchor,
							crashed: inner,
							onEntryError,
							entry,
							ownerProps: owner,
							slotInjected,
							hookContext: void 0,
							hasHookContext: false,
							children: inner
						});
					};
					break;
				case "session-maybe":
					Layer = ({ owner, children }) => {
						const inner = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HocContentBoundary, { children: renderInner(owner, children) });
						return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlotErrorBoundary, {
							slotKey,
							anchor,
							crashed: inner,
							onEntryError,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionMaybeEntry, {
								entry,
								ownerProps: owner,
								slotKey,
								slotInjected,
								hookContext: void 0,
								hasHookContext: false,
								children: inner
							})
						});
					};
					break;
				case "root": Layer = ({ owner, children }) => {
					const inner = /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HocContentBoundary, { children: renderInner(owner, children) });
					return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlotErrorBoundary, {
						slotKey,
						anchor,
						crashed: inner,
						onEntryError,
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RootEntry, {
							entry,
							ownerProps: owner,
							slotKey,
							slotInjected,
							hookContext: void 0,
							hasHookContext: false,
							children: inner
						})
					});
				};
			}
			return Layer;
		}
		/**
		* The layers one dispatch applies: wildcard layers plus layers registered for
		* `entryKey`, an exact-key layer replacing the wildcard layer with its id.
		* Winners arrive in ledger order (priority first), so the stable sort by
		* `order` keeps priority, then registration order, within equal orders.
		* @param winners - the slot's shadowing winners.
		* @param entryKey - the dispatch key, or undefined for wildcard-only dispatch.
		* @returns the layers, lowest `order` (outermost) first.
		*/
		function hocLayersFor(winners, entryKey) {
			const exactIds = /* @__PURE__ */ new Set();
			if (entryKey !== void 0) {
				for (const entry of winners) if (entry.options.key === entryKey) exactIds.add(entry.options.id);
			}
			return winners.filter((entry) => entry.options.key === void 0 ? !exactIds.has(entry.options.id) : entry.options.key === entryKey).sort((a, b) => (a.options.order ?? 0) - (b.options.order ?? 0));
		}
		/**
		* Nest the given layers into one render function, first layer outermost.
		* Each layer adds exactly one Component; with no layer the result renders the
		* owner's content directly.
		* @param host - registry host owning the ledger.
		* @param slotKey - the hoc slot.
		* @param spec - its live declaration.
		* @param layers - the dispatch's layers, outermost first.
		* @returns the composed render function; its layer Components are the layer set's identity.
		*/
		function composeHocLayers(host, slotKey, spec, layers) {
			return layers.reduceRight((renderInner, entry) => {
				const Layer = hocLayer(host, slotKey, spec, entry, renderInner);
				return (owner, children) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Layer, {
					owner,
					children
				});
			}, renderHocContent);
		}
		/**
		* Compiled hoc chains per host, live declaration, and dispatch key. Every
		* outlet dispatching the same key shares one chain, so its layer Components,
		* the remount boundary of the content inside them, are created once; a
		* redeclared slot gets a new spec object and therefore an empty cache.
		*/
		const hocChains = /* @__PURE__ */ new WeakMap();
		/**
		* Whether two layer lists hold the same entries in the same order.
		* @param a - one list.
		* @param b - the other list.
		* @returns whether they are element-wise identical.
		*/
		function sameLayers(a, b) {
			return a.length === b.length && a.every((entry, index) => entry === b[index]);
		}
		/**
		* The shared layer chain for one dispatch key: revalidated once per ledger
		* version and recomposed only when this key's ordered layers change, so a
		* registration for another key never remounts this key's content.
		* @param host - registry host owning the ledger.
		* @param slotKey - the hoc slot.
		* @param spec - its live declaration.
		* @param entryKey - the dispatch key, or undefined for wildcard-only dispatch.
		* @returns the chain's render function.
		*/
		function hocChainFor(host, slotKey, spec, entryKey) {
			let bySpec = hocChains.get(host);
			if (bySpec === void 0) {
				bySpec = /* @__PURE__ */ new WeakMap();
				hocChains.set(host, bySpec);
			}
			let chains = bySpec.get(spec);
			if (chains === void 0) {
				chains = /* @__PURE__ */ new Map();
				bySpec.set(spec, chains);
			}
			const cacheKey = entryKey === void 0 ? "" : `=${entryKey}`;
			const version = host.getVersion(slotKey);
			const cached = chains.get(cacheKey);
			if (cached !== void 0 && cached.version === version) return cached.render;
			const layers = hocLayersFor(host.entriesOfSlot(slotKey), entryKey);
			if (cached !== void 0 && sameLayers(cached.layers, layers)) {
				cached.version = version;
				return cached.render;
			}
			const render = layers.length === 0 ? renderHocContent : composeHocLayers(host, slotKey, spec, layers);
			chains.set(cacheKey, {
				version,
				layers,
				render
			});
			return render;
		}
		/** Hoc dispatch over the shared per-key chain; the enclosing outlet re-renders on every ledger version. */
		function HocOutlet({ slotKey, spec, ownerProps, entryKey, children }) {
			const renderLayers = hocChainFor(useHost(), slotKey, spec, entryKey);
			if (renderLayers === renderHocContent) return children;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HocOutletBoundary, { children: renderLayers(ownerProps, children) });
		}
		/**
		* Anchor style shared by every outlet wrapper: `display:contents` keeps the
		* wrapper out of layout (grid/flex parents see the slot's own children), so
		* the anchor is purely addressable surface. Module-level constant — a stable
		* reference so the wrapper never diffs its style prop.
		*/
		const ANCHOR_STYLE = { display: "contents" };
		function SlotOutlet({ slotKey, ownerProps, opts, declaredInline }) {
			const host = useHost();
			(0, react.useSyncExternalStore)((fn) => host.subscribe(slotKey, fn), () => host.getVersion(slotKey));
			useLocaleRevision(host.locale);
			const scopeBinding = useScopeBinding();
			const spec = host.specOf(slotKey);
			const Anchor = (spec === void 0 ? declaredInline : spec.inline === true) ? "span" : "div";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Anchor, {
				"data-slot": slotKey,
				style: ANCHOR_STYLE,
				children: spec === void 0 ? null : renderOutletContent(host, slotKey, ownerProps, opts, scopeBinding, spec)
			});
		}
		/** Kind dispatch behind the outlet anchor (single/keyed/list/chain/hoc, fallbacks, crash faces). */
		function renderOutletContent(host, slotKey, ownerProps, opts, scopeBinding, spec) {
			const Anchor = spec.inline === true ? "span" : "div";
			if (spec.kind === "chain" && opts?.fallbackOnly === true) return renderChainResult(slotKey, null, opts, Anchor);
			if (spec.scope === "session" && scopeBinding.key === void 0) throw new SlotAssemblyError(`strict session slot '${slotKey}' rendered without a scope binding`);
			if (spec.kind === "hoc") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HocOutlet, {
				slotKey,
				spec,
				ownerProps,
				entryKey: opts?.entryKey,
				children: opts?.children ?? null
			});
			const entries = host.entriesOf(slotKey);
			const slotInjected = cachedSlotInject(spec.inject);
			const guarded = (entry, key, owner = ownerProps) => {
				const hasHookContext = opts !== void 0 && Object.hasOwn(opts, "hookContext");
				const hookContext = opts?.hookContext;
				const onEntryError = (error) => {
					host.reportEntryError(slotKey, entry, error, { abdicate: spec.kind !== "chain" });
				};
				return spec.scope === "session" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(StrictSessionEntry, {
					slotKey,
					anchor: Anchor,
					entry,
					ownerProps: owner,
					slotInjected,
					hookContext,
					hasHookContext,
					onEntryError
				}, key) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlotErrorBoundary, {
					slotKey,
					anchor: Anchor,
					onEntryError,
					children: spec.scope === "session-maybe" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionMaybeEntry, {
						entry,
						ownerProps: owner,
						slotKey,
						slotInjected,
						hookContext,
						hasHookContext
					}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RootEntry, {
						entry,
						ownerProps: owner,
						slotKey,
						slotInjected,
						hookContext,
						hasHookContext
					})
				}, key);
			};
			const deadCell = () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Anchor, { "data-slot-error": slotKey });
			if (spec.kind === "single") {
				const entry = host.entriesOfSlot(slotKey)[0];
				if (!entry) return entries.length > 0 ? deadCell() : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: opts?.fallback ?? null });
				return guarded(entry, entryKeyOf(entry));
			}
			if (spec.kind === "keyed") {
				const entry = host.entriesOfSlot(slotKey).find((e) => e.options.key === opts?.entryKey);
				if (!entry) return entries.some((e) => e.options.key === opts?.entryKey) ? deadCell() : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: opts?.fallback ?? null });
				return guarded(entry, entryKeyOf(entry));
			}
			if (spec.kind === "chain") {
				let elected = null;
				for (const entry of entries) {
					let matched;
					try {
						matched = entry.select(ownerProps);
					} catch (error) {
						console.error(`chain selector crashed in '${slotKey}' (${entry.registrant ?? "unknown registrant"}), treating as declined:`, error);
						continue;
					}
					if (matched !== null) {
						elected = guarded(entry, entryKeyOf(entry), {
							...ownerProps,
							matched
						});
						break;
					}
				}
				return renderChainResult(slotKey, elected, opts, Anchor);
			}
			const rows = host.entriesOfSlot(slotKey).map((entry) => ({
				entry,
				id: entry.options.id,
				order: entry.options.order ?? 0
			}));
			const rowIds = new Set(rows.map((row) => row.id));
			for (const entry of entries) {
				if (rowIds.has(entry.options.id)) continue;
				rowIds.add(entry.options.id);
				rows.push({
					entry: void 0,
					id: entry.options.id,
					order: entry.options.order ?? 0
				});
			}
			let list = [...rows].sort((a, b) => a.order - b.order);
			if (opts?.only !== void 0) list = list.filter((item) => item.id === opts.only);
			if (list.length === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: opts?.fallback ?? null });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: list.map((item, i) => item.entry !== void 0 ? guarded(item.entry, `e${entryKeyOf(item.entry)}`) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Anchor, { "data-slot-error": slotKey }, `x${item.id ?? i}`)) });
		}
		/** Render a chain election while preserving the overlay fallback's tree position. */
		function renderChainResult(slotKey, elected, opts, Anchor) {
			if (!opts?.overlay) return elected ?? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: opts?.fallback ?? null });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Anchor, {
				"data-chain-overlay-fallback": slotKey,
				style: { display: elected === null ? "contents" : "none" },
				children: opts.fallback ?? null
			}), elected] });
		}
		/** Root outlet: the shell's single ctx-level render entry — an unregistered 'root' is a boot-order failure, never a silent blank. */
		function RootOutlet({ ownerProps }) {
			const host = useHost();
			(0, react.useSyncExternalStore)((fn) => host.subscribe("root", fn), () => host.getVersion("root"));
			useLocaleRevision(host.locale);
			const entry = host.entriesOfSlot("root")[0];
			if (!entry) {
				if (host.entriesOf("root").length > 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { "data-slot-error": "root" });
				throw new SlotAssemblyError("renderSlot('root') before any 'root' registration (boot order)");
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				"data-slot": "root",
				style: ANCHOR_STYLE,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlotErrorBoundary, {
					slotKey: "root",
					onEntryError: (error) => {
						host.reportEntryError("root", entry, error, { abdicate: true });
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RootEntry, {
						entry,
						ownerProps,
						slotKey: "root",
						slotInjected: EMPTY_SLOT_INJECT,
						hookContext: void 0,
						hasHookContext: false
					})
				}, entryKeyOf(entry))
			});
		}
		/**
		* Build the renderer installed into the `ui-renderer` SlotRegistry
		* (ctx.slots.install(createSlotRenderer()) at boot; the service owns the
		* install/renderSlot contract and the double-install/not-installed throws).
		* @returns the renderer.
		*/
		function createSlotRenderer() {
			return { renderRoot(host, ownerProps) {
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HostContext.Provider, {
					value: host,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RootStandardProvider, { children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ScopeProvider, {
						scope: "session-maybe",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(RootOutlet, { ownerProps })
					}) })
				});
			} };
		}
		//#endregion
		//#region src/client/PaneConversation.tsx
		/**
		* PaneConversation: ONE pane's native conversation, rendered by the core's
		* own slot renderer running against a pane-scoped host.
		*
		* The renderer instance is the vendored core `createSlotRenderer()` product
		* (see `vendor/renderer/README.md`); the host is `createPaneHost`, an overlay
		* on the registry's own host face whose session scope is this pane's binding.
		* The renderer's root outlet dispatches 'main.conversation', which elects the
		* STOCK ConversationRoot (the pane host filters this plugin's own main-panel
		* shadow out) — so the native header, Conversation content Factory, composer
		* and hero render here exactly as they do in an unmodified shell.
		*
		* rc.3: a pane owns a SessionReference (`sessions.retain`) for its Session;
		* `adapter.bindingSource(reference)` turns it into the pane's binding source.
		* The reference is released when the pane switches Session or unmounts.
		*/
		/** The renderer product, created once (it is stateless between renders). */
		const RENDERER = createSlotRenderer();
		/**
		* Run `start` while `uiWorkspace.openWorkspace` is shadowed by a wrapper that
		* chains `capture` onto the caller's `beforeOpen`. The shadow is an own
		* property removed again before `start` returns (the navigation call is
		* synchronous), so no other caller ever sees it.
		*/
		function withOpenedCapture(ctx, capture, start) {
			const navigation = ctx.get("uiWorkspace");
			const original = navigation?.openWorkspace;
			if (navigation === void 0 || typeof original !== "function") return start();
			const hadOwn = Object.hasOwn(navigation, "openWorkspace");
			navigation.openWorkspace = (workspaceId, beforeOpen, ...rest) => original.call(navigation, workspaceId, (id) => {
				beforeOpen?.(id);
				capture(id);
			}, ...rest);
			try {
				return start();
			} finally {
				if (hadOwn) navigation.openWorkspace = original;
				else delete navigation.openWorkspace;
			}
		}
		function paneFactoryInject(ctx, paneId, report) {
			return (name, face) => {
				const selectWorkspace = face["selectWorkspace"];
				if (name !== "conversation.content" || typeof selectWorkspace !== "function") return face;
				return {
					...face,
					selectWorkspace: async (workspaceId) => {
						let opened;
						const result = await withOpenedCapture(ctx, (id) => {
							opened = id;
						}, () => selectWorkspace(workspaceId));
						if (opened !== void 0) report(paneId, opened);
						return result;
					}
				};
			};
		}
		/**
		* Hold a SessionReference for the pane's Session while it is shown.
		* Retained in an effect, so React StrictMode double-invocation releases the
		* first reference before taking the second.
		*/
		function usePaneReference(ctx, sessionId) {
			const [reference, setReference] = (0, react.useState)(void 0);
			(0, react.useEffect)(() => {
				if (sessionId === void 0) {
					setReference(void 0);
					return;
				}
				const owned = retainPaneSession(ctx, sessionId);
				setReference(owned);
				return () => {
					owned?.release();
				};
			}, [ctx, sessionId]);
			return reference?.sessionId === sessionId ? reference : void 0;
		}
		/**
		* Render one pane's native conversation.
		* @param props - deps + pane identity + session.
		* @returns the pane's conversation subtree.
		*/
		const PaneConversation = (0, react.memo)(function PaneConversation({ deps, sessionId, paneId }) {
			const { ctx } = deps;
			const reference = usePaneReference(ctx, sessionId);
			const adapter = ctx.uiSession.adapter;
			const binding = (0, react.useMemo)(() => adapter.bindingSource(reference), [adapter, reference]);
			const host = (0, react.useMemo)(() => createPaneHost({
				base: deps.baseHost(),
				adapter,
				binding,
				excluded: deps.excluded,
				coreAbdicated: deps.coreAbdicated,
				wrapFactoryInject: paneFactoryInject(ctx, paneId, deps.onPaneSessionOpened),
				onCrash: (key, entry, error) => {
					console.error(`[dsh-split-panes] pane ${paneId} occupant crashed in '${key}':`, error, entry.options);
				}
			}), [
				deps,
				adapter,
				binding,
				paneId
			]);
			if (sessionId !== void 0 && reference === void 0) return null;
			return RENDERER.renderRoot(host, {});
		});
		//#endregion
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
			return (0, _deepseek_ai_dsh_client_store.defineStore)({
				init: () => {
					const id = genPaneId();
					return {
						root: {
							type: "leaf",
							id,
							sessionId: null
						},
						focusedPaneId: id,
						fullscreenPaneId: null
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
						d.fullscreenPaneId = null;
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
						d.fullscreenPaneId = null;
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
						if (d.fullscreenPaneId === paneId || d.root.type === "leaf") d.fullscreenPaneId = null;
					},
					setRatio: (d, splitId, ratio) => {
						const clamp = Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio));
						const set = (node) => {
							if (node.type === "leaf") return node;
							if (node.id === splitId) return node.ratio === clamp ? node : {
								...node,
								ratio: clamp
							};
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
					},
					toggleFullscreen: (d, paneId) => {
						if (d.fullscreenPaneId === paneId) {
							d.fullscreenPaneId = null;
							return;
						}
						if (findLeaf(d.root, paneId) === null) return;
						if (d.root.type === "leaf") return;
						d.fullscreenPaneId = paneId;
						d.focusedPaneId = paneId;
					}
				}
			});
		}
		//#endregion
		//#region \0dsh-css:src/client/SplitContainer.module.css.mjs
		const css$2 = ".XkLICG_host{flex:1;min-width:0;min-height:0;display:flex}.XkLICG_split{flex:1;min-width:0;min-height:0;display:grid}.XkLICG_paneSide{min-width:0;min-height:0;display:flex}.XkLICG_paneSide>*{flex:1;min-width:0;min-height:0}.XkLICG_divider{z-index:1;touch-action:none;cursor:col-resize;background:0 0;outline:none;position:relative}.XkLICG_split[data-direction=vertical] .XkLICG_divider{cursor:row-resize}.XkLICG_divider:focus-visible{outline:2px solid var(--dsw-static-deepseek-500);outline-offset:-1px;border-radius:2px}";
		const tagId$2 = "@dsh-external/dsh-split-panes/SplitContainer.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-split-panes";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var SplitContainer_module_css_default = {
			"divider": "XkLICG_divider",
			"host": "XkLICG_host",
			"paneSide": "XkLICG_paneSide",
			"split": "XkLICG_split"
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
		/** Split side-by-side: dockkit's SplitGlyph (frame + vertical divider). */
		function IconSplitHorizontal16({ className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className,
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M13.5 1.5H2.5C1.94772 1.5 1.5 1.94772 1.5 2.5V13.5C1.5 14.0523 1.94772 14.5 2.5 14.5H13.5C14.0523 14.5 14.5 14.0523 14.5 13.5V2.5C14.5 1.94772 14.0523 1.5 13.5 1.5Z",
					stroke: "currentColor"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M8 1.5V14.5",
					stroke: "currentColor"
				})]
			});
		}
		/** Split stacked: the same frame with the divider rotated to the middle row. */
		function IconSplitVertical16({ className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className,
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M13.5 1.5H2.5C1.94772 1.5 1.5 1.94772 1.5 2.5V13.5C1.5 14.0523 1.94772 14.5 2.5 14.5H13.5C14.0523 14.5 14.5 14.0523 14.5 13.5V2.5C14.5 1.94772 14.0523 1.5 13.5 1.5Z",
					stroke: "currentColor"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M14.5 8H1.5",
					stroke: "currentColor"
				})]
			});
		}
		/** Expand-to-viewport: ui-sidebar-right's FullscreenGlyph. */
		function IconFullscreen16({ className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				className,
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M2.33203 10.4054V13.1681C2.33229 13.444 2.55605 13.6681 2.83203 13.6681H5.49512V14.6681H2.83203C2.00376 14.6681 1.33229 13.9963 1.33203 13.1681V10.4054H2.33203ZM14.6689 13.1681C14.6687 13.996 13.9968 14.6676 13.1689 14.6681H10.4951V13.6681H13.1689C13.4445 13.6676 13.6687 13.4437 13.6689 13.1681V10.4054H14.6689V13.1681ZM13.1689 1.33118C13.9969 1.33163 14.6688 2.00315 14.6689 2.83118V5.4054H13.6689V2.83118C13.6688 2.55544 13.4446 2.33162 13.1689 2.33118H10.4951V1.33118H13.1689ZM5.49512 2.33118H2.83203C2.55598 2.33118 2.33218 2.55516 2.33203 2.83118V5.4054H1.33203V2.83118C1.33218 2.00288 2.00369 1.33118 2.83203 1.33118H5.49512V2.33118Z",
					fill: "currentColor"
				})
			});
		}
		/** Restore-from-fullscreen: ui-sidebar-right's ExitFullscreenGlyph. */
		function IconFullscreenExit16({ className }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
				className,
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M9 2.5V6C9 6.26522 9.10536 6.51957 9.29289 6.70711C9.48043 6.89464 9.73478 7 10 7H13.5",
					stroke: "currentColor"
				}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M7 13.5V10C7 9.73478 6.89464 9.48043 6.70711 9.29289C6.51957 9.10536 6.26522 9 6 9H2.5",
					stroke: "currentColor"
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:src/client/PaneDropOverlay.module.css.mjs
		const css$1 = ".H5V95q_layer{z-index:30;pointer-events:none;position:absolute;inset:0}.H5V95q_center,.H5V95q_left,.H5V95q_right,.H5V95q_top,.H5V95q_bottom{border:1px solid var(--dsw-static-deepseek-500);background:color-mix(in srgb, var(--dsw-static-deepseek-500) 12%, transparent);border-radius:10px;position:absolute}.H5V95q_center{inset:20%}.H5V95q_left{left:var(--drop-pad,0px);right:calc(50% + 3px);top:var(--drop-pad,0px);bottom:var(--drop-pad,0px)}.H5V95q_right{left:calc(50% + 3px);right:var(--drop-pad,0px);top:var(--drop-pad,0px);bottom:var(--drop-pad,0px)}.H5V95q_top{left:var(--drop-pad,0px);right:var(--drop-pad,0px);top:var(--drop-pad,0px);bottom:calc(50% + 3px)}.H5V95q_bottom{left:var(--drop-pad,0px);right:var(--drop-pad,0px);top:calc(50% + 3px);bottom:var(--drop-pad,0px)}.H5V95q_center,.H5V95q_left,.H5V95q_right,.H5V95q_top,.H5V95q_bottom{transition:left .15s ease-out,right .15s ease-out,top .15s ease-out,bottom .15s ease-out}";
		const tagId$1 = "@dsh-external/dsh-split-panes/PaneDropOverlay.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-split-panes";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var PaneDropOverlay_module_css_default = {
			"bottom": "H5V95q_bottom",
			"center": "H5V95q_center",
			"layer": "H5V95q_layer",
			"left": "H5V95q_left",
			"right": "H5V95q_right",
			"top": "H5V95q_top"
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
		//#region src/client/session-row.ts
		/** HTML5 data-transfer type carrying a dragged session id. */
		const SESSION_DRAG_TYPE = "application/x-dsh-session";
		/** One side-bar session row: draggable, tree-item, holding the session title. */
		const SESSION_ROW_SELECTOR = "[role=\"treeitem\"][draggable=\"true\"]";
		/**
		* Resolve the side-bar session row behind a DOM event target.
		* @param target - event target.
		* @returns the row element, or null.
		*/
		function sessionRowOf(target) {
			return target?.closest(SESSION_ROW_SELECTOR);
		}
		/**
		* Resolve the session id a row stands for, against the live roster.
		*
		* The row's title cell renders the session's displayTitle verbatim, so an
		* exact cell match is the reliable probe; a longest-substring fallback covers
		* rows whose title cell is not a direct child. A blank "New Session" row
		* renders the localized label instead and resolves to nothing.
		* @param ctx - client context carrying the session roster.
		* @param row - the draggable session row.
		* @returns the session id, or null when no roster session matches the row.
		*/
		function resolveSessionIdFromRow(ctx, row) {
			const byId = ctx.get("sessions")?.list.getSnapshot().byId;
			if (byId === void 0) return null;
			const cells = [...row.querySelectorAll(":scope > span")].map((cell) => cell.textContent?.trim() ?? "").filter((text) => text.length > 0);
			for (const summary of Object.values(byId)) if (cells.includes(summary.displayTitle)) return summary.id;
			const text = row.textContent?.trim() ?? "";
			let best = null;
			let bestLength = 0;
			for (const summary of Object.values(byId)) if (summary.displayTitle.length > bestLength && text.includes(summary.displayTitle)) {
				best = summary.id;
				bestLength = summary.displayTitle.length;
			}
			return best === null ? null : best;
		}
		//#endregion
		//#region \0dsh-css:src/client/PaneWorkspace.module.css.mjs
		const css = "._0n3KuW_host{flex:1;min-width:0;min-height:0;padding:8px;display:flex}._0n3KuW_singleSurface{--drop-pad:8px;flex-direction:column;flex:1;min-width:0;min-height:0;display:flex;position:relative}._0n3KuW_pane{background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;flex-direction:column;flex:1;min-width:0;min-height:0;display:flex;position:relative;overflow:hidden}._0n3KuW_pane>*{flex:1;min-width:0;min-height:0}._0n3KuW_pane[data-focused]{border-color:var(--dsw-static-deepseek-500)}._0n3KuW_fullscreenHost{flex-direction:column;flex:1;min-width:0;min-height:0;display:flex;position:relative}._0n3KuW_pane._0n3KuW_paneFullscreen{background:0 0;border-color:#0000;border-radius:0}._0n3KuW_heroHeader{flex:none;justify-content:flex-end;align-items:center;min-height:30px;padding:10px 20px 0;display:flex}._0n3KuW_heroActions{flex:none;align-items:center;gap:2px;display:flex}._0n3KuW_splitButton,._0n3KuW_closeButton,._0n3KuW_heroButton{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;padding:6px;display:flex}._0n3KuW_splitButton:hover,._0n3KuW_splitButton:focus-visible,._0n3KuW_closeButton:hover,._0n3KuW_closeButton:focus-visible,._0n3KuW_heroButton:hover,._0n3KuW_heroButton:focus-visible{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}";
		const tagId = "@dsh-external/dsh-split-panes/PaneWorkspace.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-split-panes";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var PaneWorkspace_module_css_default = {
			"closeButton": "_0n3KuW_closeButton",
			"fullscreenHost": "_0n3KuW_fullscreenHost",
			"heroActions": "_0n3KuW_heroActions",
			"heroButton": "_0n3KuW_heroButton",
			"heroHeader": "_0n3KuW_heroHeader",
			"host": "_0n3KuW_host",
			"pane": "_0n3KuW_pane",
			"paneFullscreen": "_0n3KuW_paneFullscreen",
			"singleSurface": "_0n3KuW_singleSurface",
			"splitButton": "_0n3KuW_splitButton"
		};
		//#endregion
		//#region src/client/PaneWorkspace.tsx
		/**
		* Pane-workspace entry: this plugin's occupant of the `conversation` slot
		* (declared by ui-layout, scope session-maybe).
		*
		* The plugin ALWAYS occupies that slot: the single full-bleed state is the
		* pane tree with one leaf, so one rendering path covers both states (no
		* takeover/release transition, no dual behavior to keep in sync). Each pane
		* renders the native conversation through the vendored core renderer bound to
		* the pane's own session — see PaneConversation.tsx.
		*
		* FOCUS MODEL (OpenCode): the focused pane is the current selection's mirror.
		*   - clicking a pane focuses it and, when it holds a session, selects that
		*     session globally (side-bar highlight follows);
		*   - clicking a side-bar session binds the FOCUSED pane (other panes keep
		*     their pinned sessions);
		*   - the single-leaf state renders the global current selection, so with one
		*     pane nothing has to be routed at all.
		*
		* This component owns layout, focus and drag & drop only — no conversation
		* markup, no session data.
		*/
		/** The new-conversation header: title + split H/V + fullscreen + close. */
		function HeroHeader(props) {
			const { paneId, split, fullscreen, current, actions, splitWithNew, t } = props;
			const doSplit = (direction) => {
				splitWithNew(paneId, direction, split ? null : current ?? null);
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: PaneWorkspace_module_css_default.heroHeader,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
							"aria-label": fullscreen ? t("pane.fullscreen.exit") : t("pane.fullscreen"),
							title: fullscreen ? t("pane.fullscreen.exit") : t("pane.fullscreen"),
							"aria-pressed": fullscreen,
							onClick: () => {
								actions.toggleFullscreen(paneId);
							},
							children: fullscreen ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFullscreenExit16, {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFullscreen16, {})
						}),
						split && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: PaneWorkspace_module_css_default.heroButton,
							"aria-label": t("pane.close"),
							title: t("pane.close"),
							onClick: () => {
								actions.closePane(paneId);
							},
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineRegular, { size: 16 })
						})
					]
				})
			});
		}
		/**
		* Session drag & drop wiring for one pane (PiUI drop model): while a session
		* is dragged over the pane, a ref-driven overlay highlights the target zone —
		* CENTER replaces the pane's session, the four EDGE halves split to that side
		* with the dropped session landing in the NEW pane (focus follows the drop).
		* High-frequency dragover events update only the tiny overlay through its
		* imperative handle, never the pane subtree.
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
		/** One split leaf: focus frame + (new-conversation header | stock header) + pane body. */
		function PaneFrame(props) {
			const { leaf, focused, fullscreen = false, current, blankIds, renderPane, actions, openSession, splitWithNew, t } = props;
			const { onDragOver, onDragLeave, onDrop, overlay } = usePaneDrop(leaf, false, current, actions, openSession);
			const needsOwnHeader = leaf.sessionId === null || blankIds.has(leaf.sessionId);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: fullscreen ? `${PaneWorkspace_module_css_default.pane} ${PaneWorkspace_module_css_default.paneFullscreen}` : PaneWorkspace_module_css_default.pane,
				"data-focused": focused || void 0,
				"data-fullscreen": fullscreen || void 0,
				onPointerDown: () => {
					actions.focusPane(leaf.id);
					if (leaf.sessionId !== null) openSession(leaf.sessionId);
				},
				onDragOver,
				onDragLeave,
				onDrop,
				children: [
					needsOwnHeader && /* @__PURE__ */ (0, react_jsx_runtime.jsx)(HeroHeader, {
						paneId: leaf.id,
						split: true,
						fullscreen,
						current,
						actions,
						splitWithNew,
						t
					}),
					renderPane(leaf.sessionId ?? void 0, leaf.id),
					overlay
				]
			});
		}
		/** The single full-bleed surface: the current session's conversation verbatim. */
		function SinglePane(props) {
			const { leaf, current, showHeroHeader, renderPane, actions, openSession, splitWithNew, t } = props;
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
						fullscreen: false,
						current,
						actions,
						splitWithNew,
						t
					}),
					renderPane(current, leaf.id),
					overlay
				]
			});
		}
		/**
		* Render the conversation column: one full-bleed pane, or the split tree.
		* @param props - composed slot props (see PaneWorkspaceProps).
		* @returns the pane surface wrapping the native conversation.
		*/
		function PaneWorkspace({ usePaneStore, paneActions, useSessions, openSession, splitWithNew, renderPane, resolveRowSession, t }) {
			const state = usePaneStore((s) => s);
			const current = useSessions((s) => mainSessionId(s));
			const blankKey = useSessions((s) => (s.ids ?? []).filter((id) => s.byId[id]?.blank === true).join(","));
			const blankIds = new Set(blankKey === "" ? [] : blankKey.split(","));
			const stateRef = (0, react.useRef)(state);
			stateRef.current = state;
			(0, react.useEffect)(() => {
				if (current === void 0) return;
				const tree = stateRef.current;
				if (tree.root.type === "leaf") return;
				const paneId = tree.focusedPaneId ?? allLeaves(tree.root)[0]?.id;
				if (paneId === void 0) return;
				const focused = allLeaves(tree.root).find((leaf) => leaf.id === paneId);
				if (focused === void 0 || focused.sessionId === current) return;
				paneActions.setPaneSession(paneId, current);
			}, [current, paneActions]);
			(0, react.useEffect)(() => {
				const onClick = (event) => {
					const row = sessionRowOf(event.target);
					if (row === null) return;
					const tree = stateRef.current;
					if (tree.root.type === "leaf") return;
					const sessionId = resolveRowSession(row);
					if (sessionId === null) return;
					const paneId = tree.focusedPaneId ?? allLeaves(tree.root)[0]?.id;
					if (paneId === void 0) return;
					paneActions.setPaneSession(paneId, sessionId);
				};
				document.addEventListener("click", onClick, true);
				return () => {
					document.removeEventListener("click", onClick, true);
				};
			}, [paneActions, resolveRowSession]);
			const root = state.root;
			const fullscreenLeaf = state.fullscreenPaneId === null ? null : allLeaves(root).find((leaf) => leaf.id === state.fullscreenPaneId) ?? null;
			if (fullscreenLeaf !== null) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: PaneWorkspace_module_css_default.fullscreenHost,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PaneFrame, {
					leaf: fullscreenLeaf,
					focused: true,
					fullscreen: true,
					current,
					blankIds,
					renderPane,
					actions: paneActions,
					openSession,
					splitWithNew,
					t
				})
			});
			if (root.type === "leaf") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SinglePane, {
				leaf: root,
				current,
				showHeroHeader: current === void 0 || blankIds.has(current),
				renderPane,
				actions: paneActions,
				openSession,
				splitWithNew,
				t
			});
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: PaneWorkspace_module_css_default.host,
				"data-slot": "conversation.panes",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SplitContainer, {
					node: root,
					dividerLabel: t("pane.split.divider"),
					onSetRatio: (splitId, ratio) => {
						paneActions.setRatio(splitId, ratio);
					},
					renderLeaf: (leaf) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PaneFrame, {
						leaf,
						focused: state.focusedPaneId === leaf.id,
						current,
						blankIds,
						renderPane,
						actions: paneActions,
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
		function SplitPaneButton({ splitFocused, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: PaneWorkspace_module_css_default.splitButton,
				"aria-label": t("pane.split"),
				title: t("pane.split"),
				onClick: () => {
					splitFocused("horizontal");
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
		function SplitVerticalButton({ splitFocused, t }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: PaneWorkspace_module_css_default.splitButton,
				"aria-label": t("pane.split.vertical"),
				title: t("pane.split.vertical"),
				onClick: () => {
					splitFocused("vertical");
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
		function ClosePaneButton({ closeFocused, hasSplit, t }) {
			if (!hasSplit()) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: PaneWorkspace_module_css_default.closeButton,
				"aria-label": t("pane.close"),
				title: t("pane.close"),
				onClick: () => {
					closeFocused();
				},
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineRegular, { size: 16 })
			});
		}
		//#endregion
		//#region src/client/FullscreenPaneButton.tsx
		/**
		* Render the header fullscreen toggle.
		* @param props - composed slot props (see FullscreenPaneButtonProps).
		* @returns the toggle button, or null while there is no split to expand.
		*/
		function FullscreenPaneButton({ toggleFullscreen, hasSplit, isFullscreen, t }) {
			if (!hasSplit()) return null;
			const full = isFullscreen();
			const label = full ? t("pane.fullscreen.exit") : t("pane.fullscreen");
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: PaneWorkspace_module_css_default.closeButton,
				"aria-label": label,
				title: label,
				"aria-pressed": full,
				onClick: () => {
					toggleFullscreen();
				},
				children: full ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFullscreenExit16, {}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(IconFullscreen16, {})
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const zh = {
			"pane.split": "分屏",
			"pane.split.horizontal": "左右分屏",
			"pane.split.vertical": "上下分屏",
			"pane.close": "关闭窗格",
			"pane.fullscreen": "窗格全屏",
			"pane.fullscreen.exit": "退出全屏",
			"pane.split.divider": "调整分屏比例"
		};
		const en = {
			"pane.split": "Split",
			"pane.split.horizontal": "Split horizontal",
			"pane.split.vertical": "Split vertical",
			"pane.close": "Close pane",
			"pane.fullscreen": "Fullscreen pane",
			"pane.fullscreen.exit": "Exit fullscreen",
			"pane.split.divider": "Resize split"
		};
		//#endregion
		//#region src/client/index.ts
		/** Dictionary namespace owned by this plugin (pane chrome copy). */
		const NS = "panes";
		/** The priority at which this plugin shadows ui-conversation's root (0). */
		const TAKEOVER_PRIORITY = -1;
		/** Services required by the panes plugin. */
		const inject = [
			"slots",
			"locale",
			"sessions",
			"uiSession",
			"uiWorkspace"
		];
		/**
		* Register the panes-plugin surfaces over ONE shared pane-layout store
		* instance: the conversation-column occupant (the pane workspace) and the
		* split/close buttons inside the conversation header's actions row.
		* @param ctx - Client root context.
		*/
		function apply(ctx) {
			const paneStore = createPaneLayoutStore().create();
			const paneActions = paneStore.actions;
			const usePaneStore = observableHook({
				getSnapshot: () => paneStore.getSnapshot(),
				subscribe: (fn) => paneStore.subscribe(fn)
			});
			const paneTree = () => paneStore.getSnapshot();
			const deps = {
				ctx,
				baseHost: () => registryHostFace(ctx.slots),
				excluded: (entry) => entry.component === PaneWorkspace,
				coreAbdicated: registryCoreAbdicated(ctx.slots),
				onPaneSessionOpened: (paneId, sessionId) => {
					if (paneTree().root.type === "leaf") return;
					paneActions.setPaneSession(paneId, sessionId);
					paneActions.focusPane(paneId);
				}
			};
			const currentSession = () => mainSessionId(ctx.sessions.list.getSnapshot());
			/** The header affordances operate on the shared tree's FOCUSED pane. */
			const splitFocused = (direction) => {
				const state = paneTree();
				const paneId = state.focusedPaneId ?? allLeaves(state.root)[0]?.id;
				if (paneId === void 0) return;
				paneActions.splitPane(paneId, direction, state.root.type === "leaf" ? currentSession() ?? null : null);
			};
			const closeFocused = () => {
				const state = paneTree();
				if (state.root.type === "leaf") return;
				const paneId = state.focusedPaneId ?? allLeaves(state.root)[0]?.id;
				if (paneId !== void 0) paneActions.closePane(paneId);
			};
			const hasSplit = () => paneTree().root.type !== "leaf";
			const toggleFullscreen = () => {
				const state = paneTree();
				const paneId = state.focusedPaneId ?? allLeaves(state.root)[0]?.id;
				if (paneId !== void 0) paneActions.toggleFullscreen(paneId);
			};
			const isFullscreen = () => {
				const state = paneTree();
				return state.fullscreenPaneId !== null && state.fullscreenPaneId === state.focusedPaneId;
			};
			const operations = {
				openSession: (sessionId) => {
					openMainSession(ctx, sessionId);
				},
				splitWithNew: (paneId, direction, anchor) => {
					paneActions.splitPane(paneId, direction, anchor);
				},
				splitFocused,
				closeFocused,
				hasSplit,
				toggleFullscreen,
				isFullscreen,
				usePaneStore,
				paneActions,
				renderPane: (sessionId, paneId) => (0, react.createElement)(PaneConversation, {
					deps,
					sessionId,
					paneId,
					key: paneId
				}),
				resolveRowSession: (row) => resolveSessionIdFromRow(ctx, row)
			};
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "ui-panes: dictionaries");
			ctx.slots.register({
				name: "main",
				key: "conversation",
				priority: TAKEOVER_PRIORITY,
				locale: NS,
				inject: () => operations
			}, PaneWorkspace);
			ctx.effect(() => {
				const onDragStart = (event) => {
					const row = sessionRowOf(event.target);
					if (row === null || event.dataTransfer === null) return;
					if (Array.from(event.dataTransfer.types).includes("application/x-dsh-session")) return;
					const sessionId = resolveSessionIdFromRow(ctx, row);
					if (sessionId !== null) event.dataTransfer.setData(SESSION_DRAG_TYPE, sessionId);
				};
				document.addEventListener("dragstart", onDragStart, true);
				return () => {
					document.removeEventListener("dragstart", onDragStart, true);
				};
			}, "ui-panes: session drag data");
			ctx.effect(() => {
				const onKeyDown = (event) => {
					if (event.key === "Escape" && paneTree().fullscreenPaneId !== null) {
						event.preventDefault();
						toggleFullscreen();
						return;
					}
					if (!(event.metaKey || event.ctrlKey) || !event.shiftKey) return;
					const target = event.target;
					if (target !== null && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
					switch (event.key) {
						case "ArrowRight":
							event.preventDefault();
							splitFocused("horizontal");
							break;
						case "ArrowDown":
							event.preventDefault();
							splitFocused("vertical");
							break;
						case "w":
						case "W":
							event.preventDefault();
							closeFocused();
							break;
						default: return;
					}
				};
				window.addEventListener("keydown", onKeyDown);
				return () => {
					window.removeEventListener("keydown", onKeyDown);
				};
			}, "ui-panes: shortcuts");
			ctx.slots.inject("conversation.session.header.actions", function* () {
				yield ctx.slots.register({
					name: "conversation.session.header.actions",
					id: "panes-split",
					order: 1e3,
					locale: NS,
					inject: () => operations
				}, SplitPaneButton);
				yield ctx.slots.register({
					name: "conversation.session.header.actions",
					id: "panes-split-v",
					order: 1001,
					locale: NS,
					inject: () => operations
				}, SplitVerticalButton);
				yield ctx.slots.register({
					name: "conversation.session.header.actions",
					id: "panes-fullscreen",
					order: 1002,
					locale: NS,
					inject: () => ({
						toggleFullscreen,
						hasSplit,
						isFullscreen
					})
				}, FullscreenPaneButton);
				yield ctx.slots.register({
					name: "conversation.session.header.actions",
					id: "panes-close",
					order: 1003,
					locale: NS,
					inject: () => ({
						closeFocused,
						hasSplit
					})
				}, ClosePaneButton);
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
