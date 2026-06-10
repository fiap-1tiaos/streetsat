import { i as __toESM, t as require_react } from "./react-B6BdZLWZ.js";
import { t as require_jsx_runtime } from "./jsx-runtime-gvUgNymC.js";
import { t as tsParticles } from "./browser-Bo2Gf3WI.js";
//#region node_modules/@tsparticles/react/ParticlesProvider.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var s = !1, c, l, u = (0, import_react.createContext)({ loaded: !1 }), d = ({ children: e, init: t }) => {
	let [d, f] = (0, import_react.useState)(s);
	(0, import_react.useEffect)(() => {
		let e = !1;
		if (!s) {
			if (!c) l = t, c = (async () => {
				await t(tsParticles), s = !0;
			})().catch((e) => {
				throw c = void 0, l = void 0, e;
			});
			else if (l && l !== t) throw Error("ParticlesProvider init callback must be stable across the app lifecycle.");
			return c.then(() => {
				e || f(!0);
			}).catch(() => {
				e || f(!1);
			}), () => {
				e = !0;
			};
		}
	}, [t]);
	let p = (0, import_react.useMemo)(() => ({ loaded: d }), [d]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(u.Provider, {
		value: p,
		children: d ? e : null
	});
};
function f() {
	return (0, import_react.useContext)(u);
}
//#endregion
//#region node_modules/@tsparticles/react/Particles.js
var i = (i) => {
	let { className: a, id: o, options: s, particlesLoaded: c, style: l, url: u } = i, { loaded: d } = f();
	return (0, import_react.useEffect)(() => {
		if (!d) return;
		let e, t = !1;
		return tsParticles.load({
			id: o ?? "tsparticles",
			url: u,
			options: s
		}).then((n) => {
			if (t) {
				n?.destroy();
				return;
			}
			e = n, c?.(n);
		}), () => {
			t = !0, e?.destroy();
		};
	}, [
		o,
		d,
		s,
		c,
		u
	]), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		id: o ?? "tsparticles",
		className: a,
		style: l
	});
};
//#endregion
//#region node_modules/@tsparticles/react/index.js
var r = i;
//#endregion
export { i as Particles, d as ParticlesProvider, r as default, f as useParticlesProvider };

//# sourceMappingURL=@tsparticles_react.js.map