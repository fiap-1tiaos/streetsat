import { A as AnimationStatus, E as StartValueType, F as checkDistance, G as getRangeValue, H as getRandom, I as clamp, J as randomInRangeValue, K as mix, Q as isNull, U as getRandomInRange, X as isArray, Y as setRangeValue, ft as randomColorValue, j as AnimationMode, lt as half, tt as isString, ut as millisecondsToSeconds, v as itemFromArray } from "./browser-Bo2Gf3WI.js";
//#region node_modules/@tsparticles/engine/browser/Enums/RangeType.js
var RangeType;
(function(RangeType) {
	RangeType["circle"] = "circle";
	RangeType["rectangle"] = "rectangle";
})(RangeType || (RangeType = {}));
//#endregion
//#region node_modules/@tsparticles/engine/browser/Core/Utils/Ranges.js
var BaseRange = class {
	position;
	type;
	constructor(x, y, type) {
		this.position = {
			x,
			y
		};
		this.type = type;
	}
	_resetPosition(x, y) {
		this.position.x = x;
		this.position.y = y;
	}
};
var Circle = class Circle extends BaseRange {
	radius;
	constructor(x, y, radius) {
		super(x, y, RangeType.circle);
		this.radius = radius;
	}
	contains(point) {
		return checkDistance(point, this.position, this.radius);
	}
	intersects(range) {
		const pos1 = this.position, pos2 = range.position, r = this.radius, dx = Math.abs(pos2.x - pos1.x), dy = Math.abs(pos2.y - pos1.y);
		if (range instanceof Circle || range.type === RangeType.circle) return r + range.radius > Math.hypot(dx, dy);
		else if (range instanceof Rectangle || range.type === RangeType.rectangle) {
			const { width, height } = range.size;
			return Math.pow(dx - width, 2) + Math.pow(dy - height, 2) <= r ** 2 || dx <= r + width && dy <= r + height || dx <= width || dy <= height;
		}
		return false;
	}
	reset(x, y, radius) {
		this._resetPosition(x, y);
		this.radius = radius;
		return this;
	}
};
var Rectangle = class Rectangle extends BaseRange {
	size;
	constructor(x, y, width, height) {
		super(x, y, RangeType.rectangle);
		this.size = {
			height,
			width
		};
	}
	contains(point) {
		const w = this.size.width, h = this.size.height, pos = this.position;
		return point.x >= pos.x && point.x <= pos.x + w && point.y >= pos.y && point.y <= pos.y + h;
	}
	intersects(range) {
		if (range instanceof Circle) return range.intersects(this);
		if (!(range instanceof Rectangle)) return false;
		const w = this.size.width, h = this.size.height, pos1 = this.position, pos2 = range.position, size2 = range.size, w2 = size2.width, h2 = size2.height;
		return pos2.x < pos1.x + w && pos2.x + w2 > pos1.x && pos2.y < pos1.y + h && pos2.y + h2 > pos1.y;
	}
	reset(x, y, width, height) {
		this._resetPosition(x, y);
		this.size.width = width;
		this.size.height = height;
		return this;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Enums/Modes/OutMode.js
var OutMode;
(function(OutMode) {
	OutMode["bounce"] = "bounce";
	OutMode["none"] = "none";
	OutMode["out"] = "out";
	OutMode["destroy"] = "destroy";
	OutMode["split"] = "split";
})(OutMode || (OutMode = {}));
//#endregion
//#region node_modules/@tsparticles/engine/browser/Enums/Types/AlterType.js
var AlterType;
(function(AlterType) {
	AlterType["darken"] = "darken";
	AlterType["enlighten"] = "enlighten";
})(AlterType || (AlterType = {}));
//#endregion
//#region node_modules/@tsparticles/engine/browser/Enums/Types/ParticleOutType.js
var ParticleOutType;
(function(ParticleOutType) {
	ParticleOutType["normal"] = "normal";
	ParticleOutType["inside"] = "inside";
	ParticleOutType["outside"] = "outside";
})(ParticleOutType || (ParticleOutType = {}));
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/AnimationOptions.js
var AnimationOptions = class {
	count;
	decay;
	delay;
	enable;
	speed;
	sync;
	constructor() {
		this.count = 0;
		this.enable = false;
		this.speed = 1;
		this.decay = 0;
		this.delay = 0;
		this.sync = false;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.count !== void 0) this.count = setRangeValue(data.count);
		if (data.enable !== void 0) this.enable = data.enable;
		if (data.speed !== void 0) this.speed = setRangeValue(data.speed);
		if (data.decay !== void 0) this.decay = setRangeValue(data.decay);
		if (data.delay !== void 0) this.delay = setRangeValue(data.delay);
		if (data.sync !== void 0) this.sync = data.sync;
	}
};
var RangedAnimationOptions = class extends AnimationOptions {
	mode;
	startValue;
	constructor() {
		super();
		this.mode = AnimationMode.auto;
		this.startValue = StartValueType.random;
	}
	load(data) {
		super.load(data);
		if (isNull(data)) return;
		if (data.mode !== void 0) this.mode = data.mode;
		if (data.startValue !== void 0) this.startValue = data.startValue;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/ColorAnimation.js
var ColorAnimation = class extends AnimationOptions {
	max;
	min;
	offset;
	constructor(min, max) {
		super();
		this.min = min;
		this.max = max;
		this.offset = 0;
		this.sync = true;
	}
	load(data) {
		super.load(data);
		if (isNull(data)) return;
		if (data.max !== void 0) this.max = data.max;
		if (data.min !== void 0) this.min = data.min;
		if (data.offset !== void 0) this.offset = setRangeValue(data.offset);
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/HslAnimation.js
var HslAnimation = class {
	h = new ColorAnimation(0, 360);
	l = new ColorAnimation(0, 100);
	s = new ColorAnimation(0, 100);
	load(data) {
		if (isNull(data)) return;
		this.h.load(data.h);
		this.s.load(data.s);
		this.l.load(data.l);
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/OptionsColor.js
var OptionsColor = class OptionsColor {
	value;
	constructor() {
		this.value = "";
	}
	static create(source, data) {
		const color = new OptionsColor();
		color.load(source);
		if (data !== void 0) if (isString(data) || isArray(data)) color.load({ value: data });
		else color.load(data);
		return color;
	}
	load(data) {
		if (isNull(data)) return;
		if (!isNull(data.value)) this.value = data.value;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/AnimatableColor.js
var AnimatableColor = class AnimatableColor extends OptionsColor {
	animation;
	constructor() {
		super();
		this.animation = new HslAnimation();
	}
	static create(source, data) {
		const color = new AnimatableColor();
		color.load(source);
		if (data !== void 0) if (isString(data) || isArray(data)) color.load({ value: data });
		else color.load(data);
		return color;
	}
	load(data) {
		super.load(data);
		if (isNull(data)) return;
		const colorAnimation = data.animation;
		if (colorAnimation !== void 0) if (colorAnimation.enable === void 0) this.animation.load(data.animation);
		else this.animation.h.load(colorAnimation);
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/ValueWithRandom.js
var ValueWithRandom = class {
	value;
	constructor() {
		this.value = 0;
	}
	load(data) {
		if (isNull(data)) return;
		if (!isNull(data.value)) this.value = setRangeValue(data.value);
	}
};
var AnimationValueWithRandom = class extends ValueWithRandom {
	animation = new AnimationOptions();
	load(data) {
		super.load(data);
		if (isNull(data)) return;
		const animation = data.animation;
		if (animation !== void 0) this.animation.load(animation);
	}
};
var RangedAnimationValueWithRandom = class extends AnimationValueWithRandom {
	animation;
	constructor() {
		super();
		this.animation = new RangedAnimationOptions();
	}
	load(data) {
		super.load(data);
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Bounce/ParticlesBounceFactor.js
var ParticlesBounceFactor = class extends ValueWithRandom {
	constructor() {
		super();
		this.value = 1;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Bounce/ParticlesBounce.js
var ParticlesBounce = class {
	horizontal;
	vertical;
	constructor() {
		this.horizontal = new ParticlesBounceFactor();
		this.vertical = new ParticlesBounceFactor();
	}
	load(data) {
		if (isNull(data)) return;
		this.horizontal.load(data.horizontal);
		this.vertical.load(data.vertical);
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Utils/ColorUtils.js
var styleCache = /* @__PURE__ */ new Map(), maxCacheSize = 1e3, firstIndex = 0, rgbFixedPrecision = 2, hslFixedPrecision = 2;
function getCachedStyle(key, generator) {
	let cached = styleCache.get(key);
	if (!cached) {
		cached = generator();
		if (styleCache.size >= maxCacheSize) [...styleCache.keys()].slice(firstIndex, maxCacheSize * half).forEach((k) => styleCache.delete(k));
		styleCache.set(key, cached);
	}
	return cached;
}
function stringToRgba(pluginManager, input) {
	if (!input) return;
	for (const manager of pluginManager.colorManagers.values()) if (manager.accepts(input)) return manager.parseString(input);
}
function rangeColorToRgb(pluginManager, input, index, useIndex = true) {
	if (!input) return;
	const color = isString(input) ? { value: input } : input;
	if (isString(color.value)) return colorToRgb(pluginManager, color.value, index, useIndex);
	if (isArray(color.value)) {
		const value = itemFromArray(color.value, index, useIndex);
		if (!value) return;
		return rangeColorToRgb(pluginManager, { value });
	}
	for (const manager of pluginManager.colorManagers.values()) {
		const res = manager.handleRangeColor(color);
		if (res) return res;
	}
}
function colorToRgb(pluginManager, input, index, useIndex = true) {
	if (!input) return;
	const color = isString(input) ? { value: input } : input;
	if (isString(color.value)) return color.value === "random" ? getRandomRgbColor() : stringToRgb(pluginManager, color.value);
	if (isArray(color.value)) {
		const value = itemFromArray(color.value, index, useIndex);
		if (!value) return;
		return colorToRgb(pluginManager, { value });
	}
	for (const manager of pluginManager.colorManagers.values()) {
		const res = manager.handleColor(color);
		if (res) return res;
	}
}
function rangeColorToHsl(pluginManager, color, index, useIndex = true) {
	const rgb = rangeColorToRgb(pluginManager, color, index, useIndex);
	return rgb ? rgbToHsl(rgb) : void 0;
}
function rgbToHsl(color) {
	const r1 = color.r / 255, g1 = color.g / 255, b1 = color.b / 255, max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1), res = {
		h: 0,
		l: (max + min) * half,
		s: 0
	};
	if (max !== min) {
		res.s = res.l < .5 ? (max - min) / (max + min) : (max - min) / (2 - max - min);
		if (r1 === max) res.h = (g1 - b1) / (max - min);
		else if (g1 === max) res.h = 2 + (b1 - r1) / (max - min);
		else res.h = 4 + (r1 - g1) / (max - min);
	}
	res.l *= 100;
	res.s *= 100;
	res.h *= 60;
	if (res.h < 0) res.h += 360;
	if (res.h >= 360) res.h -= 360;
	return res;
}
function stringToRgb(pluginManager, input) {
	return stringToRgba(pluginManager, input);
}
function hslToRgb(hsl) {
	const h = (hsl.h % 360 + 360) % 360, s = Math.max(0, Math.min(100, hsl.s)), l = Math.max(0, Math.min(100, hsl.l)), hNormalized = h / 360, sNormalized = s / 100, lNormalized = l / 100;
	if (s === 0) {
		const grayscaleValue = Math.round(lNormalized * 255);
		return {
			r: grayscaleValue,
			g: grayscaleValue,
			b: grayscaleValue
		};
	}
	const channel = (temp1, temp2, temp3) => {
		const temp3Min = 0, temp3Max = 1;
		if (temp3 < temp3Min) temp3++;
		if (temp3 > temp3Max) temp3--;
		if (temp3 * 6 < temp3Max) return temp1 + (temp2 - temp1) * 6 * temp3;
		if (temp3 * 2 < temp3Max) return temp2;
		if (temp3 * 3 < temp3Max * 2) return temp1 + (temp2 - temp1) * (2 / 3 - temp3) * 6;
		return temp1;
	}, temp1 = lNormalized < .5 ? lNormalized * (1 + sNormalized) : lNormalized + sNormalized - lNormalized * sNormalized, temp2 = 2 * lNormalized - temp1, phaseThird = 1 / 3, red = Math.min(255, 255 * channel(temp2, temp1, hNormalized + phaseThird)), green = Math.min(255, 255 * channel(temp2, temp1, hNormalized)), blue = Math.min(255, 255 * channel(temp2, temp1, hNormalized - phaseThird));
	return {
		r: Math.round(red),
		g: Math.round(green),
		b: Math.round(blue)
	};
}
function hslaToRgba(hsla) {
	const rgbResult = hslToRgb(hsla);
	return {
		a: hsla.a,
		b: rgbResult.b,
		g: rgbResult.g,
		r: rgbResult.r
	};
}
function getRandomRgbColor(min) {
	const fixedMin = min ?? 0, fixedMax = 256, getRgbInRangeValue = () => Math.floor(getRandomInRange(fixedMin, fixedMax));
	return {
		b: getRgbInRangeValue(),
		g: getRgbInRangeValue(),
		r: getRgbInRangeValue()
	};
}
function getStyleFromRgb(color, hdr, opacity) {
	const op = opacity ?? 1;
	return getCachedStyle(`rgb-${color.r.toFixed(rgbFixedPrecision)}-${color.g.toFixed(rgbFixedPrecision)}-${color.b.toFixed(rgbFixedPrecision)}-${hdr ? "hdr" : "sdr"}-${op.toString()}`, () => hdr ? getHdrStyleFromRgb(color, opacity) : getSdrStyleFromRgb(color, opacity));
}
function getHdrStyleFromRgb(color, opacity) {
	return `color(display-p3 ${(color.r / 255).toString()} ${(color.g / 255).toString()} ${(color.b / 255).toString()} / ${(opacity ?? 1).toString()})`;
}
function getSdrStyleFromRgb(color, opacity) {
	return `rgba(${color.r.toString()}, ${color.g.toString()}, ${color.b.toString()}, ${(opacity ?? 1).toString()})`;
}
function getStyleFromHsl(color, hdr, opacity) {
	const op = opacity ?? 1;
	return getCachedStyle(`hsl-${color.h.toFixed(hslFixedPrecision)}-${color.s.toFixed(hslFixedPrecision)}-${color.l.toFixed(hslFixedPrecision)}-${hdr ? "hdr" : "sdr"}-${op.toString()}`, () => hdr ? getHdrStyleFromHsl(color, opacity) : getSdrStyleFromHsl(color, opacity));
}
function getHdrStyleFromHsl(color, opacity) {
	return getHdrStyleFromRgb(hslToRgb(color), opacity);
}
function getSdrStyleFromHsl(color, opacity) {
	return `hsla(${color.h.toString()}, ${color.s.toString()}%, ${color.l.toString()}%, ${(opacity ?? 1).toString()})`;
}
function colorMix(color1, color2, size1, size2) {
	let rgb1 = color1, rgb2 = color2;
	if (!("r" in rgb1)) rgb1 = hslToRgb(color1);
	if (!("r" in rgb2)) rgb2 = hslToRgb(color2);
	return {
		b: mix(rgb1.b, rgb2.b, size1, size2),
		g: mix(rgb1.g, rgb2.g, size1, size2),
		r: mix(rgb1.r, rgb2.r, size1, size2)
	};
}
function getLinkColor(p1, p2, linkColor) {
	if (linkColor === "random") return getRandomRgbColor();
	else if (linkColor === "mid") {
		const sourceColor = p1.getFillColor() ?? p1.getStrokeColor(), destColor = p2?.getFillColor() ?? p2?.getStrokeColor();
		if (sourceColor && destColor && p2) return colorMix(sourceColor, destColor, p1.getRadius(), p2.getRadius());
		else {
			const hslColor = sourceColor ?? destColor;
			if (hslColor) return hslToRgb(hslColor);
		}
	} else return linkColor;
}
function getLinkRandomColor(pluginManager, optColor, blink, consent) {
	const color = isString(optColor) ? optColor : optColor.value;
	if (color === "random") {
		if (consent) return rangeColorToRgb(pluginManager, { value: color });
		if (blink) return randomColorValue;
		return "mid";
	} else if (color === "mid") return "mid";
	else return rangeColorToRgb(pluginManager, { value: color });
}
function getHslFromAnimation(animation) {
	return animation === void 0 ? void 0 : {
		h: animation.h.value,
		s: animation.s.value,
		l: animation.l.value
	};
}
function getHslAnimationFromHsl(hsl, animationOptions, reduceFactor) {
	const resColor = {
		h: {
			enable: false,
			value: hsl.h,
			min: 0,
			max: 360
		},
		s: {
			enable: false,
			value: hsl.s,
			min: 0,
			max: 100
		},
		l: {
			enable: false,
			value: hsl.l,
			min: 0,
			max: 100
		}
	};
	if (animationOptions) {
		setColorAnimation(resColor.h, animationOptions.h, reduceFactor);
		setColorAnimation(resColor.s, animationOptions.s, reduceFactor);
		setColorAnimation(resColor.l, animationOptions.l, reduceFactor);
	}
	return resColor;
}
function setColorAnimation(colorValue, colorAnimation, reduceFactor) {
	colorValue.enable = colorAnimation.enable;
	colorValue.min = colorAnimation.min;
	colorValue.max = colorAnimation.max;
	if (colorValue.enable) {
		colorValue.velocity = getRangeValue(colorAnimation.speed) / 100 * reduceFactor;
		colorValue.decay = 1 - getRangeValue(colorAnimation.decay);
		colorValue.status = AnimationStatus.increasing;
		colorValue.loops = 0;
		colorValue.maxLoops = getRangeValue(colorAnimation.count);
		colorValue.time = 0;
		colorValue.delayTime = getRangeValue(colorAnimation.delay) * millisecondsToSeconds;
		if (!colorAnimation.sync) {
			colorValue.velocity *= getRandom();
			colorValue.value *= getRandom();
		}
		colorValue.initialValue = colorValue.value;
		colorValue.offset = setRangeValue(colorAnimation.offset);
	} else colorValue.velocity = 0;
}
function updateColorValue(data, decrease, delta) {
	const minLoops = 0, minDelay = 0, identity = 1, minVelocity = 0, minOffset = 0, velocityFactor = 3.6;
	if (!data.enable || (data.maxLoops ?? minLoops) > minLoops && (data.loops ?? minLoops) > (data.maxLoops ?? minLoops)) return;
	data.time ??= 0;
	if ((data.delayTime ?? minDelay) > minDelay && data.time < (data.delayTime ?? minDelay)) data.time += delta.value;
	if ((data.delayTime ?? minDelay) > minDelay && data.time < (data.delayTime ?? minDelay)) return;
	const offset = data.offset ? randomInRangeValue(data.offset) : minOffset, velocity = (data.velocity ?? minVelocity) * delta.factor + offset * velocityFactor, decay = data.decay ?? identity, max = data.max, min = data.min;
	if (!decrease || data.status === AnimationStatus.increasing) {
		data.value += velocity;
		if (data.value > max) {
			data.loops ??= 0;
			data.loops++;
			if (decrease) data.status = AnimationStatus.decreasing;
			else data.value -= max;
		}
	} else {
		data.value -= velocity;
		if (data.value < min) {
			data.loops ??= 0;
			data.loops++;
			data.status = AnimationStatus.increasing;
		}
	}
	if (data.velocity && decay !== identity) data.velocity *= decay;
	data.value = clamp(data.value, min, max);
}
function updateColor(color, delta) {
	if (!color) return;
	const { h, s, l } = color;
	updateColorValue(h, false, delta);
	updateColorValue(s, true, delta);
	updateColorValue(l, true, delta);
}
function alterHsl(color, type, value) {
	return {
		h: color.h,
		s: color.s,
		l: color.l + (type === AlterType.darken ? -1 : 1) * value
	};
}
//#endregion
export { Circle as C, OutMode as S, ValueWithRandom as _, getLinkColor as a, RangedAnimationOptions as b, getStyleFromRgb as c, rangeColorToHsl as d, rangeColorToRgb as f, RangedAnimationValueWithRandom as g, ParticlesBounce as h, getHslFromAnimation as i, hslToRgb as l, updateColor as m, colorMix as n, getLinkRandomColor as o, rgbToHsl as p, getHslAnimationFromHsl as r, getStyleFromHsl as s, alterHsl as t, hslaToRgba as u, AnimatableColor as v, Rectangle as w, ParticleOutType as x, OptionsColor as y };

//# sourceMappingURL=ColorUtils-CuV_iiRF.js.map