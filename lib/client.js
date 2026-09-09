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
		//#region src/client/vendor/renderer/bindings.tsx
		/** Internal React bindings for renderer hosts and standard-source scopes. */
		/** Missing renderer assembly dependency. */
		var SlotAssemblyError = class extends Error {};
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
		/**
		* Bind an open-key source family.
		* @param source - keyed resolver, or absence for an optional scope.
		* @returns cached keyed selector Hook.
		*/
		function keyedObservableHook(source) {
			if (source === void 0) return absentKeyedHook;
			let hook = keyedHookCache.get(source);
			if (hook === void 0) {
				hook = (key, selector, equal) => {
					return observableHook(source(key) ?? absentSource)(selector ?? identity, equal);
				};
				keyedHookCache.set(source, hook);
			}
			return hook;
		}
		const keyedHookCache = /* @__PURE__ */ new WeakMap();
		const identity = (value) => value;
		const absentKeyedHook = (_key, selector, equal) => observableHook(absentSource)(selector ?? identity, equal);
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
			return props.renderSlot?.("conversation", {}) ?? null;
		}
		//#endregion
		//#region src/client/pane-store.ts
		/** Marks a handle whose `create` this module memoizes. */
		const MEMOIZED = Symbol.for("@dsh-external/dsh-split-panes.memoizedStoreCreate");
		/** Every cache this module created (pruning walks them). */
		const caches = /* @__PURE__ */ new Set();
		/** handle identity → scope key → instance. */
		const perHandle = /* @__PURE__ */ new WeakMap();
		/**
		* Memoize one handle's `create(scopeKey)` per key (idempotent).
		* @param handle - engine store handle declared by an entry.
		* @returns the handle's per-key instance cache.
		*/
		function memoizeHandle(handle) {
			let cache = perHandle.get(handle);
			if (cache === void 0) {
				cache = /* @__PURE__ */ new Map();
				perHandle.set(handle, cache);
				caches.add(cache);
			}
			const mutable = handle;
			if (mutable[MEMOIZED] !== true && !Object.isFrozen(handle)) {
				const original = mutable.create;
				mutable.create = function(nextKey) {
					const key = nextKey ?? "";
					let instance = cache.get(key);
					if (instance === void 0) {
						instance = original.call(this, nextKey);
						cache.set(key, instance);
					}
					return instance;
				};
				mutable[MEMOIZED] = true;
			}
			return cache;
		}
		/**
		* Resolve one handle's instance for one scope key, sharing it with every other
		* consumer of the same handle.
		* @param handle - engine store handle declared by an entry.
		* @param scopeKey - session id for session-scoped handles; undefined for root.
		* @returns the shared instance.
		*/
		function storeInstanceOf(handle, scopeKey) {
			const cache = memoizeHandle(handle);
			const key = scopeKey ?? "";
			let instance = cache.get(key);
			if (instance === void 0) {
				instance = handle.create(scopeKey);
				cache.set(key, instance);
			}
			return instance;
		}
		/** Collect every declared slot key reachable from an inspection snapshot. */
		function slotKeys(nodes, into = /* @__PURE__ */ new Set()) {
			for (const node of nodes) {
				into.add(node.name);
				if (node.children !== void 0) slotKeys(node.children, into);
			}
			return into;
		}
		/**
		* Share every declared store handle with the core, and keep sharing the ones
		* registered later. Runs at plugin apply (before the shell mounts), so a pane
		* never races the core's own resolution.
		*
		* Also prunes memoized instances for sessions that no longer exist, so a
		* long-lived process does not retain one store per session ever viewed.
		* @param ctx - client context carrying the slot registry and session roster.
		*/
		function installStoreSharing(ctx) {
			const patchDeclared = () => {
				const snapshot = ctx.slots.snapshot;
				if (typeof snapshot !== "function") return;
				for (const key of slotKeys(snapshot.call(ctx.slots))) for (const entry of ctx.slots.entries(key)) {
					const handle = entry.store;
					if (handle !== void 0) memoizeHandle(handle);
				}
			};
			patchDeclared();
			ctx.effect(() => {
				let scheduled = false;
				const onChanged = () => {
					if (scheduled) return;
					scheduled = true;
					queueMicrotask(() => {
						scheduled = false;
						try {
							patchDeclared();
						} catch (error) {
							console.error("[dsh-split-panes] store sharing scan failed:", error);
						}
					});
				};
				const disposeChanged = typeof ctx.on === "function" ? ctx.on("slots/changed", onChanged) : () => {};
				const sessions = ctx.sessions;
				const disposeList = sessions.list === void 0 ? () => {} : sessions.list.subscribe(() => {
					const snapshot = sessions.list.getSnapshot();
					if (snapshot === void 0 || snapshot.phase !== "ready") return;
					for (const cache of caches) for (const key of [...cache.keys()]) if (key !== "" && snapshot.byId[key] === void 0) cache.delete(key);
				});
				return () => {
					disposeChanged();
					disposeList();
				};
			}, "ui-panes: store sharing");
		}
		//#endregion
		//#region src/client/pane-host.ts
		/** The synthetic 'root' occupant: a one-line dispatch into 'conversation'. */
		const PANE_ROOT_ENTRY = {
			component: PaneRoot,
			options: { id: "panes.root" },
			children: { "conversation": {
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
		* The absent scope binding for a new-conversation pane, derived from the
		* installed adapter so it carries EXACTLY the declared source roster (a
		* hand-written shape would miss any hook a later package provides, and a
		* missing seat makes a session-maybe occupant read `undefined` as a hook
		* function — the "useConversation is not a function" failure).
		*
		* With no selection at all the adapter's current binding IS the core's own
		* absent binding, so it is returned as-is.
		* @param ctx - client context carrying uiSession.
		* @returns the absent binding shape.
		*/
		function paneAbsentBinding(ctx) {
			const current = ctx.uiSession.adapter.current.getSnapshot();
			if (current.key === void 0) return current;
			const hooks = {};
			for (const name of Object.keys(current.hooks)) hooks[name] = void 0;
			const keyedHooks = {};
			for (const name of Object.keys(current.keyedHooks)) keyedHooks[name] = void 0;
			const props = {};
			for (const name of Object.keys(current.props)) props[name] = void 0;
			return {
				key: void 0,
				hooks,
				keyedHooks,
				props
			};
		}
		/** The cell one entry occupies under its slot's kind (mirrors SlotCore). */
		function cellOf(kind, entry) {
			if (kind === "keyed") return entry.options.key ?? "";
			if (kind === "list") return entry.options.id ?? "";
			return "";
		}
		/** Resolve one entry store's instance for one scope key (shared with the core). */
		function storeOf(entry, binding) {
			const handle = entry.store;
			if (handle === void 0 || typeof handle.create !== "function") return void 0;
			return storeInstanceOf(handle, binding?.key);
		}
		/**
		* Build the render host for one pane.
		*
		* The host is created per pane session (the memoized `PaneConversation`
		* owns its lifetime); its ledger reads stay live, so late registrations
		* (view tabs, node renderers, docks) appear in every pane as they land.
		* @param options - ledger, adapter, root binding, pane binding, wrappers.
		* @returns the renderer host for this pane.
		*/
		function createPaneHost(options) {
			const { ledger, adapter, locale, root, binding } = options;
			const excluded = options.excluded ?? (() => false);
			const wrap = options.wrap ?? ((entry) => entry);
			const paneBinding = binding ?? options.absent ?? {
				key: void 0,
				hooks: {},
				keyedHooks: {},
				props: {}
			};
			/** Entries retired by an abdicating crash (mirrors SlotCore's WeakSet). */
			const abdicated = /* @__PURE__ */ new WeakSet();
			/** Local version bumps so outlets re-read the ledger after an abdication. */
			const localVersions = /* @__PURE__ */ new Map();
			const listeners = /* @__PURE__ */ new Map();
			const ledgerDisposers = /* @__PURE__ */ new Map();
			/** Wrapped-entry cache: the renderer caches inject faces per entry identity. */
			const wrapped = /* @__PURE__ */ new WeakMap();
			const bump = (key) => {
				localVersions.set(key, (localVersions.get(key) ?? 0) + 1);
				const set = listeners.get(key);
				if (set === void 0) return;
				for (const listener of [...set]) try {
					listener();
				} catch (error) {
					console.error("[dsh-split-panes] pane ledger subscriber failed:", error);
				}
			};
			const wrappedEntry = (entry) => {
				let value = wrapped.get(entry);
				if (value === void 0) {
					value = wrap(entry);
					wrapped.set(entry, value);
				}
				return value;
			};
			/** Elect one winner per cell, mirroring SlotCore's shadowing projection. */
			const winnersOf = (key) => {
				const all = ledger.entries(key);
				const kind = (ledger.spec(key) ?? (key === "root" ? ROOT_SPEC : void 0))?.kind ?? "single";
				if (kind === "chain") return all.filter((entry) => !abdicated.has(entry) && !excluded(entry));
				const order = /* @__PURE__ */ new Map();
				all.forEach((entry, index) => {
					order.set(entry, index);
				});
				const best = /* @__PURE__ */ new Map();
				for (const entry of all) {
					if (abdicated.has(entry) || excluded(entry)) continue;
					const cell = cellOf(kind, entry);
					const incumbent = best.get(cell);
					if (incumbent === void 0) {
						best.set(cell, entry);
						continue;
					}
					const challenger = entry.options.priority ?? 0;
					const holding = incumbent.options.priority ?? 0;
					if (challenger < holding || challenger === holding && (order.get(entry) ?? 0) < (order.get(incumbent) ?? 0)) best.set(cell, entry);
				}
				return [...best.values()];
			};
			const paneScope = {
				current: {
					getSnapshot: () => paneBinding,
					subscribe: () => () => {}
				},
				resolve: (key) => adapter.resolve(key),
				...adapter.renderArea === void 0 ? {} : { renderArea: (value, props) => adapter.renderArea(value, props) }
			};
			return {
				subscribe(key, fn) {
					let set = listeners.get(key);
					if (set === void 0) {
						set = /* @__PURE__ */ new Set();
						listeners.set(key, set);
						ledgerDisposers.set(key, ledger.subscribe(key, () => {
							bump(key);
						}));
					}
					set.add(fn);
					return () => {
						set?.delete(fn);
						if (set !== void 0 && set.size === 0) {
							listeners.delete(key);
							ledgerDisposers.get(key)?.();
							ledgerDisposers.delete(key);
						}
					};
				},
				getVersion: (key) => ledger.getVersion(key) + (localVersions.get(key) ?? 0),
				entriesOf: (key) => {
					if (key === "root") return [PANE_ROOT_ENTRY];
					return ledger.entries(key).filter((entry) => !excluded(entry)).map(wrappedEntry);
				},
				entriesOfSlot: (key) => {
					if (key === "root") return [PANE_ROOT_ENTRY];
					return winnersOf(key).map(wrappedEntry);
				},
				isLive: () => true,
				reportEntryError(key, entry, error, info) {
					console.error(`[dsh-split-panes] pane occupant crashed in '${key}':`, error);
					options.onCrash?.(key, entry, error);
					if (!info.abdicate) return;
					abdicated.add(entry);
					bump(key);
				},
				specOf: (key) => {
					if (key === "root") return ROOT_SPEC;
					return ledger.spec(key);
				},
				storeOf: (entry, scopeBinding) => storeOf(entry, scopeBinding),
				root,
				scopeRevision: {
					getSnapshot: () => 0,
					subscribe: () => () => {}
				},
				scope: (scope) => scope === "session" || scope === "session-maybe" ? paneScope : void 0,
				...locale !== void 0 ? { locale } : {}
			};
		}
		//#endregion
		//#region src/client/pane-session.ts
		/**
		* Ensure one session's history window is open, without selecting it.
		* @param ctx - client context carrying `sessions`.
		* @param sessionId - pane session id (undefined = new-conversation pane).
		*/
		function ensureSessionOpen(ctx, sessionId) {
			if (sessionId === void 0) return;
			const sessions = ctx.get("sessions");
			if (typeof sessions?.binding !== "function") return;
			try {
				const face = sessions.binding(sessionId)?.session;
				if (typeof face?.open === "function") face.open();
			} catch (error) {
				console.error("[dsh-split-panes] could not open pane session window:", error);
			}
		}
		//#endregion
		//#region src/client/vendor/renderer/scoped-slots.tsx
		/**
		* React renderer for declarative slots. Per-entry bindings enforce child
		* authorization, and entry boundaries contain registrant failures.
		*/
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
						opts
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
						opts
					});
				};
				renderSlotChainCache.set(entry, binding);
			}
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
		* winner per position (single/keyed/list cell head, chain election) through
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
		/**
		* Per-entry isolation: one registrant crashing (component render or inject
		* factory) must not take down siblings. Assembly errors (missing providers)
		* rethrow — a miswired shell must fail loud, not degrade into fallbacks.
		* Every catch reports through `onEntryError` (the ledger's supervision
		* seam); for shadowing kinds the report abdicates the entry, the outlet
		* re-renders onto the cell's next survivor, and this boundary's crash face
		* only shows until that re-render lands (permanently once the cell is dry —
		* the outlet then owns the crash face).
		*/
		var SlotErrorBoundary = class extends react.Component {
			state = { failed: false };
			static getDerivedStateFromError(error) {
				if (error instanceof SlotAssemblyError) throw error;
				return { failed: true };
			}
			componentDidCatch(error) {
				console.error(`slot entry crashed in '${this.props.slotKey}':`, error);
				this.props.onEntryError(error);
			}
			render() {
				if (this.state.failed) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { "data-slot-error": this.props.slotKey });
				return this.props.children;
			}
		};
		const rootStandardCache = /* @__PURE__ */ new WeakMap();
		const sessionStandardCache = /* @__PURE__ */ new WeakMap();
		const sessionMaybeStandardCache = /* @__PURE__ */ new WeakMap();
		/** Materialize one binding into stable framework Hook and plain-prop seats. */
		function materializeStandardBinding(binding, optional) {
			const standard = { ...binding.props };
			for (const [name, source] of Object.entries(binding.hooks)) {
				if (source === void 0 && !optional) throw new SlotAssemblyError(`strict standard hook '${name}' has no source`);
				standard[(0, _deepseek_ai_dsh_client_ui_slots.standardHookPropName)(name)] = optional ? maybeObservableHook(source) : observableHook(source);
			}
			for (const [name, source] of Object.entries(binding.keyedHooks)) {
				if (source === void 0 && !optional) throw new SlotAssemblyError(`strict keyed standard hook '${name}' has no source resolver`);
				standard[(0, _deepseek_ai_dsh_client_ui_slots.standardHookPropName)(name)] = keyedObservableHook(source);
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
				...root,
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
				return renderArea(useScopeBinding(), props);
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
			const kit = { ...standard };
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
				if (Object.values(entry.children).some((spec) => spec.scope === "session")) {
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
		function ContextualEntry({ slotKey, Comp, kit, standard, injected, slotInjected, ownerProps, hookContext, hasHookContext }) {
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
				...ownerProps
			});
		}
		function renderEntry(slotKey, Comp, kit, standard, injected, slotInjected, ownerProps, hookContext, hasHookContext) {
			if (slotInjected.slotHookFactories === void 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Comp, {
				...kit,
				...injected,
				...slotInjected.props,
				...ownerProps
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
				hasHookContext
			});
		}
		function SessionEntry({ entry, ownerProps, binding, slotKey, slotInjected, hookContext, hasHookContext }) {
			const host = useHost();
			const rootBinding = useRootBinding();
			const Comp = entry.component;
			const { kit, standard, actions } = standardKit(host, entry, "session", rootBinding, binding);
			return renderEntry(slotKey, Comp, kit, standard, cachedSessionInject(entry, binding, actions), slotInjected, ownerProps, hookContext, hasHookContext);
		}
		function SessionMaybeEntryBody({ entry, ownerProps, binding, slotKey, slotInjected, hookContext, hasHookContext }) {
			const host = useHost();
			const rootBinding = useRootBinding();
			const Comp = entry.component;
			const { kit, standard, actions } = standardKit(host, entry, "session-maybe", rootBinding, binding);
			return renderEntry(slotKey, Comp, kit, standard, cachedSessionMaybeInject(entry, binding, actions), slotInjected, ownerProps, hookContext, hasHookContext);
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
		function SessionMaybeEntry({ entry, ownerProps, slotKey, slotInjected, hookContext, hasHookContext }) {
			const binding = useScopeBinding();
			const [state, setState] = (0, react.useState)(FIRST_INCARNATION);
			let { adopted, epoch } = state;
			if (binding.key !== void 0 && adopted === void 0) {
				adopted = binding.key;
				setState({
					adopted,
					epoch
				});
			} else if (adopted !== void 0 && binding.key !== void 0 && binding.key !== adopted) {
				adopted = binding.key;
				epoch += 1;
				setState({
					adopted,
					epoch
				});
			} else if (adopted !== void 0 && binding.key === void 0) {
				adopted = void 0;
				epoch += 1;
				setState({
					adopted,
					epoch
				});
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionMaybeEntryBody, {
				entry,
				ownerProps,
				binding,
				slotKey,
				slotInjected,
				hookContext,
				hasHookContext
			}, epoch);
		}
		const FIRST_INCARNATION = {
			adopted: void 0,
			epoch: 0
		};
		function RootEntry({ entry, ownerProps, slotKey, slotInjected, hookContext, hasHookContext }) {
			const host = useHost();
			const rootBinding = useRootBinding();
			const Comp = entry.component;
			const { kit, standard, actions } = standardKit(host, entry, "root", rootBinding, void 0);
			return renderEntry(slotKey, Comp, kit, standard, cachedRootInject(entry, actions), slotInjected, ownerProps, hookContext, hasHookContext);
		}
		function StrictSessionEntry({ slotKey, entry, ownerProps, slotInjected, hookContext, hasHookContext, onEntryError }) {
			const binding = useScopeBinding();
			if (binding.key === void 0) throw new SlotAssemblyError(`strict session slot '${slotKey}' rendered without a scope binding`);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlotErrorBoundary, {
				slotKey,
				onEntryError,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SessionEntry, {
					entry,
					ownerProps,
					binding,
					slotKey,
					slotInjected,
					hookContext,
					hasHookContext
				})
			}, binding.key);
		}
		/**
		* Anchor style shared by every outlet wrapper: `display:contents` keeps the
		* wrapper out of layout (grid/flex parents see the slot's own children), so
		* the anchor is purely addressable surface. Module-level constant — a stable
		* reference so the wrapper never diffs its style prop.
		*/
		const ANCHOR_STYLE = { display: "contents" };
		function SlotOutlet({ slotKey, ownerProps, opts }) {
			const host = useHost();
			(0, react.useSyncExternalStore)((fn) => host.subscribe(slotKey, fn), () => host.getVersion(slotKey));
			useLocaleRevision(host.locale);
			const scopeBinding = useScopeBinding();
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				"data-slot": slotKey,
				style: ANCHOR_STYLE,
				children: renderOutletContent(host, slotKey, ownerProps, opts, scopeBinding)
			});
		}
		/** Kind dispatch behind the outlet anchor (single/keyed/list/chain, fallbacks, crash faces). */
		function renderOutletContent(host, slotKey, ownerProps, opts, scopeBinding) {
			const spec = host.specOf(slotKey);
			if (!spec) return null;
			if (spec.kind === "chain" && opts?.fallbackOnly === true) return renderChainResult(slotKey, null, opts);
			if (spec.scope === "session" && scopeBinding.key === void 0) throw new SlotAssemblyError(`strict session slot '${slotKey}' rendered without a scope binding`);
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
					entry,
					ownerProps: owner,
					slotInjected,
					hookContext,
					hasHookContext,
					onEntryError
				}, key) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlotErrorBoundary, {
					slotKey,
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
			const deadCell = () => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { "data-slot-error": slotKey });
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
				return renderChainResult(slotKey, elected, opts);
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
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: list.map((item, i) => item.entry !== void 0 ? guarded(item.entry, `e${entryKeyOf(item.entry)}`) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { "data-slot-error": slotKey }, `x${item.id ?? i}`)) });
		}
		/** Render a chain election while preserving the overlay fallback's tree position. */
		function renderChainResult(slotKey, elected, opts) {
			if (!opts?.overlay) return elected ?? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: opts?.fallback ?? null });
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
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
		* (see `vendor/renderer/README.md`); the host is `createPaneHost` with this
		* pane's session binding. The renderer's root outlet dispatches 'conversation',
		* which elects the STOCK ConversationRoot (the pane host filters this
		* plugin's own shadow out of its ledger view) under the pane's scope — so the
		* native header, session body, composer chain and hero render here exactly as
		* they do for the current session in an unmodified shell.
		*
		* The host is memoized per (deps, pane binding): the renderer caches inject
		* faces, store instances and hooks per host identity, so a stable host is
		* what keeps component subscriptions from churning.
		*/
		/** The renderer product, created once (it is stateless between renders). */
		const RENDERER = createSlotRenderer();
		/**
		* Render one pane's native conversation.
		* @param props - deps + pane identity + session.
		* @returns the pane's conversation subtree.
		*/
		const PaneConversation = (0, react.memo)(function PaneConversation({ deps, sessionId, paneId }) {
			const { ctx } = deps;
			const binding = sessionId === void 0 ? void 0 : ctx.uiSession.adapter.resolve(sessionId);
			(0, react.useEffect)(() => {
				ensureSessionOpen(ctx, sessionId);
			}, [ctx, sessionId]);
			const host = (0, react.useMemo)(() => createPaneHost({
				ledger: deps.ledger,
				adapter: ctx.uiSession.adapter,
				locale: ctx.locale,
				root: deps.rootSource,
				binding,
				absent: binding === void 0 ? paneAbsentBinding(ctx) : void 0,
				excluded: deps.excluded,
				wrap: (entry) => deps.wrapEntry(entry, paneId),
				onCrash: (key, entry, error) => {
					console.error(`[dsh-split-panes] pane ${paneId} occupant crashed in '${key}':`, error, entry.options);
				}
			}), [
				deps,
				binding,
				paneId,
				ctx
			]);
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
		//#region \0dsh-css:E:\dev\dsh-split-panes\src\client\SplitContainer.module.css.mjs
		const css$2 = ".ytwmKG_host{flex:1;min-width:0;min-height:0;display:flex}.ytwmKG_split{flex:1;min-width:0;min-height:0;display:grid}.ytwmKG_paneSide{min-width:0;min-height:0;display:flex}.ytwmKG_paneSide>*{flex:1;min-width:0;min-height:0}.ytwmKG_divider{z-index:1;touch-action:none;cursor:col-resize;background:0 0;position:relative}.ytwmKG_split[data-direction=vertical] .ytwmKG_divider{cursor:row-resize}.ytwmKG_divider:hover,.ytwmKG_divider:focus-visible{background:var(--dsw-alias-interactive-bg-hover);outline:none}";
		const tagId$2 = "@dsh-external/dsh-split-panes/SplitContainer.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-split-panes";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var SplitContainer_module_css_default = {
			"divider": "ytwmKG_divider",
			"split": "ytwmKG_split",
			"host": "ytwmKG_host",
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
		/** Enter fullscreen: corner arrows pointing outward. */
		function IconFullscreen16(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...props,
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M6 2.5H2.5V6M10 2.5h3.5V6M6 13.5H2.5V10M10 13.5h3.5V10",
					stroke: "currentColor",
					strokeWidth: "1.2",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				})
			});
		}
		/** Leave fullscreen: corner arrows pointing inward. */
		function IconFullscreenExit16(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
				...props,
				width: "16",
				height: "16",
				viewBox: "0 0 16 16",
				fill: "none",
				"aria-hidden": "true",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
					d: "M2.5 6H6V2.5M13.5 6H10V2.5M2.5 10H6v3.5M13.5 10H10v3.5",
					stroke: "currentColor",
					strokeWidth: "1.2",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				})
			});
		}
		//#endregion
		//#region \0dsh-css:E:\dev\dsh-split-panes\src\client\PaneDropOverlay.module.css.mjs
		const css$1 = ".kY1GGq_layer{z-index:30;pointer-events:none;position:absolute;inset:0}.kY1GGq_center,.kY1GGq_left,.kY1GGq_right,.kY1GGq_top,.kY1GGq_bottom{border:1px solid var(--dsw-static-deepseek-500);background:color-mix(in srgb, var(--dsw-static-deepseek-500) 12%, transparent);border-radius:10px;position:absolute}.kY1GGq_center{inset:20%}.kY1GGq_left{left:var(--drop-pad,0px);right:calc(50% + 3px);top:var(--drop-pad,0px);bottom:var(--drop-pad,0px)}.kY1GGq_right{left:calc(50% + 3px);right:var(--drop-pad,0px);top:var(--drop-pad,0px);bottom:var(--drop-pad,0px)}.kY1GGq_top{left:var(--drop-pad,0px);right:var(--drop-pad,0px);top:var(--drop-pad,0px);bottom:calc(50% + 3px)}.kY1GGq_bottom{left:var(--drop-pad,0px);right:var(--drop-pad,0px);top:calc(50% + 3px);bottom:var(--drop-pad,0px)}.kY1GGq_center,.kY1GGq_left,.kY1GGq_right,.kY1GGq_top,.kY1GGq_bottom{transition:left .15s ease-out,right .15s ease-out,top .15s ease-out,bottom .15s ease-out}";
		const tagId$1 = "@dsh-external/dsh-split-panes/PaneDropOverlay.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-split-panes";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var PaneDropOverlay_module_css_default = {
			"layer": "kY1GGq_layer",
			"right": "kY1GGq_right",
			"left": "kY1GGq_left",
			"top": "kY1GGq_top",
			"bottom": "kY1GGq_bottom",
			"center": "kY1GGq_center"
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
		//#region \0dsh-css:E:\dev\dsh-split-panes\src\client\PaneWorkspace.module.css.mjs
		const css = ".wYQfYq_host{flex:1;min-width:0;min-height:0;padding:8px;display:flex}.wYQfYq_singleSurface{--drop-pad:8px;flex-direction:column;flex:1;min-width:0;min-height:0;display:flex;position:relative}.wYQfYq_pane{background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;flex-direction:column;flex:1;min-width:0;min-height:0;display:flex;position:relative;overflow:hidden}.wYQfYq_pane>*{flex:1;min-width:0;min-height:0}.wYQfYq_pane[data-focused]{border-color:var(--dsw-static-deepseek-500)}.wYQfYq_fullscreenHost{flex-direction:column;flex:1;min-width:0;min-height:0;display:flex;position:relative}.wYQfYq_paneFullscreen{background:0 0;border-color:#0000;border-radius:0}.wYQfYq_heroHeader{min-height:32px;padding:var(--pane-pad-top,12px) 20px 0;flex:none;justify-content:space-between;align-items:center;gap:16px;display:flex}.wYQfYq_heroTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-primary);flex:1;font-size:13px;font-weight:500;line-height:16px;overflow:hidden}.wYQfYq_heroActions{flex:none;align-items:center;gap:2px;display:flex}.wYQfYq_pane{--pane-pad-top:3px}.wYQfYq_splitButton,.wYQfYq_closeButton,.wYQfYq_heroButton{width:28px;height:28px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;border-radius:6px;justify-content:center;align-items:center;padding:0;display:flex}.wYQfYq_splitButton:hover,.wYQfYq_splitButton:focus-visible,.wYQfYq_closeButton:hover,.wYQfYq_closeButton:focus-visible,.wYQfYq_heroButton:hover,.wYQfYq_heroButton:focus-visible{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}";
		const tagId = "@dsh-external/dsh-split-panes/PaneWorkspace.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@dsh-external/dsh-split-panes";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var PaneWorkspace_module_css_default = {
			"heroHeader": "wYQfYq_heroHeader",
			"pane": "wYQfYq_pane",
			"closeButton": "wYQfYq_closeButton",
			"paneFullscreen": "wYQfYq_paneFullscreen",
			"heroTitle": "wYQfYq_heroTitle",
			"singleSurface": "wYQfYq_singleSurface",
			"heroActions": "wYQfYq_heroActions",
			"splitButton": "wYQfYq_splitButton",
			"host": "wYQfYq_host",
			"heroButton": "wYQfYq_heroButton",
			"fullscreenHost": "wYQfYq_fullscreenHost"
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
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
						})
					]
				})]
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
			const current = useSessions((s) => s.current);
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
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutline16, {})
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
		//#region src/client/root-binding.ts
		/**
		* Build the root standard-source observable a pane host hands the renderer.
		* @param ctx - client root context carrying the root feeds.
		* @returns an observable of the root binding (republishes as owners load).
		*/
		function createPaneRootSource(ctx) {
			const listeners = /* @__PURE__ */ new Set();
			const extraHooks = {};
			const extraKeyedHooks = {};
			const baseHooks = {};
			const sessionsFeed = ctx.sessions?.list;
			if (sessionsFeed !== void 0) baseHooks["sessions"] = sessionsFeed;
			const pendingFeed = ctx.uiSession?.pendingInteractions;
			if (pendingFeed !== void 0) baseHooks["sessionPendingInteraction"] = pendingFeed;
			const assemble = () => ({
				key: void 0,
				hooks: {
					...baseHooks,
					...extraHooks
				},
				keyedHooks: { ...extraKeyedHooks },
				props: {}
			});
			let binding = assemble();
			const publish = () => {
				binding = assemble();
				for (const listener of [...listeners]) try {
					listener();
				} catch (error) {
					console.error("[dsh-split-panes] root binding subscriber failed:", error);
				}
			};
			ctx.inject(["workspaces"], (scoped) => {
				extraHooks["workspaces"] = scoped.workspaces.list;
				publish();
				return () => {
					delete extraHooks["workspaces"];
					publish();
				};
			});
			ctx.inject(["resources"], (scoped) => {
				const resources = scoped.resources;
				if (resources === void 0) return;
				extraKeyedHooks["resource"] = (address) => resources.source(address);
				publish();
				return () => {
					delete extraKeyedHooks["resource"];
					publish();
				};
			});
			return {
				getSnapshot: () => binding,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				}
			};
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
			"pane.split.divider": "调整分屏比例",
			"pane.new.conversation": "新建对话"
		};
		const en = {
			"pane.split": "Split",
			"pane.split.horizontal": "Split horizontal",
			"pane.split.vertical": "Split vertical",
			"pane.close": "Close pane",
			"pane.fullscreen": "Fullscreen pane",
			"pane.fullscreen.exit": "Exit fullscreen",
			"pane.split.divider": "Resize split",
			"pane.new.conversation": "New conversation"
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
			"uiSession"
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
				rootSource: createPaneRootSource(ctx),
				ledger: {
					entries: (key) => ctx.slots.entries(key),
					entriesOfSlot: (key) => ctx.slots.entriesOfSlot(key),
					spec: (key) => ctx.slots.spec(key),
					subscribe: (key, fn) => ctx.slots.subscribe(key, fn),
					getVersion: (key) => ctx.slots.getVersion(key)
				},
				excluded: (entry) => entry.component === PaneWorkspace,
				wrapEntry: (entry, paneId) => wrapPaneEntry(entry, paneId, {
					ctx,
					onSessionStarted: (paneId_, sessionId) => {
						paneActions.setPaneSession(paneId_, sessionId);
						paneActions.focusPane(paneId_);
					}
				})
			};
			/** The header affordances operate on the shared tree's FOCUSED pane. */
			const splitFocused = (direction) => {
				const state = paneTree();
				const paneId = state.focusedPaneId ?? allLeaves(state.root)[0]?.id;
				if (paneId === void 0) return;
				paneActions.splitPane(paneId, direction, state.root.type === "leaf" ? ctx.sessions.list.getSnapshot().current ?? null : null);
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
					ctx.sessions.open(sessionId);
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
			installStoreSharing(ctx);
			ctx.slots.register({
				name: "conversation",
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
		/** Wrapped conversation entries: inject provenance per (entry, pane). */
		const wrappedEntries = /* @__PURE__ */ new WeakMap();
		/**
		* Wrap one pane's copy of an entry so the stock `selectWorkspace` inject
		* reports the session it just created back to the pane that owns it.
		*
		* A pane's hero picker creates a session through the stock inject (workspace
		* connect + draft migration, all core logic) and selects it globally. Without
		* this provenance the pane that owns the hero would not adopt the new session
		* — the selection-change effect would bind whichever pane is focused.
		*
		* The wrapper is cached per (entry, pane): the renderer caches inject faces
		* and hooks by entry identity, so a fresh object per render would churn every
		* subscription in the pane.
		* @param entry - ledger entry.
		* @param paneId - owning pane.
		* @param hooks - client context + adoption callback.
		* @returns the wrapped entry (the original when it has no inject face).
		*/
		function wrapPaneEntry(entry, paneId, hooks) {
			const inject = entry.inject;
			if (inject === void 0) return entry;
			let perPane = wrappedEntries.get(entry);
			if (perPane === void 0) {
				perPane = /* @__PURE__ */ new Map();
				wrappedEntries.set(entry, perPane);
			}
			let wrapped = perPane.get(paneId);
			if (wrapped !== void 0) return wrapped;
			wrapped = {
				...entry,
				inject: (...args) => {
					const face = inject(...args);
					const selectWorkspace = face["selectWorkspace"];
					if (typeof selectWorkspace !== "function") return face;
					return {
						...face,
						selectWorkspace: async (workspaceId) => {
							const result = await selectWorkspace(workspaceId);
							const created = hooks.ctx.sessions.list.getSnapshot().current;
							if (created !== void 0) hooks.onSessionStarted(paneId, created);
							return result;
						}
					};
				}
			};
			perPane.set(paneId, wrapped);
			return wrapped;
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
