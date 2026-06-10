import { $ as isNumber, B as getParticleBaseVelocity, C as safeMatchMedia, D as PixelMode, G as getRangeValue, H as getRandom, I as clamp, J as randomInRangeValue, L as degToRad, M as animate, N as calcExactPositionOrRandomFromSize, O as OutModeDirection, P as cancelAnimation, Q as isNull, V as getParticleDirectionAngle, X as isArray, Y as setRangeValue, Z as isBoolean, at as defaultCompositeValue, b as manageListener, c as deepExtend, ct as generatedAttribute, d as getFullScreenStyle, dt as originPoint, et as isObject, g as isInArray, it as MoveDirection, l as executeOnSingleOrMultiple, lt as half, m as getPosition, mt as visibilityChangeEvent, n as getLogger, nt as Vector, ot as defaultTransform, pt as resizeEvent, r as EventType, rt as Vector3d, s as cloneStyle, st as doublePI, ut as millisecondsToSeconds, w as safeMutationObserver, x as safeDocument, y as itemFromSingleOrMultiple } from "./browser-Bo2Gf3WI.js";
import { C as Circle, S as OutMode, _ as ValueWithRandom, c as getStyleFromRgb, d as rangeColorToHsl, f as rangeColorToRgb, h as ParticlesBounce, i as getHslFromAnimation, s as getStyleFromHsl, t as alterHsl, v as AnimatableColor, w as Rectangle, x as ParticleOutType, y as OptionsColor } from "./ColorUtils-CuV_iiRF.js";
//#region node_modules/@tsparticles/engine/browser/Enums/Modes/LimitMode.js
var LimitMode;
(function(LimitMode) {
	LimitMode["delete"] = "delete";
	LimitMode["wait"] = "wait";
})(LimitMode || (LimitMode = {}));
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Background/Background.js
var Background = class {
	color;
	image;
	opacity;
	position;
	repeat;
	size;
	constructor() {
		this.color = new OptionsColor();
		this.color.value = "";
		this.image = "";
		this.position = "";
		this.repeat = "";
		this.size = "";
		this.opacity = 1;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.color !== void 0) this.color = OptionsColor.create(this.color, data.color);
		if (data.image !== void 0) this.image = data.image;
		if (data.position !== void 0) this.position = data.position;
		if (data.repeat !== void 0) this.repeat = data.repeat;
		if (data.size !== void 0) this.size = data.size;
		if (data.opacity !== void 0) this.opacity = data.opacity;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/FullScreen/FullScreen.js
var FullScreen = class {
	enable;
	zIndex;
	constructor() {
		this.enable = true;
		this.zIndex = 0;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.enable !== void 0) this.enable = data.enable;
		if (data.zIndex !== void 0) this.zIndex = data.zIndex;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/ResizeEvent.js
var ResizeEvent = class {
	delay;
	enable;
	constructor() {
		this.delay = .5;
		this.enable = true;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.delay !== void 0) this.delay = data.delay;
		if (data.enable !== void 0) this.enable = data.enable;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Effect/Effect.js
var Effect = class {
	close;
	options;
	type;
	constructor() {
		this.close = true;
		this.options = {};
		this.type = [];
	}
	load(data) {
		if (isNull(data)) return;
		const options = data.options;
		if (options !== void 0) for (const effect in options) {
			const item = options[effect];
			if (item) this.options[effect] = deepExtend(this.options[effect] ?? {}, item);
		}
		if (data.close !== void 0) this.close = data.close;
		if (data.type !== void 0) this.type = data.type;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Fill.js
var Fill = class {
	color;
	enable;
	opacity;
	constructor() {
		this.enable = true;
		this.opacity = 1;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.color !== void 0) this.color = AnimatableColor.create(this.color, data.color);
		if (data.enable !== void 0) this.enable = data.enable;
		if (data.opacity !== void 0) this.opacity = setRangeValue(data.opacity);
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Move/MoveAngle.js
var MoveAngle = class {
	offset;
	value;
	constructor() {
		this.offset = 0;
		this.value = 90;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.offset !== void 0) this.offset = setRangeValue(data.offset);
		if (data.value !== void 0) this.value = setRangeValue(data.value);
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Move/MoveCenter.js
var MoveCenter = class {
	mode;
	radius;
	x;
	y;
	constructor() {
		this.x = 50;
		this.y = 50;
		this.mode = PixelMode.percent;
		this.radius = 0;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.x !== void 0) this.x = data.x;
		if (data.y !== void 0) this.y = data.y;
		if (data.mode !== void 0) this.mode = data.mode;
		if (data.radius !== void 0) this.radius = data.radius;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Move/MoveGravity.js
var MoveGravity = class {
	acceleration;
	enable;
	inverse;
	maxSpeed;
	constructor() {
		this.acceleration = 9.81;
		this.enable = false;
		this.inverse = false;
		this.maxSpeed = 50;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.acceleration !== void 0) this.acceleration = setRangeValue(data.acceleration);
		if (data.enable !== void 0) this.enable = data.enable;
		if (data.inverse !== void 0) this.inverse = data.inverse;
		if (data.maxSpeed !== void 0) this.maxSpeed = setRangeValue(data.maxSpeed);
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Move/Path/MovePath.js
var MovePath = class {
	clamp;
	delay;
	enable;
	generator;
	options;
	constructor() {
		this.clamp = true;
		this.delay = new ValueWithRandom();
		this.enable = false;
		this.options = {};
	}
	load(data) {
		if (isNull(data)) return;
		if (data.clamp !== void 0) this.clamp = data.clamp;
		this.delay.load(data.delay);
		if (data.enable !== void 0) this.enable = data.enable;
		this.generator = data.generator;
		if (data.options) this.options = deepExtend(this.options, data.options);
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Move/OutModes.js
var OutModes = class {
	bottom;
	default;
	left;
	right;
	top;
	constructor() {
		this.default = OutMode.out;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.default !== void 0) this.default = data.default;
		this.bottom = data.bottom ?? data.default;
		this.left = data.left ?? data.default;
		this.right = data.right ?? data.default;
		this.top = data.top ?? data.default;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Move/Spin.js
var Spin = class {
	acceleration;
	enable;
	position;
	constructor() {
		this.acceleration = 0;
		this.enable = false;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.acceleration !== void 0) this.acceleration = setRangeValue(data.acceleration);
		if (data.enable !== void 0) this.enable = data.enable;
		if (data.position) this.position = deepExtend({}, data.position);
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Move/Move.js
var Move = class {
	angle;
	center;
	decay;
	direction;
	distance;
	drift;
	enable;
	gravity;
	outModes;
	path;
	random;
	size;
	speed;
	spin;
	straight;
	vibrate;
	warp;
	constructor() {
		this.angle = new MoveAngle();
		this.center = new MoveCenter();
		this.decay = 0;
		this.distance = {};
		this.direction = MoveDirection.none;
		this.drift = 0;
		this.enable = false;
		this.gravity = new MoveGravity();
		this.path = new MovePath();
		this.outModes = new OutModes();
		this.random = false;
		this.size = false;
		this.speed = 2;
		this.spin = new Spin();
		this.straight = false;
		this.vibrate = false;
		this.warp = false;
	}
	load(data) {
		if (isNull(data)) return;
		this.angle.load(isNumber(data.angle) ? { value: data.angle } : data.angle);
		this.center.load(data.center);
		if (data.decay !== void 0) this.decay = setRangeValue(data.decay);
		if (data.direction !== void 0) this.direction = data.direction;
		if (data.distance !== void 0) this.distance = isNumber(data.distance) ? {
			horizontal: data.distance,
			vertical: data.distance
		} : { ...data.distance };
		if (data.drift !== void 0) this.drift = setRangeValue(data.drift);
		if (data.enable !== void 0) this.enable = data.enable;
		this.gravity.load(data.gravity);
		const outModes = data.outModes;
		if (outModes !== void 0) if (isObject(outModes)) this.outModes.load(outModes);
		else this.outModes.load({ default: outModes });
		this.path.load(data.path);
		if (data.random !== void 0) this.random = data.random;
		if (data.size !== void 0) this.size = data.size;
		if (data.speed !== void 0) this.speed = setRangeValue(data.speed);
		this.spin.load(data.spin);
		if (data.straight !== void 0) this.straight = data.straight;
		if (data.vibrate !== void 0) this.vibrate = data.vibrate;
		if (data.warp !== void 0) this.warp = data.warp;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Stroke.js
var Stroke = class {
	color;
	opacity;
	width;
	constructor() {
		this.width = 0;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.color !== void 0) this.color = AnimatableColor.create(this.color, data.color);
		if (data.width !== void 0) this.width = setRangeValue(data.width);
		if (data.opacity !== void 0) this.opacity = setRangeValue(data.opacity);
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Paint.js
var Paint = class {
	color;
	fill;
	stroke;
	load(data) {
		if (isNull(data)) return;
		if (data.color !== void 0) this.color = AnimatableColor.create(this.color, data.color);
		if (data.fill !== void 0) {
			this.fill ??= new Fill();
			this.fill.load(data.fill);
		}
		if (data.stroke !== void 0) {
			this.stroke ??= new Stroke();
			this.stroke.load(data.stroke);
		}
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Number/ParticlesDensity.js
var ParticlesDensity = class {
	enable;
	height;
	width;
	constructor() {
		this.enable = false;
		this.width = 1920;
		this.height = 1080;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.enable !== void 0) this.enable = data.enable;
		const width = data.width;
		if (width !== void 0) this.width = width;
		const height = data.height;
		if (height !== void 0) this.height = height;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Number/ParticlesNumberLimit.js
var ParticlesNumberLimit = class {
	mode;
	value;
	constructor() {
		this.mode = LimitMode.delete;
		this.value = 0;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.mode !== void 0) this.mode = data.mode;
		if (data.value !== void 0) this.value = data.value;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Number/ParticlesNumber.js
var ParticlesNumber = class {
	density;
	limit;
	value;
	constructor() {
		this.density = new ParticlesDensity();
		this.limit = new ParticlesNumberLimit();
		this.value = 0;
	}
	load(data) {
		if (isNull(data)) return;
		this.density.load(data.density);
		this.limit.load(data.limit);
		if (data.value !== void 0) this.value = data.value;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/Shape/Shape.js
var Shape = class {
	close;
	options;
	type;
	constructor() {
		this.close = true;
		this.options = {};
		this.type = "circle";
	}
	load(data) {
		if (isNull(data)) return;
		const options = data.options;
		if (options !== void 0) for (const shape in options) {
			const item = options[shape];
			if (item) this.options[shape] = deepExtend(this.options[shape] ?? {}, item);
		}
		if (data.close !== void 0) this.close = data.close;
		if (data.type !== void 0) this.type = data.type;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/ZIndex/ZIndex.js
var ZIndex = class extends ValueWithRandom {
	opacityRate;
	sizeRate;
	velocityRate;
	constructor() {
		super();
		this.opacityRate = 1;
		this.sizeRate = 1;
		this.velocityRate = 1;
	}
	load(data) {
		super.load(data);
		if (isNull(data)) return;
		if (data.opacityRate !== void 0) this.opacityRate = data.opacityRate;
		if (data.sizeRate !== void 0) this.sizeRate = data.sizeRate;
		if (data.velocityRate !== void 0) this.velocityRate = data.velocityRate;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Particles/ParticlesOptions.js
var ParticlesOptions = class {
	bounce;
	effect;
	groups;
	move;
	number;
	paint;
	palette;
	reduceDuplicates;
	shape;
	zIndex;
	#container;
	#pluginManager;
	constructor(pluginManager, container) {
		this.#pluginManager = pluginManager;
		this.#container = container;
		this.bounce = new ParticlesBounce();
		this.effect = new Effect();
		this.groups = {};
		this.move = new Move();
		this.number = new ParticlesNumber();
		this.paint = new Paint();
		this.paint.color = new AnimatableColor();
		this.paint.color.value = "#fff";
		this.paint.fill = new Fill();
		this.paint.fill.enable = true;
		this.reduceDuplicates = false;
		this.shape = new Shape();
		this.zIndex = new ZIndex();
	}
	load(data) {
		if (isNull(data)) return;
		if (data.palette) {
			this.palette = data.palette;
			this.#importPalette(this.palette);
		}
		if (data.groups !== void 0) for (const group of Object.keys(data.groups)) {
			if (!(group in data.groups)) continue;
			const item = data.groups[group];
			if (item !== void 0) this.groups[group] = deepExtend(this.groups[group] ?? {}, item);
		}
		if (data.reduceDuplicates !== void 0) this.reduceDuplicates = data.reduceDuplicates;
		this.bounce.load(data.bounce);
		this.effect.load(data.effect);
		this.move.load(data.move);
		this.number.load(data.number);
		const paintToLoad = data.paint;
		if (paintToLoad) if (isArray(paintToLoad)) this.paint = executeOnSingleOrMultiple(paintToLoad, (t) => {
			const tmp = new Paint();
			tmp.load(t);
			return tmp;
		});
		else if (isArray(this.paint)) {
			this.paint = new Paint();
			this.paint.load(paintToLoad);
		} else this.paint.load(paintToLoad);
		this.shape.load(data.shape);
		this.zIndex.load(data.zIndex);
		if (this.#container) {
			for (const plugin of this.#pluginManager.plugins) if (plugin.loadParticlesOptions) plugin.loadParticlesOptions(this.#container, this, data);
			const updaters = this.#pluginManager.updaters.get(this.#container);
			if (updaters) {
				for (const updater of updaters) if (updater.loadOptions) updater.loadOptions(this, data);
			}
		}
	}
	#importPalette = (palette) => {
		const paletteData = this.#pluginManager.getPalette(palette);
		if (!paletteData) return;
		const paletteColors = paletteData.colors, defaultPaintStrokeWidth = 0, defaultPaintVariantsLength = 1, firstPaintVariantIndex = 0, defaultPalettePaintVariant = {}, palettePaintVariants = (isArray(paletteColors) ? paletteColors : [paletteColors]).flatMap((variant) => {
			const paletteFill = variant.fill, paletteStroke = variant.stroke, fillPart = paletteFill ? {
				color: { value: paletteFill.value },
				enable: paletteFill.enable,
				opacity: paletteFill.opacity
			} : void 0;
			if (!paletteStroke) return [{ fill: fillPart }];
			return [{
				fill: fillPart,
				stroke: {
					color: { value: paletteStroke.value },
					opacity: paletteStroke.opacity,
					width: paletteStroke.width || defaultPaintStrokeWidth
				}
			}];
		}), palettePaint = palettePaintVariants.length > defaultPaintVariantsLength ? palettePaintVariants : palettePaintVariants[firstPaintVariantIndex] ?? defaultPalettePaintVariant;
		this.load({
			paint: palettePaint,
			blend: {
				enable: true,
				mode: paletteData.blendMode
			}
		});
	};
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Utils/OptionsUtils.js
function loadOptions(options, ...sourceOptionsArr) {
	for (const sourceOptions of sourceOptionsArr) options.load(sourceOptions);
}
function loadParticlesOptions(pluginManager, container, ...sourceOptionsArr) {
	const options = new ParticlesOptions(pluginManager, container);
	loadOptions(options, ...sourceOptionsArr);
	return options;
}
//#endregion
//#region node_modules/@tsparticles/engine/browser/Options/Classes/Options.js
var Options = class {
	autoPlay;
	background;
	clear;
	defaultThemes;
	delay;
	detectRetina;
	duration;
	fpsLimit;
	fullScreen;
	hdr;
	key;
	name;
	palette;
	particles;
	pauseOnBlur;
	pauseOnOutsideViewport;
	preset;
	resize;
	smooth;
	style;
	zLayers;
	#container;
	#pluginManager;
	constructor(pluginManager, container) {
		this.#pluginManager = pluginManager;
		this.#container = container;
		this.autoPlay = true;
		this.background = new Background();
		this.clear = true;
		this.defaultThemes = {};
		this.delay = 0;
		this.fullScreen = new FullScreen();
		this.detectRetina = true;
		this.duration = 0;
		this.fpsLimit = 120;
		this.hdr = true;
		this.particles = loadParticlesOptions(this.#pluginManager, this.#container);
		this.pauseOnBlur = true;
		this.pauseOnOutsideViewport = true;
		this.resize = new ResizeEvent();
		this.smooth = false;
		this.style = {};
		this.zLayers = 100;
	}
	load(data) {
		if (isNull(data)) return;
		if (data.preset !== void 0) {
			this.preset = data.preset;
			executeOnSingleOrMultiple(this.preset, (preset) => {
				this.#importPreset(preset);
			});
		}
		if (data.palette !== void 0) {
			this.palette = data.palette;
			this.#importPalette(this.palette);
		}
		if (data.autoPlay !== void 0) this.autoPlay = data.autoPlay;
		if (data.clear !== void 0) this.clear = data.clear;
		if (data.key !== void 0) this.key = data.key;
		if (data.name !== void 0) this.name = data.name;
		if (data.delay !== void 0) this.delay = setRangeValue(data.delay);
		const detectRetina = data.detectRetina;
		if (detectRetina !== void 0) this.detectRetina = detectRetina;
		if (data.duration !== void 0) this.duration = setRangeValue(data.duration);
		const fpsLimit = data.fpsLimit;
		if (fpsLimit !== void 0) this.fpsLimit = fpsLimit;
		if (data.hdr !== void 0) this.hdr = data.hdr;
		if (data.pauseOnBlur !== void 0) this.pauseOnBlur = data.pauseOnBlur;
		if (data.pauseOnOutsideViewport !== void 0) this.pauseOnOutsideViewport = data.pauseOnOutsideViewport;
		if (data.zLayers !== void 0) this.zLayers = data.zLayers;
		this.background.load(data.background);
		const fullScreen = data.fullScreen;
		if (isBoolean(fullScreen)) this.fullScreen.enable = fullScreen;
		else this.fullScreen.load(fullScreen);
		this.particles.load(data.particles);
		this.resize.load(data.resize);
		this.style = deepExtend(this.style, data.style);
		if (data.smooth !== void 0) this.smooth = data.smooth;
		this.#pluginManager.plugins.forEach((plugin) => {
			plugin.loadOptions(this.#container, this, data);
		});
	}
	#importPalette = (palette) => {
		const paletteData = this.#pluginManager.getPalette(palette);
		if (!paletteData) return;
		this.load({
			background: { color: paletteData.background },
			blend: {
				enable: true,
				mode: paletteData.blendMode
			},
			particles: { palette }
		});
	};
	#importPreset = (preset) => {
		this.load(this.#pluginManager.getPreset(preset));
	};
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Utils/CanvasUtils.js
function paintBase(context, dimension, baseColor) {
	context.fillStyle = baseColor ?? "rgba(0,0,0,0)";
	context.fillRect(originPoint.x, originPoint.y, dimension.width, dimension.height);
}
function paintImage(context, dimension, image, opacity) {
	if (!image) return;
	const prevAlpha = context.globalAlpha;
	context.globalAlpha = opacity;
	context.drawImage(image, originPoint.x, originPoint.y, dimension.width, dimension.height);
	context.globalAlpha = prevAlpha;
}
function clear(context, dimension) {
	context.clearRect(originPoint.x, originPoint.y, dimension.width, dimension.height);
}
function drawParticle(data) {
	const { container, context, particle, delta, colorStyles, radius, opacity, transform } = data, { effectDrawers, shapeDrawers } = container, pos = particle.getPosition(), transformData = particle.getTransformData(transform), drawScale = 1, drawPosition = {
		x: pos.x,
		y: pos.y
	};
	context.setTransform(transformData.a, transformData.b, transformData.c, transformData.d, pos.x, pos.y);
	if (colorStyles.fill) context.fillStyle = colorStyles.fill;
	const fillEnabled = !!particle.fillEnabled, strokeWidth = particle.strokeWidth ?? 0;
	context.lineWidth = strokeWidth;
	if (colorStyles.stroke) context.strokeStyle = colorStyles.stroke;
	const drawData = {
		context,
		particle,
		radius,
		drawRadius: radius * drawScale,
		opacity,
		delta,
		pixelRatio: container.retina.pixelRatio,
		fill: fillEnabled,
		stroke: strokeWidth > 0,
		transformData,
		position: { ...pos },
		drawPosition,
		drawScale
	};
	for (const plugin of container.plugins) plugin.drawParticleTransform?.(drawData);
	const effect = particle.effect ? effectDrawers.get(particle.effect) : void 0, shape = particle.shape ? shapeDrawers.get(particle.shape) : void 0;
	drawBeforeEffect(effect, drawData);
	drawShapeBeforeDraw(shape, drawData);
	drawShape(shape, drawData);
	drawShapeAfterDraw(shape, drawData);
	drawAfterEffect(effect, drawData);
	context.resetTransform();
}
function drawAfterEffect(drawer, data) {
	if (!drawer?.drawAfter) return;
	const { particle } = data;
	if (!particle.effect) return;
	drawer.drawAfter(data);
}
function drawBeforeEffect(drawer, data) {
	if (!drawer?.drawBefore) return;
	const { particle } = data;
	if (!particle.effect) return;
	drawer.drawBefore(data);
}
function drawShape(drawer, data) {
	if (!drawer) return;
	const { context, fill, particle, stroke } = data;
	if (!particle.shape) return;
	context.beginPath();
	drawer.draw(data);
	if (particle.shapeClose) context.closePath();
	if (fill) context.fill();
	if (stroke) context.stroke();
}
function drawShapeAfterDraw(drawer, data) {
	if (!drawer?.afterDraw) return;
	const { particle } = data;
	if (!particle.shape) return;
	drawer.afterDraw(data);
}
function drawShapeBeforeDraw(drawer, data) {
	if (!drawer?.beforeDraw) return;
	const { particle } = data;
	if (!particle.shape) return;
	drawer.beforeDraw(data);
}
function drawParticlePlugin(context, plugin, particle, delta) {
	if (!plugin.drawParticle) return;
	plugin.drawParticle(context, particle, delta);
}
//#endregion
//#region node_modules/@tsparticles/engine/browser/Core/RenderManager.js
var fColorIndex = 0, sColorIndex = 1;
function setTransformValue(factor, newFactor, key) {
	const newValue = newFactor[key];
	if (newValue !== void 0) factor[key] = (factor[key] ?? 1) * newValue;
}
var RenderManager = class {
	#canvasClearPlugins;
	#canvasManager;
	#canvasPaintPlugins;
	#clearDrawPlugins;
	#colorPlugins;
	#container;
	#context;
	#contextSettings;
	#drawParticlePlugins;
	#drawParticlesCleanupPlugins;
	#drawParticlesSetupPlugins;
	#drawPlugins;
	#drawSettingsCleanupPlugins;
	#drawSettingsSetupPlugins;
	#pluginManager;
	#postDrawUpdaters;
	#preDrawUpdaters;
	#reusableColorStyles = {};
	#reusablePluginColors = [void 0, void 0];
	#reusableTransform = {};
	constructor(pluginManager, container, canvasManager) {
		this.#pluginManager = pluginManager;
		this.#container = container;
		this.#canvasManager = canvasManager;
		this.#context = null;
		this.#preDrawUpdaters = [];
		this.#postDrawUpdaters = [];
		this.#colorPlugins = [];
		this.#canvasClearPlugins = [];
		this.#canvasPaintPlugins = [];
		this.#clearDrawPlugins = [];
		this.#drawParticlePlugins = [];
		this.#drawParticlesCleanupPlugins = [];
		this.#drawParticlesSetupPlugins = [];
		this.#drawPlugins = [];
		this.#drawSettingsSetupPlugins = [];
		this.#drawSettingsCleanupPlugins = [];
	}
	get settings() {
		return this.#contextSettings;
	}
	canvasClear() {
		if (!this.#container.actualOptions.clear) return;
		this.draw((ctx) => {
			clear(ctx, this.#canvasManager.size);
		});
	}
	clear() {
		let pluginHandled = false;
		for (const plugin of this.#canvasClearPlugins) {
			pluginHandled = plugin.canvasClear?.() ?? false;
			if (pluginHandled) break;
		}
		if (pluginHandled) return;
		this.canvasClear();
	}
	destroy() {
		this.stop();
		this.#preDrawUpdaters = [];
		this.#postDrawUpdaters = [];
		this.#colorPlugins = [];
		this.#canvasClearPlugins = [];
		this.#canvasPaintPlugins = [];
		this.#clearDrawPlugins = [];
		this.#drawParticlePlugins = [];
		this.#drawParticlesCleanupPlugins = [];
		this.#drawParticlesSetupPlugins = [];
		this.#drawPlugins = [];
		this.#drawSettingsSetupPlugins = [];
		this.#drawSettingsCleanupPlugins = [];
	}
	draw(cb) {
		const ctx = this.#context;
		if (!ctx) return;
		return cb(ctx);
	}
	drawParticle(particle, delta) {
		if (particle.spawning || particle.destroyed) return;
		const radius = particle.getRadius();
		if (radius <= 0) return;
		const pfColor = particle.getFillColor(), psColor = particle.getStrokeColor();
		let [fColor, sColor] = this.#getPluginParticleColors(particle);
		fColor ??= pfColor;
		sColor ??= psColor;
		if (!fColor && !sColor) return;
		const container = this.#container, zIndexOptions = particle.options.zIndex, zIndexFactor = 1 - particle.zIndexFactor, { fillOpacity, opacity, strokeOpacity } = particle.getOpacity(), transform = this.#reusableTransform, colorStyles = this.#reusableColorStyles, fill = fColor ? getStyleFromHsl(fColor, container.hdr, fillOpacity * opacity) : void 0, stroke = sColor ? getStyleFromHsl(sColor, container.hdr, strokeOpacity * opacity) : fill;
		transform.a = transform.b = transform.c = transform.d = void 0;
		colorStyles.fill = fill;
		colorStyles.stroke = stroke;
		this.draw((context) => {
			for (const plugin of this.#drawParticlesSetupPlugins) plugin.drawParticleSetup?.(context, particle, delta);
			this.#applyPreDrawUpdaters(context, particle, radius, opacity, colorStyles, transform);
			drawParticle({
				container,
				context,
				particle,
				delta,
				colorStyles,
				radius: radius * zIndexFactor ** zIndexOptions.sizeRate,
				opacity,
				transform
			});
			this.#applyPostDrawUpdaters(particle);
			for (const plugin of this.#drawParticlesCleanupPlugins) plugin.drawParticleCleanup?.(context, particle, delta);
		});
	}
	drawParticlePlugins(particle, delta) {
		this.draw((ctx) => {
			for (const plugin of this.#drawParticlePlugins) drawParticlePlugin(ctx, plugin, particle, delta);
		});
	}
	drawParticles(delta) {
		const { particles } = this.#container;
		this.clear();
		particles.update(delta);
		this.draw((ctx) => {
			for (const plugin of this.#drawSettingsSetupPlugins) plugin.drawSettingsSetup?.(ctx, delta);
			for (const plugin of this.#drawPlugins) plugin.draw?.(ctx, delta);
			particles.drawParticles(delta);
			for (const plugin of this.#clearDrawPlugins) plugin.clearDraw?.(ctx, delta);
			for (const plugin of this.#drawSettingsCleanupPlugins) plugin.drawSettingsCleanup?.(ctx, delta);
		});
	}
	init() {
		this.initUpdaters();
		this.initPlugins();
		this.paint();
	}
	initPlugins() {
		this.#colorPlugins = [];
		this.#canvasClearPlugins = [];
		this.#canvasPaintPlugins = [];
		this.#clearDrawPlugins = [];
		this.#drawParticlePlugins = [];
		this.#drawParticlesSetupPlugins = [];
		this.#drawParticlesCleanupPlugins = [];
		this.#drawPlugins = [];
		this.#drawSettingsSetupPlugins = [];
		this.#drawSettingsCleanupPlugins = [];
		for (const plugin of this.#container.plugins) {
			if (plugin.particleFillColor ?? plugin.particleStrokeColor) this.#colorPlugins.push(plugin);
			if (plugin.canvasClear) this.#canvasClearPlugins.push(plugin);
			if (plugin.canvasPaint) this.#canvasPaintPlugins.push(plugin);
			if (plugin.drawParticle) this.#drawParticlePlugins.push(plugin);
			if (plugin.drawParticleSetup) this.#drawParticlesSetupPlugins.push(plugin);
			if (plugin.drawParticleCleanup) this.#drawParticlesCleanupPlugins.push(plugin);
			if (plugin.draw) this.#drawPlugins.push(plugin);
			if (plugin.drawSettingsSetup) this.#drawSettingsSetupPlugins.push(plugin);
			if (plugin.drawSettingsCleanup) this.#drawSettingsCleanupPlugins.push(plugin);
			if (plugin.clearDraw) this.#clearDrawPlugins.push(plugin);
		}
	}
	initUpdaters() {
		this.#preDrawUpdaters = [];
		this.#postDrawUpdaters = [];
		for (const updater of this.#container.particleUpdaters) {
			if (updater.afterDraw) this.#postDrawUpdaters.push(updater);
			if (updater.getColorStyles ?? updater.getTransformValues ?? updater.beforeDraw) this.#preDrawUpdaters.push(updater);
		}
	}
	paint() {
		let handled = false;
		for (const plugin of this.#canvasPaintPlugins) {
			handled = plugin.canvasPaint?.() ?? false;
			if (handled) break;
		}
		if (handled) return;
		this.paintBase();
	}
	paintBase(baseColor) {
		this.draw((ctx) => {
			paintBase(ctx, this.#canvasManager.size, baseColor);
		});
	}
	paintImage(image, opacity) {
		this.draw((ctx) => {
			paintImage(ctx, this.#canvasManager.size, image, opacity);
		});
	}
	setContext(context) {
		this.#context = context;
		if (this.#context) this.#context.globalCompositeOperation = defaultCompositeValue;
	}
	setContextSettings(settings) {
		this.#contextSettings = settings;
	}
	stop() {
		this.draw((ctx) => {
			clear(ctx, this.#canvasManager.size);
		});
	}
	#applyPostDrawUpdaters = (particle) => {
		for (const updater of this.#postDrawUpdaters) updater.afterDraw?.(particle);
	};
	#applyPreDrawUpdaters = (ctx, particle, radius, zOpacity, colorStyles, transform) => {
		for (const updater of this.#preDrawUpdaters) {
			if (updater.getColorStyles) {
				const { fill, stroke } = updater.getColorStyles(particle, ctx, radius, zOpacity);
				if (fill) colorStyles.fill = fill;
				if (stroke) colorStyles.stroke = stroke;
			}
			if (updater.getTransformValues) {
				const updaterTransform = updater.getTransformValues(particle);
				for (const key in updaterTransform) setTransformValue(transform, updaterTransform, key);
			}
			updater.beforeDraw?.(particle);
		}
	};
	#getPluginParticleColors = (particle) => {
		let fColor, sColor;
		for (const plugin of this.#colorPlugins) {
			if (!fColor && plugin.particleFillColor) fColor = rangeColorToHsl(this.#pluginManager, plugin.particleFillColor(particle));
			if (!sColor && plugin.particleStrokeColor) sColor = rangeColorToHsl(this.#pluginManager, plugin.particleStrokeColor(particle));
			if (fColor && sColor) break;
		}
		this.#reusablePluginColors[fColorIndex] = fColor;
		this.#reusablePluginColors[sColorIndex] = sColor;
		return this.#reusablePluginColors;
	};
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Core/CanvasManager.js
var transferredCanvases = /* @__PURE__ */ new WeakMap(), getTransferredCanvas = (canvas) => {
	const transferredCanvas = transferredCanvases.get(canvas);
	if (transferredCanvas) return transferredCanvas;
	if (typeof canvas.transferControlToOffscreen !== "function") throw new TypeError("OffscreenCanvas is required but not supported by this browser");
	try {
		const offscreenCanvas = canvas.transferControlToOffscreen();
		transferredCanvases.set(canvas, offscreenCanvas);
		return offscreenCanvas;
	} catch {
		throw new TypeError("OffscreenCanvas transfer failed");
	}
}, isHtmlCanvasElement = (canvas) => {
	return typeof HTMLCanvasElement !== "undefined" && canvas instanceof HTMLCanvasElement;
};
function setStyle(canvas, style, important = false) {
	if (!style) return;
	const elementStyle = canvas.style, keys = /* @__PURE__ */ new Set();
	for (let i = 0; i < elementStyle.length; i++) {
		const key = elementStyle.item(i);
		if (!key) continue;
		keys.add(key);
	}
	for (let i = 0; i < style.length; i++) {
		const key = style.item(i);
		if (!key) continue;
		keys.add(key);
	}
	for (const key of keys) {
		const value = style.getPropertyValue(key);
		if (value) elementStyle.setProperty(key, value, important ? "important" : "");
		else elementStyle.removeProperty(key);
	}
}
var CanvasManager = class {
	domElement;
	render;
	renderCanvas;
	size;
	zoom = 1;
	#container;
	#generated;
	#mutationObserver;
	#originalStyle;
	#pluginManager;
	#pointerEvents;
	#resizePlugins;
	#standardSize;
	#zoomCenter;
	constructor(pluginManager, container) {
		this.#pluginManager = pluginManager;
		this.#container = container;
		this.render = new RenderManager(pluginManager, container, this);
		this.#standardSize = {
			height: 0,
			width: 0
		};
		const pxRatio = container.retina.pixelRatio, stdSize = this.#standardSize;
		this.size = {
			height: stdSize.height * pxRatio,
			width: stdSize.width * pxRatio
		};
		this.#generated = false;
		this.#resizePlugins = [];
		this.#pointerEvents = "none";
	}
	get #fullScreen() {
		return this.#container.actualOptions.fullScreen.enable;
	}
	destroy() {
		this.stop();
		if (this.#generated) {
			this.domElement?.remove();
			this.domElement = void 0;
			this.renderCanvas = void 0;
		} else this.#resetOriginalStyle();
		this.render.destroy();
		this.#resizePlugins = [];
	}
	getZoomCenter() {
		const pxRatio = this.#container.retina.pixelRatio, { width, height } = this.size;
		if (this.#zoomCenter) return this.#zoomCenter;
		return {
			x: width * half / pxRatio,
			y: height * half / pxRatio
		};
	}
	init() {
		this.#safeMutationObserver((obs) => {
			obs.disconnect();
		});
		this.#mutationObserver = safeMutationObserver((records) => {
			for (const record of records) if (record.type === "attributes" && record.attributeName === "style") this.#repairStyle();
		});
		this.resize();
		this.#initStyle();
		this.initBackground();
		this.#safeMutationObserver((obs) => {
			const element = this.domElement;
			if (!element || !(element instanceof Node)) return;
			obs.observe(element, { attributes: true });
		});
		this.initPlugins();
		this.render.init();
	}
	initBackground() {
		const container = this.#container, background = container.actualOptions.background, element = this.domElement;
		if (!element) return;
		const elementStyle = element.style, color = rangeColorToRgb(this.#pluginManager, background.color);
		if (color) elementStyle.backgroundColor = getStyleFromRgb(color, container.hdr, background.opacity);
		else elementStyle.backgroundColor = "";
		elementStyle.backgroundImage = background.image || "";
		elementStyle.backgroundPosition = background.position || "";
		elementStyle.backgroundRepeat = background.repeat || "";
		elementStyle.backgroundSize = background.size || "";
	}
	initPlugins() {
		this.#resizePlugins = [];
		for (const plugin of this.#container.plugins) if (plugin.resize) this.#resizePlugins.push(plugin);
	}
	loadCanvas(canvas) {
		if (this.#generated && this.domElement) this.domElement.remove();
		const container = this.#container, domCanvas = isHtmlCanvasElement(canvas) ? canvas : void 0;
		this.domElement = domCanvas;
		this.#generated = domCanvas ? domCanvas.dataset[generatedAttribute] === "true" : false;
		this.renderCanvas = domCanvas ? getTransferredCanvas(domCanvas) : canvas;
		const domElement = this.domElement;
		if (domElement) {
			domElement.ariaHidden = "true";
			this.#originalStyle = cloneStyle(domElement.style);
		}
		const standardSize = this.#standardSize, renderCanvas = this.renderCanvas;
		if (domElement) {
			standardSize.height = domElement.offsetHeight;
			standardSize.width = domElement.offsetWidth;
		} else {
			standardSize.height = renderCanvas.height;
			standardSize.width = renderCanvas.width;
		}
		const pxRatio = this.#container.retina.pixelRatio, retinaSize = this.size;
		renderCanvas.height = retinaSize.height = standardSize.height * pxRatio;
		renderCanvas.width = retinaSize.width = standardSize.width * pxRatio;
		const canSupportHdrQuery = safeMatchMedia("(color-gamut: p3)");
		this.render.setContextSettings({
			alpha: true,
			colorSpace: canSupportHdrQuery?.matches && container.hdr ? "display-p3" : "srgb",
			desynchronized: true,
			willReadFrequently: false
		});
		this.render.setContext(renderCanvas.getContext("2d", this.render.settings));
		this.#safeMutationObserver((obs) => {
			obs.disconnect();
		});
		container.retina.init();
		this.initBackground();
		this.#safeMutationObserver((obs) => {
			const element = this.domElement;
			if (!element || !(element instanceof Node)) return;
			obs.observe(element, { attributes: true });
		});
	}
	resize() {
		const element = this.domElement;
		if (!element) return false;
		const container = this.#container, renderCanvas = this.renderCanvas;
		if (renderCanvas === void 0) return false;
		const currentSize = container.canvas.#standardSize, newSize = {
			width: element.offsetWidth,
			height: element.offsetHeight
		}, pxRatio = container.retina.pixelRatio, retinaSize = {
			width: newSize.width * pxRatio,
			height: newSize.height * pxRatio
		};
		if (newSize.height === currentSize.height && newSize.width === currentSize.width && retinaSize.height === renderCanvas.height && retinaSize.width === renderCanvas.width) return false;
		const oldSize = { ...currentSize };
		currentSize.height = newSize.height;
		currentSize.width = newSize.width;
		const canvasSize = this.size;
		renderCanvas.width = canvasSize.width = retinaSize.width;
		renderCanvas.height = canvasSize.height = retinaSize.height;
		if (this.#container.started) container.particles.setResizeFactor({
			width: currentSize.width / oldSize.width,
			height: currentSize.height / oldSize.height
		});
		return true;
	}
	setPointerEvents(type) {
		if (!this.domElement) return;
		this.#pointerEvents = type;
		this.#repairStyle();
	}
	setZoom(zoomLevel, center) {
		this.zoom = zoomLevel;
		this.#zoomCenter = center;
	}
	stop() {
		this.#safeMutationObserver((obs) => {
			obs.disconnect();
		});
		this.#mutationObserver = void 0;
		this.render.stop();
	}
	async windowResize() {
		if (!this.domElement || !this.resize()) return;
		const container = this.#container, needsRefresh = container.updateActualOptions();
		container.particles.setDensity();
		this.#applyResizePlugins();
		if (needsRefresh) await container.refresh();
	}
	#applyResizePlugins = () => {
		for (const plugin of this.#resizePlugins) plugin.resize?.();
	};
	#initStyle = () => {
		const element = this.domElement, options = this.#container.actualOptions;
		if (!element) return;
		if (this.#fullScreen) this.#setFullScreenStyle();
		else this.#resetOriginalStyle();
		for (const key in options.style) {
			if (!key || !(key in options.style)) continue;
			const value = options.style[key];
			if (!value) continue;
			element.style.setProperty(key, value, "important");
		}
	};
	#repairStyle = () => {
		const element = this.domElement;
		if (!element) return;
		this.#safeMutationObserver((observer) => {
			observer.disconnect();
		});
		this.#initStyle();
		this.initBackground();
		const pointerEvents = this.#pointerEvents;
		element.style.pointerEvents = pointerEvents;
		element.style.setProperty("pointer-events", pointerEvents);
		this.#safeMutationObserver((observer) => {
			if (!(element instanceof Node)) return;
			observer.observe(element, { attributes: true });
		});
	};
	#resetOriginalStyle = () => {
		const element = this.domElement, originalStyle = this.#originalStyle;
		if (!element || !originalStyle) return;
		setStyle(element, originalStyle, true);
	};
	#safeMutationObserver = (callback) => {
		if (!this.#mutationObserver) return;
		callback(this.#mutationObserver);
	};
	#setFullScreenStyle = () => {
		const element = this.domElement;
		if (!element) return;
		setStyle(element, getFullScreenStyle(this.#container.actualOptions.fullScreen.zIndex), true);
	};
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Core/Utils/EventListeners.js
var EventListeners = class {
	#container;
	#handlers;
	#resizeObserver;
	#resizeTimeout;
	constructor(container) {
		this.#container = container;
		this.#handlers = {
			visibilityChange: () => {
				this.#handleVisibilityChange();
			},
			resize: () => {
				this.#handleWindowResize();
			}
		};
	}
	addListeners() {
		this.#manageListeners(true);
	}
	removeListeners() {
		this.#manageListeners(false);
	}
	#handleVisibilityChange = () => {
		const container = this.#container;
		if (!container.actualOptions.pauseOnBlur) return;
		if (safeDocument().hidden) {
			container.pageHidden = true;
			container.pause();
		} else {
			container.pageHidden = false;
			if (container.animationStatus) container.play(true);
			else container.draw(true);
		}
	};
	#handleWindowResize = () => {
		if (this.#resizeTimeout) {
			clearTimeout(this.#resizeTimeout);
			this.#resizeTimeout = void 0;
		}
		const handleResize = async () => {
			await this.#container.canvas.windowResize();
		};
		this.#resizeTimeout = setTimeout(() => void handleResize(), this.#container.actualOptions.resize.delay * millisecondsToSeconds);
	};
	#manageListeners = (add) => {
		const handlers = this.#handlers;
		this.#manageResize(add);
		manageListener(document, visibilityChangeEvent, handlers.visibilityChange, add, false);
	};
	#manageResize = (add) => {
		const handlers = this.#handlers, container = this.#container;
		if (!container.actualOptions.resize.enable) return;
		if (typeof ResizeObserver === "undefined") {
			manageListener(globalThis, resizeEvent, handlers.resize, add);
			return;
		}
		const canvasEl = container.canvas.domElement;
		if (this.#resizeObserver && !add) {
			if (canvasEl) this.#resizeObserver.unobserve(canvasEl);
			this.#resizeObserver.disconnect();
			this.#resizeObserver = void 0;
		} else if (!this.#resizeObserver && add && canvasEl) {
			this.#resizeObserver = new ResizeObserver((entries) => {
				if (!entries.find((e) => e.target === canvasEl)) return;
				this.#handleWindowResize();
			});
			this.#resizeObserver.observe(canvasEl);
		}
	};
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Core/Particle.js
function loadEffectData(effect, effectOptions, id, reduceDuplicates) {
	const effectData = effectOptions.options[effect];
	return deepExtend({ close: effectOptions.close }, itemFromSingleOrMultiple(effectData, id, reduceDuplicates));
}
function loadShapeData(shape, shapeOptions, id, reduceDuplicates) {
	const shapeData = shapeOptions.options[shape];
	return deepExtend({ close: shapeOptions.close }, itemFromSingleOrMultiple(shapeData, id, reduceDuplicates));
}
function fixOutMode(data) {
	if (!isInArray(data.outMode, data.checkModes)) return;
	const diameter = data.radius * 2;
	if (data.coord > data.maxCoord - diameter) data.setCb(-data.radius);
	else if (data.coord < diameter) data.setCb(data.radius);
}
var Particle = class {
	backColor;
	bubble;
	destroyed;
	direction;
	effect;
	effectClose;
	effectData;
	fillColor;
	fillEnabled;
	fillOpacity;
	group;
	id;
	ignoresResizeRatio;
	initialPosition;
	initialVelocity;
	isRotating;
	justWarped;
	lastPathTime;
	misplaced;
	moveCenter;
	offset;
	opacity;
	options;
	outType;
	pathRotation;
	position;
	randomIndexData;
	retina;
	roll;
	rotation;
	shape;
	shapeClose;
	shapeData;
	sides;
	size;
	slow;
	spawning;
	strokeColor;
	strokeOpacity;
	strokeWidth;
	unbreakable;
	velocity;
	zIndexFactor;
	#cachedOpacityData = {
		fillOpacity: 1,
		opacity: 1,
		strokeOpacity: 1
	};
	#cachedPosition = Vector3d.origin;
	#cachedRotateData = {
		sin: 0,
		cos: 0
	};
	#cachedTransform = {
		a: 1,
		b: 0,
		c: 0,
		d: 1
	};
	#container;
	#pluginManager;
	constructor(pluginManager, container) {
		this.#pluginManager = pluginManager;
		this.#container = container;
	}
	destroy(override) {
		if (this.unbreakable || this.destroyed) return;
		this.destroyed = true;
		this.bubble.inRange = false;
		this.slow.inRange = false;
		const container = this.#container;
		(this.shape ? container.shapeDrawers.get(this.shape) : void 0)?.particleDestroy?.(this);
		for (const plugin of container.particleDestroyedPlugins) plugin.particleDestroyed?.(this, override);
		for (const updater of container.particleUpdaters) updater.particleDestroyed?.(this, override);
		this.#container.dispatchEvent(EventType.particleDestroyed, { particle: this });
	}
	draw(delta) {
		const render = this.#container.canvas.render;
		render.drawParticlePlugins(this, delta);
		render.drawParticle(this, delta);
	}
	getAngle() {
		return this.rotation + (this.pathRotation ? this.velocity.angle : 0);
	}
	getFillColor() {
		return this.#getRollColor(this.bubble.color ?? getHslFromAnimation(this.fillColor));
	}
	getMass() {
		return this.getRadius() ** 2 * Math.PI * half;
	}
	getOpacity() {
		const zIndexOptions = this.options.zIndex, zOpacityFactor = (1 - this.zIndexFactor) ** zIndexOptions.opacityRate, opacity = this.bubble.opacity ?? getRangeValue(this.opacity?.value ?? 1), fillOpacity = this.fillOpacity ?? 1, strokeOpacity = this.strokeOpacity ?? 1;
		this.#cachedOpacityData.fillOpacity = opacity * fillOpacity * zOpacityFactor;
		this.#cachedOpacityData.opacity = opacity * zOpacityFactor;
		this.#cachedOpacityData.strokeOpacity = opacity * strokeOpacity * zOpacityFactor;
		return this.#cachedOpacityData;
	}
	getPosition() {
		this.#cachedPosition.x = this.position.x + this.offset.x;
		this.#cachedPosition.y = this.position.y + this.offset.y;
		this.#cachedPosition.z = this.position.z;
		return this.#cachedPosition;
	}
	getRadius() {
		return this.bubble.radius ?? this.size.value;
	}
	getRotateData() {
		const angle = this.getAngle();
		this.#cachedRotateData.sin = Math.sin(angle);
		this.#cachedRotateData.cos = Math.cos(angle);
		return this.#cachedRotateData;
	}
	getStrokeColor() {
		return this.#getRollColor(this.bubble.color ?? getHslFromAnimation(this.strokeColor));
	}
	getTransformData(externalTransform) {
		const rotateData = this.getRotateData(), rotating = this.isRotating;
		this.#cachedTransform.a = rotateData.cos * (externalTransform.a ?? defaultTransform.a);
		this.#cachedTransform.b = rotating ? rotateData.sin * (externalTransform.b ?? 1) : externalTransform.b ?? defaultTransform.b;
		this.#cachedTransform.c = rotating ? -rotateData.sin * (externalTransform.c ?? 1) : externalTransform.c ?? defaultTransform.c;
		this.#cachedTransform.d = rotateData.cos * (externalTransform.d ?? defaultTransform.d);
		return this.#cachedTransform;
	}
	init(id, position, overrideOptions, group) {
		const container = this.#container;
		this.id = id;
		this.group = group;
		this.justWarped = false;
		this.effectClose = true;
		this.shapeClose = true;
		this.pathRotation = false;
		this.lastPathTime = 0;
		this.destroyed = false;
		this.unbreakable = false;
		this.isRotating = false;
		this.rotation = 0;
		this.misplaced = false;
		this.retina = {
			maxDistance: {},
			maxSpeed: 0,
			moveDrift: 0,
			moveSpeed: 0,
			sizeAnimationSpeed: 0
		};
		this.size = {
			value: 1,
			max: 1,
			min: 1,
			enable: false
		};
		this.outType = ParticleOutType.normal;
		this.ignoresResizeRatio = true;
		const mainOptions = container.actualOptions, particlesOptions = loadParticlesOptions(this.#pluginManager, container, mainOptions.particles), reduceDuplicates = particlesOptions.reduceDuplicates, effectType = particlesOptions.effect.type, shapeType = particlesOptions.shape.type;
		this.effect = itemFromSingleOrMultiple(effectType, this.id, reduceDuplicates);
		this.shape = itemFromSingleOrMultiple(shapeType, this.id, reduceDuplicates);
		const effectOptions = particlesOptions.effect, shapeOptions = particlesOptions.shape;
		if (overrideOptions) {
			if (overrideOptions.effect?.type && overrideOptions.effect.type !== this.effect) {
				const overrideEffectType = overrideOptions.effect.type, effect = itemFromSingleOrMultiple(overrideEffectType, this.id, reduceDuplicates);
				if (effect) {
					this.effect = effect;
					effectOptions.load(overrideOptions.effect);
				}
			}
			if (overrideOptions.shape?.type && overrideOptions.shape.type !== this.shape) {
				const overrideShapeType = overrideOptions.shape.type, shape = itemFromSingleOrMultiple(overrideShapeType, this.id, reduceDuplicates);
				if (shape) {
					this.shape = shape;
					shapeOptions.load(overrideOptions.shape);
				}
			}
		}
		if (this.effect === "random") {
			const availableEffects = [...this.#container.effectDrawers.keys()];
			this.effect = availableEffects[Math.floor(getRandom() * availableEffects.length)];
		}
		if (this.shape === "random") {
			const availableShapes = [...this.#container.shapeDrawers.keys()];
			this.shape = availableShapes[Math.floor(getRandom() * availableShapes.length)];
		}
		this.effectData = this.effect ? loadEffectData(this.effect, effectOptions, this.id, reduceDuplicates) : void 0;
		this.shapeData = this.shape ? loadShapeData(this.shape, shapeOptions, this.id, reduceDuplicates) : void 0;
		particlesOptions.load(overrideOptions);
		const effectData = this.effectData, shapeData = this.shapeData;
		if (effectData) particlesOptions.load(effectData.particles);
		if (shapeData) particlesOptions.load(shapeData.particles);
		this.effectClose = effectData?.close ?? particlesOptions.effect.close;
		this.shapeClose = shapeData?.close ?? particlesOptions.shape.close;
		this.options = particlesOptions;
		container.retina.initParticle(this);
		for (const updater of container.particleUpdaters) updater.preInit?.(this);
		this.bubble = { inRange: false };
		this.slow = {
			inRange: false,
			factor: 1
		};
		this.#initPosition(position);
		this.initialVelocity = this.#calculateVelocity();
		this.velocity = this.initialVelocity.copy();
		this.zIndexFactor = this.position.z / container.zLayers;
		this.sides = 24;
		let effectDrawer, shapeDrawer;
		if (this.effect) effectDrawer = container.effectDrawers.get(this.effect);
		if (effectDrawer?.loadEffect) effectDrawer.loadEffect(this);
		if (this.shape) shapeDrawer = container.shapeDrawers.get(this.shape);
		if (shapeDrawer?.loadShape) shapeDrawer.loadShape(this);
		const sideCountFunc = shapeDrawer?.getSidesCount;
		if (sideCountFunc) this.sides = sideCountFunc(this);
		this.spawning = false;
		for (const updater of container.particleUpdaters) updater.init(this);
		effectDrawer?.particleInit?.(container, this);
		shapeDrawer?.particleInit?.(container, this);
		for (const plugin of container.particleCreatedPlugins) plugin.particleCreated?.(this);
	}
	isInsideCanvas(direction) {
		return this.#getInsideCanvasResult({ direction }).inside;
	}
	isInsideCanvasForOutMode(outMode, direction) {
		return this.#getInsideCanvasResult({
			direction,
			outMode
		}).inside;
	}
	isShowingBack() {
		if (!this.roll) return false;
		const angle = this.roll.angle;
		if (this.roll.horizontal && this.roll.vertical) {
			const normalizedAngle = angle % doublePI, adjustedAngle = normalizedAngle < 0 ? normalizedAngle + doublePI : normalizedAngle;
			return adjustedAngle >= Math.PI * .5 && adjustedAngle < Math.PI * 3 * .5;
		}
		if (this.roll.horizontal) {
			const normalizedAngle = (angle + Math.PI * half) % (Math.PI * 2), adjustedAngle = normalizedAngle < 0 ? normalizedAngle + Math.PI * 2 : normalizedAngle;
			return adjustedAngle >= Math.PI && adjustedAngle < Math.PI * 2;
		}
		if (this.roll.vertical) {
			const normalizedAngle = angle % (Math.PI * 2), adjustedAngle = normalizedAngle < 0 ? normalizedAngle + Math.PI * 2 : normalizedAngle;
			return adjustedAngle >= Math.PI && adjustedAngle < Math.PI * 2;
		}
		return false;
	}
	isVisible() {
		return !this.destroyed && !this.spawning && this.isInsideCanvas();
	}
	reset() {
		for (const updater of this.#container.particleUpdaters) updater.reset?.(this);
	}
	#calcPosition = (position, zIndex) => {
		let tryCount = 0, posVec = position ? Vector3d.create(position.x, position.y, zIndex) : void 0;
		const container = this.#container, plugins = container.particlePositionPlugins, outModes = this.options.move.outModes, radius = this.getRadius(), canvasSize = container.canvas.size, { signal } = new AbortController();
		while (!signal.aborted) {
			for (const plugin of plugins) {
				const pluginPos = plugin.particlePosition?.(posVec, this);
				if (pluginPos) return Vector3d.create(pluginPos.x, pluginPos.y, zIndex);
			}
			const exactPosition = calcExactPositionOrRandomFromSize({
				size: canvasSize,
				position: posVec
			}), pos = Vector3d.create(exactPosition.x, exactPosition.y, zIndex);
			this.#fixHorizontal(pos, radius, outModes.left ?? outModes.default);
			this.#fixHorizontal(pos, radius, outModes.right ?? outModes.default);
			this.#fixVertical(pos, radius, outModes.top ?? outModes.default);
			this.#fixVertical(pos, radius, outModes.bottom ?? outModes.default);
			let isValidPosition = true;
			for (const plugin of container.particles.checkParticlePositionPlugins) {
				isValidPosition = plugin.checkParticlePosition?.(this, pos, tryCount) ?? true;
				if (!isValidPosition) break;
			}
			if (isValidPosition) return pos;
			tryCount += 1;
			posVec = void 0;
		}
		return posVec;
	};
	#calculateVelocity = () => {
		const moveOptions = this.options.move, res = getParticleBaseVelocity(this.direction).copy();
		if (moveOptions.direction === MoveDirection.inside || moveOptions.direction === MoveDirection.outside) return res;
		const rad = degToRad(getRangeValue(moveOptions.angle.value)), radOffset = degToRad(getRangeValue(moveOptions.angle.offset)), range = {
			left: radOffset - rad * half,
			right: radOffset + rad * half
		};
		if (!moveOptions.straight) res.angle += randomInRangeValue(setRangeValue(range.left, range.right));
		if (moveOptions.random && typeof moveOptions.speed === "number") res.length *= getRandom();
		return res;
	};
	#fixHorizontal = (pos, radius, outMode) => {
		fixOutMode({
			outMode,
			checkModes: [OutMode.bounce],
			coord: pos.x,
			maxCoord: this.#container.canvas.size.width,
			setCb: (value) => pos.x += value,
			radius
		});
	};
	#fixVertical = (pos, radius, outMode) => {
		fixOutMode({
			outMode,
			checkModes: [OutMode.bounce],
			coord: pos.y,
			maxCoord: this.#container.canvas.size.height,
			setCb: (value) => pos.y += value,
			radius
		});
	};
	#getDefaultInsideCanvasResult = (direction, outMode) => {
		const radius = this.getRadius(), canvasSize = this.#container.canvas.size, position = this.position, isBounce = outMode === OutMode.bounce;
		if (direction === OutModeDirection.bottom) return {
			inside: isBounce ? position.y + radius < canvasSize.height : position.y - radius < canvasSize.height,
			reason: "default"
		};
		if (direction === OutModeDirection.left) return {
			inside: isBounce ? position.x - radius > 0 : position.x + radius > 0,
			reason: "default"
		};
		if (direction === OutModeDirection.right) return {
			inside: isBounce ? position.x + radius < canvasSize.width : position.x - radius < canvasSize.width,
			reason: "default"
		};
		if (direction === OutModeDirection.top) return {
			inside: isBounce ? position.y - radius > 0 : position.y + radius > 0,
			reason: "default"
		};
		return {
			inside: position.x >= -radius && position.y >= -radius && position.y <= canvasSize.height + radius && position.x <= canvasSize.width + radius,
			reason: "default"
		};
	};
	#getInsideCanvasCallbackData = (direction, outMode) => {
		return {
			canvasSize: this.#container.canvas.size,
			direction,
			outMode,
			particle: this,
			radius: this.getRadius()
		};
	};
	#getInsideCanvasResult = (data) => {
		const defaultResult = this.#getDefaultInsideCanvasResult(data.direction, data.outMode), container = this.#container, shapeDrawer = this.shape ? container.shapeDrawers.get(this.shape) : void 0, effectDrawer = this.effect ? container.effectDrawers.get(this.effect) : void 0, shapeCheck = shapeDrawer?.isInsideCanvas, effectCheck = effectDrawer?.isInsideCanvas;
		if (!shapeCheck && !effectCheck) return defaultResult;
		const callbackData = this.#getInsideCanvasCallbackData(data.direction, data.outMode), shapeResult = shapeCheck ? this.#normalizeInsideCanvasResult(shapeCheck(callbackData), "shape") : void 0, effectResult = effectCheck ? this.#normalizeInsideCanvasResult(effectCheck(callbackData), "effect") : void 0;
		if (shapeResult && effectResult) {
			const margin = Math.max(shapeResult.margin ?? 0, effectResult.margin ?? 0);
			return {
				inside: shapeResult.inside && effectResult.inside,
				margin: margin > 0 ? margin : void 0,
				reason: "combined"
			};
		}
		return shapeResult ?? effectResult ?? defaultResult;
	};
	#getRollColor = (color) => {
		if (!color || !this.roll || !this.backColor && !this.roll.alter) return color;
		if (!this.isShowingBack()) return color;
		if (this.backColor) return this.backColor;
		if (this.roll.alter) return alterHsl(color, this.roll.alter.type, this.roll.alter.value);
		return color;
	};
	#initPosition = (position) => {
		const container = this.#container, zIndexValue = Math.floor(getRangeValue(this.options.zIndex.value)), initialPosition = this.#calcPosition(position, clamp(zIndexValue, 0, container.zLayers));
		if (!initialPosition) throw new Error("a valid position cannot be found for particle");
		this.position = initialPosition;
		this.initialPosition = this.position.copy();
		const canvasSize = container.canvas.size;
		this.moveCenter = {
			...getPosition(this.options.move.center, canvasSize),
			radius: this.options.move.center.radius,
			mode: this.options.move.center.mode
		};
		this.direction = getParticleDirectionAngle(this.options.move.direction, this.position, this.moveCenter);
		switch (this.options.move.direction) {
			case MoveDirection.inside:
				this.outType = ParticleOutType.inside;
				break;
			case MoveDirection.outside:
				this.outType = ParticleOutType.outside;
				break;
			default: break;
		}
		this.offset = Vector.origin;
	};
	#normalizeInsideCanvasResult = (result, reason) => {
		if (typeof result === "boolean") return {
			inside: result,
			reason
		};
		return {
			inside: result.inside,
			margin: result.margin,
			reason: result.reason ?? reason
		};
	};
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Core/Utils/SpatialHashGrid.js
var SpatialHashGrid = class {
	#cellSize;
	#cells = /* @__PURE__ */ new Map();
	#circlePool = [];
	#circlePoolIdx;
	#pendingCellSize;
	#rectanglePool = [];
	#rectanglePoolIdx;
	constructor(cellSize) {
		this.#cellSize = cellSize;
		this.#circlePoolIdx = 0;
		this.#rectanglePoolIdx = 0;
	}
	clear() {
		this.#cells.clear();
		const pendingCellSize = this.#pendingCellSize;
		if (pendingCellSize) this.#cellSize = pendingCellSize;
		this.#pendingCellSize = void 0;
	}
	insert(particle) {
		const { x, y } = particle.getPosition(), key = this.#cellKeyFromCoords(x, y);
		if (!this.#cells.has(key)) this.#cells.set(key, []);
		this.#cells.get(key)?.push(particle);
	}
	query(range, check, out = []) {
		const bounds = this.#getRangeBounds(range);
		if (!bounds) return out;
		const minCellX = Math.floor(bounds.minX / this.#cellSize), maxCellX = Math.floor(bounds.maxX / this.#cellSize), minCellY = Math.floor(bounds.minY / this.#cellSize), maxCellY = Math.floor(bounds.maxY / this.#cellSize);
		for (let cx = minCellX; cx <= maxCellX; cx++) for (let cy = minCellY; cy <= maxCellY; cy++) {
			const key = `${cx}_${cy}`, cellParticles = this.#cells.get(key);
			if (!cellParticles) continue;
			for (const p of cellParticles) {
				if (check && !check(p)) continue;
				if (range.contains(p.getPosition())) out.push(p);
			}
		}
		return out;
	}
	queryCircle(position, radius, check, out = []) {
		const circle = this.#acquireCircle(position.x, position.y, radius), result = this.query(circle, check, out);
		this.#releaseShapes();
		return result;
	}
	queryRectangle(position, size, check, out = []) {
		const rect = this.#acquireRectangle(position.x, position.y, size.width, size.height), result = this.query(rect, check, out);
		this.#releaseShapes();
		return result;
	}
	setCellSize(cellSize) {
		this.#pendingCellSize = cellSize;
	}
	#acquireCircle(x, y, r) {
		return (this.#circlePool[this.#circlePoolIdx++] ??= new Circle(x, y, r)).reset(x, y, r);
	}
	#acquireRectangle(x, y, w, h) {
		return (this.#rectanglePool[this.#rectanglePoolIdx++] ??= new Rectangle(x, y, w, h)).reset(x, y, w, h);
	}
	#cellKeyFromCoords(x, y) {
		return `${Math.floor(x / this.#cellSize)}_${Math.floor(y / this.#cellSize)}`;
	}
	#getRangeBounds(range) {
		if (range instanceof Circle) {
			const r = range.radius, { x, y } = range.position;
			return {
				minX: x - r,
				maxX: x + r,
				minY: y - r,
				maxY: y + r
			};
		}
		if (range instanceof Rectangle) {
			const { x, y } = range.position, { width, height } = range.size;
			return {
				minX: x,
				maxX: x + width,
				minY: y,
				maxY: y + height
			};
		}
		return null;
	}
	#releaseShapes() {
		this.#circlePoolIdx = 0;
		this.#rectanglePoolIdx = 0;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Core/ParticlesManager.js
var ParticlesManager = class {
	checkParticlePositionPlugins;
	grid;
	#array;
	#container;
	#groupLimits;
	#limit;
	#nextId;
	#particleBuckets;
	#particleResetPlugins;
	#particleUpdatePlugins;
	#pluginManager;
	#pool;
	#postParticleUpdatePlugins;
	#postUpdatePlugins;
	#resizeFactor;
	#updatePlugins;
	#zBuckets;
	constructor(pluginManager, container) {
		this.#pluginManager = pluginManager;
		this.#container = container;
		this.#nextId = 0;
		this.#array = [];
		this.#pool = [];
		this.#limit = 0;
		this.#groupLimits = /* @__PURE__ */ new Map();
		this.#particleBuckets = /* @__PURE__ */ new Map();
		this.#zBuckets = this.#createBuckets(this.#container.zLayers);
		this.grid = new SpatialHashGrid(100);
		this.checkParticlePositionPlugins = [];
		this.#particleResetPlugins = [];
		this.#particleUpdatePlugins = [];
		this.#postUpdatePlugins = [];
		this.#postParticleUpdatePlugins = [];
		this.#updatePlugins = [];
	}
	get count() {
		return this.#array.length;
	}
	addParticle(position, overrideOptions, group, initializer) {
		const limitMode = this.#container.actualOptions.particles.number.limit.mode, limit = group === void 0 ? this.#limit : this.#groupLimits.get(group) ?? this.#limit, currentCount = this.count;
		if (limit > 0) switch (limitMode) {
			case LimitMode.delete: {
				const countToRemove = currentCount + 1 - limit;
				if (countToRemove > 0) this.removeQuantity(countToRemove);
				break;
			}
			case LimitMode.wait:
				if (currentCount >= limit) return;
				break;
			default: break;
		}
		try {
			const particle = this.#pool.pop() ?? new Particle(this.#pluginManager, this.#container);
			particle.init(this.#nextId, position, overrideOptions, group);
			let canAdd = true;
			if (initializer) canAdd = initializer(particle);
			if (!canAdd) {
				this.#pool.push(particle);
				return;
			}
			this.#array.push(particle);
			this.#insertParticleIntoBucket(particle);
			this.#nextId++;
			this.#container.dispatchEvent(EventType.particleAdded, { particle });
			return particle;
		} catch (e) {
			getLogger().warning(`error adding particle: ${e}`);
		}
	}
	clear() {
		this.#array = [];
		this.#particleBuckets.clear();
		this.#resetBuckets(this.#container.zLayers);
	}
	destroy() {
		this.#array = [];
		this.#pool.length = 0;
		this.#particleBuckets.clear();
		this.#zBuckets = [];
		this.checkParticlePositionPlugins = [];
		this.#particleResetPlugins = [];
		this.#particleUpdatePlugins = [];
		this.#postUpdatePlugins = [];
		this.#postParticleUpdatePlugins = [];
		this.#updatePlugins = [];
	}
	drawParticles(delta) {
		for (let i = this.#zBuckets.length - 1; i >= 0; i--) {
			const bucket = this.#zBuckets[i];
			if (!bucket) continue;
			for (const particle of bucket) particle.draw(delta);
		}
	}
	filter(condition) {
		return this.#array.filter(condition);
	}
	find(condition) {
		return this.#array.find(condition);
	}
	get(index) {
		return this.#array[index];
	}
	async init() {
		const container = this.#container, options = container.actualOptions;
		this.checkParticlePositionPlugins = [];
		this.#updatePlugins = [];
		this.#particleUpdatePlugins = [];
		this.#postUpdatePlugins = [];
		this.#particleResetPlugins = [];
		this.#postParticleUpdatePlugins = [];
		this.#particleBuckets.clear();
		this.#resetBuckets(container.zLayers);
		this.grid = new SpatialHashGrid(100 * container.retina.pixelRatio);
		for (const plugin of container.plugins) {
			if (plugin.redrawInit) await plugin.redrawInit();
			if (plugin.checkParticlePosition) this.checkParticlePositionPlugins.push(plugin);
			if (plugin.update) this.#updatePlugins.push(plugin);
			if (plugin.particleUpdate) this.#particleUpdatePlugins.push(plugin);
			if (plugin.postUpdate) this.#postUpdatePlugins.push(plugin);
			if (plugin.particleReset) this.#particleResetPlugins.push(plugin);
			if (plugin.postParticleUpdate) this.#postParticleUpdatePlugins.push(plugin);
		}
		await this.#container.initDrawersAndUpdaters();
		for (const drawer of this.#container.effectDrawers.values()) await drawer.init?.(container);
		for (const drawer of this.#container.shapeDrawers.values()) await drawer.init?.(container);
		let handled = false;
		for (const plugin of container.plugins) {
			handled = plugin.particlesInitialization?.() ?? handled;
			if (handled) break;
		}
		if (!handled) {
			const particlesOptions = options.particles, groups = particlesOptions.groups;
			for (const group in groups) {
				const groupOptions = groups[group];
				if (!groupOptions) continue;
				for (let i = this.count, j = 0; j < groupOptions.number.value && i < particlesOptions.number.value; i++, j++) this.addParticle(void 0, groupOptions, group);
			}
			for (let i = this.count; i < particlesOptions.number.value; i++) this.addParticle();
		}
	}
	push(nb, position, overrideOptions, group) {
		for (let i = 0; i < nb; i++) this.addParticle(position, overrideOptions, group);
	}
	async redraw() {
		this.clear();
		await this.init();
		this.#container.canvas.render.drawParticles({
			value: 0,
			factor: 0
		});
	}
	remove(particle, group, override) {
		this.removeAt(this.#array.indexOf(particle), void 0, group, override);
	}
	removeAt(index, quantity = 1, group, override) {
		if (index < 0 || index > this.count) return;
		let deleted = 0;
		for (let i = index; deleted < quantity && i < this.count; i++) if (this.#removeParticle(i, group, override)) {
			i--;
			deleted++;
		}
	}
	removeQuantity(quantity, group) {
		this.removeAt(0, quantity, group);
	}
	setDensity() {
		const options = this.#container.actualOptions, groups = options.particles.groups;
		let pluginsCount = 0;
		for (const plugin of this.#container.plugins) if (plugin.particlesDensityCount) pluginsCount += plugin.particlesDensityCount();
		for (const group in groups) {
			const groupData = groups[group];
			if (!groupData) continue;
			const groupDataOptions = loadParticlesOptions(this.#pluginManager, this.#container, groupData);
			this.#applyDensity(groupDataOptions, pluginsCount, group);
		}
		this.#applyDensity(options.particles, pluginsCount);
	}
	setResizeFactor(factor) {
		this.#resizeFactor = factor;
	}
	update(delta) {
		this.grid.clear();
		for (const plugin of this.#updatePlugins) plugin.update?.(delta);
		const particlesToDelete = this.#updateParticlesPhase1(delta);
		for (const plugin of this.#postUpdatePlugins) plugin.postUpdate?.(delta);
		this.#updateParticlesPhase2(delta, particlesToDelete);
		if (particlesToDelete.size) for (const particle of particlesToDelete) this.remove(particle);
		this.#resizeFactor = void 0;
	}
	#addToPool = (...particles) => {
		this.#pool.push(...particles);
	};
	#applyDensity = (options, pluginsCount, group, groupOptions) => {
		const numberOptions = options.number;
		if (!numberOptions.density.enable) {
			if (group === void 0) this.#limit = numberOptions.limit.value;
			else if (groupOptions?.number.limit.value ?? numberOptions.limit.value) this.#groupLimits.set(group, groupOptions?.number.limit.value ?? numberOptions.limit.value);
			return;
		}
		const densityFactor = this.#initDensityFactor(numberOptions.density), optParticlesNumber = numberOptions.value, optParticlesLimit = numberOptions.limit.value > 0 ? numberOptions.limit.value : optParticlesNumber, particlesNumber = Math.min(optParticlesNumber, optParticlesLimit) * densityFactor + pluginsCount, particlesCount = Math.min(this.count, this.filter((t) => t.group === group).length);
		if (group === void 0) this.#limit = numberOptions.limit.value * densityFactor;
		else this.#groupLimits.set(group, numberOptions.limit.value * densityFactor);
		if (particlesCount < particlesNumber) this.push(Math.abs(particlesNumber - particlesCount), void 0, options, group);
		else if (particlesCount > particlesNumber) this.removeQuantity(particlesCount - particlesNumber, group);
	};
	#createBuckets = (zLayers) => {
		const bucketCount = Math.max(Math.floor(zLayers), 1);
		return Array.from({ length: bucketCount }, () => []);
	};
	#getBucketIndex = (zIndex) => {
		const maxBucketIndex = this.#zBuckets.length - 1;
		if (maxBucketIndex <= 0) return 0;
		return Math.min(Math.max(Math.floor(zIndex), 0), maxBucketIndex);
	};
	#getParticleInsertIndex = (bucket, particleId) => {
		let start = 0, end = bucket.length;
		while (start < end) {
			const middle = Math.floor((start + end) / 2), middleParticle = bucket[middle];
			if (!middleParticle) {
				end = middle;
				continue;
			}
			if (middleParticle.id < particleId) start = middle + 1;
			else end = middle;
		}
		return start;
	};
	#initDensityFactor = (densityOptions) => {
		const container = this.#container;
		if (!densityOptions.enable) return 1;
		const canvasSize = container.canvas.size, pxRatio = container.retina.pixelRatio;
		if (!canvasSize.width || !canvasSize.height) return 1;
		return canvasSize.width * canvasSize.height / (densityOptions.height * densityOptions.width * pxRatio ** 2);
	};
	#insertParticleIntoBucket = (particle) => {
		const bucketIndex = this.#getBucketIndex(particle.position.z), bucket = this.#zBuckets[bucketIndex];
		if (!bucket) return;
		bucket.splice(this.#getParticleInsertIndex(bucket, particle.id), 0, particle);
		this.#particleBuckets.set(particle.id, bucketIndex);
	};
	#removeParticle = (index, group, override) => {
		const particle = this.#array[index];
		if (!particle) return false;
		if (particle.group !== group) return false;
		this.#array.splice(index, 1);
		this.#removeParticleFromBucket(particle);
		particle.destroy(override);
		this.#container.dispatchEvent(EventType.particleRemoved, { particle });
		this.#addToPool(particle);
		return true;
	};
	#removeParticleFromBucket = (particle) => {
		const bucketIndex = this.#particleBuckets.get(particle.id) ?? this.#getBucketIndex(particle.position.z), bucket = this.#zBuckets[bucketIndex];
		if (!bucket) {
			this.#particleBuckets.delete(particle.id);
			return;
		}
		const particleIndex = this.#getParticleInsertIndex(bucket, particle.id);
		if (bucket[particleIndex]?.id !== particle.id) {
			this.#particleBuckets.delete(particle.id);
			return;
		}
		bucket.splice(particleIndex, 1);
		this.#particleBuckets.delete(particle.id);
	};
	#resetBuckets = (zLayers) => {
		const bucketCount = Math.max(Math.floor(zLayers), 1);
		if (this.#zBuckets.length !== bucketCount) {
			this.#zBuckets = this.#createBuckets(bucketCount);
			return;
		}
		for (const bucket of this.#zBuckets) bucket.length = 0;
	};
	#updateParticleBucket = (particle) => {
		const newBucketIndex = this.#getBucketIndex(particle.position.z), currentBucketIndex = this.#particleBuckets.get(particle.id);
		if (currentBucketIndex === void 0) {
			this.#insertParticleIntoBucket(particle);
			return;
		}
		if (currentBucketIndex === newBucketIndex) return;
		const currentBucket = this.#zBuckets[currentBucketIndex];
		if (currentBucket) {
			const particleIndex = this.#getParticleInsertIndex(currentBucket, particle.id);
			if (currentBucket[particleIndex]?.id === particle.id) currentBucket.splice(particleIndex, 1);
		}
		const newBucket = this.#zBuckets[newBucketIndex];
		if (!newBucket) {
			this.#particleBuckets.set(particle.id, newBucketIndex);
			return;
		}
		newBucket.splice(this.#getParticleInsertIndex(newBucket, particle.id), 0, particle);
		this.#particleBuckets.set(particle.id, newBucketIndex);
	};
	#updateParticlesPhase1 = (delta) => {
		const particlesToDelete = /* @__PURE__ */ new Set(), resizeFactor = this.#resizeFactor;
		for (const particle of this.#array) {
			if (resizeFactor && !particle.ignoresResizeRatio) {
				particle.position.x *= resizeFactor.width;
				particle.position.y *= resizeFactor.height;
				particle.initialPosition.x *= resizeFactor.width;
				particle.initialPosition.y *= resizeFactor.height;
			}
			particle.ignoresResizeRatio = false;
			for (const plugin of this.#particleResetPlugins) plugin.particleReset?.(particle);
			for (const plugin of this.#particleUpdatePlugins) {
				if (particle.destroyed) break;
				plugin.particleUpdate?.(particle, delta);
			}
			if (particle.destroyed) {
				particlesToDelete.add(particle);
				continue;
			}
			this.grid.insert(particle);
		}
		return particlesToDelete;
	};
	#updateParticlesPhase2 = (delta, particlesToDelete) => {
		for (const particle of this.#array) {
			if (particle.destroyed) {
				particlesToDelete.add(particle);
				continue;
			}
			for (const updater of this.#container.particleUpdaters) updater.update(particle, delta);
			if (!particle.spawning) for (const plugin of this.#postParticleUpdatePlugins) plugin.postParticleUpdate?.(particle, delta);
			this.#updateParticleBucket(particle);
		}
	};
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Core/Retina.js
var Retina = class {
	pixelRatio;
	reduceFactor;
	#container;
	constructor(container) {
		this.#container = container;
		this.pixelRatio = 1;
		this.reduceFactor = 1;
	}
	init() {
		const container = this.#container, options = container.actualOptions;
		this.pixelRatio = options.detectRetina ? devicePixelRatio : 1;
		this.reduceFactor = 1;
		const ratio = this.pixelRatio, canvas = container.canvas, element = canvas.domElement;
		if (element) {
			canvas.size.width = element.offsetWidth * ratio;
			canvas.size.height = element.offsetHeight * ratio;
		}
	}
	initParticle(particle) {
		const options = particle.options, ratio = this.pixelRatio, moveOptions = options.move, moveDistance = moveOptions.distance, props = particle.retina;
		props.maxSpeed = getRangeValue(moveOptions.gravity.maxSpeed) * ratio;
		props.moveDrift = getRangeValue(moveOptions.drift) * ratio;
		props.moveSpeed = getRangeValue(moveOptions.speed) * ratio;
		const maxDistance = props.maxDistance;
		maxDistance.horizontal = moveDistance.horizontal === void 0 ? void 0 : moveDistance.horizontal * ratio;
		maxDistance.vertical = moveDistance.vertical === void 0 ? void 0 : moveDistance.vertical * ratio;
	}
};
//#endregion
//#region node_modules/@tsparticles/engine/browser/Core/Container.js
function guardCheck(container) {
	return !container.destroyed;
}
function updateDelta(delta, value, fpsLimit = 60, smooth = false) {
	delta.value = value;
	delta.factor = smooth ? 60 / fpsLimit : 60 * value / millisecondsToSeconds;
}
function loadContainerOptions(pluginManager, container, ...sourceOptionsArr) {
	const options = new Options(pluginManager, container);
	loadOptions(options, ...sourceOptionsArr);
	return options;
}
var Container = class {
	actualOptions;
	canvas;
	destroyed;
	effectDrawers;
	fpsLimit;
	hdr;
	id;
	pageHidden;
	particleCreatedPlugins;
	particleDestroyedPlugins;
	particlePositionPlugins;
	particleUpdaters;
	particles;
	plugins;
	retina;
	shapeDrawers;
	started;
	zLayers;
	#delay;
	#delayTimeout;
	#delta = {
		value: 0,
		factor: 0
	};
	#dispatchCallback;
	#drawAnimationFrame;
	#duration;
	#eventListeners;
	#firstStart;
	#initialSourceOptions;
	#lastFrameTime;
	#lifeTime;
	#onDestroy;
	#options;
	#paused;
	#pluginManager;
	#smooth;
	#sourceOptions;
	constructor(params) {
		const { dispatchCallback, pluginManager, id, onDestroy, sourceOptions } = params;
		this.#pluginManager = pluginManager;
		this.#dispatchCallback = dispatchCallback;
		this.#onDestroy = onDestroy;
		this.id = Symbol(id);
		this.fpsLimit = 120;
		this.hdr = false;
		this.#smooth = false;
		this.#delay = 0;
		this.#duration = 0;
		this.#lifeTime = 0;
		this.#firstStart = true;
		this.started = false;
		this.destroyed = false;
		this.#paused = true;
		this.#lastFrameTime = 0;
		this.zLayers = 100;
		this.pageHidden = false;
		this.#sourceOptions = sourceOptions;
		this.#initialSourceOptions = sourceOptions;
		this.effectDrawers = /* @__PURE__ */ new Map();
		this.shapeDrawers = /* @__PURE__ */ new Map();
		this.particleUpdaters = [];
		this.retina = new Retina(this);
		this.canvas = new CanvasManager(this.#pluginManager, this);
		this.particles = new ParticlesManager(this.#pluginManager, this);
		this.plugins = [];
		this.particleDestroyedPlugins = [];
		this.particleCreatedPlugins = [];
		this.particlePositionPlugins = [];
		this.#options = loadContainerOptions(this.#pluginManager, this);
		this.actualOptions = loadContainerOptions(this.#pluginManager, this);
		this.#eventListeners = new EventListeners(this);
		this.dispatchEvent(EventType.containerBuilt);
	}
	get animationStatus() {
		return !this.#paused && !this.pageHidden && guardCheck(this);
	}
	get options() {
		return this.#options;
	}
	get sourceOptions() {
		return this.#sourceOptions;
	}
	addLifeTime(value) {
		this.#lifeTime += value;
	}
	alive() {
		return !this.#duration || this.#lifeTime <= this.#duration;
	}
	destroy(remove = true) {
		if (!guardCheck(this)) return;
		this.stop();
		this.particles.destroy();
		this.canvas.destroy();
		for (const [, effectDrawer] of this.effectDrawers) effectDrawer.destroy?.(this);
		for (const [, shapeDrawer] of this.shapeDrawers) shapeDrawer.destroy?.(this);
		for (const plugin of this.plugins) plugin.destroy?.();
		this.effectDrawers = /* @__PURE__ */ new Map();
		this.shapeDrawers = /* @__PURE__ */ new Map();
		this.particleUpdaters = [];
		this.plugins.length = 0;
		this.#pluginManager.clearPlugins(this);
		this.destroyed = true;
		this.#onDestroy(remove);
		this.dispatchEvent(EventType.containerDestroyed);
	}
	dispatchEvent(type, data) {
		this.#dispatchCallback(type, {
			container: this,
			data
		});
	}
	draw(force) {
		if (!guardCheck(this)) return;
		let refreshTime = force;
		this.#drawAnimationFrame = animate((timestamp) => {
			if (refreshTime) {
				this.#lastFrameTime = void 0;
				refreshTime = false;
			}
			this.#nextFrame(timestamp);
		});
	}
	async export(type, options = {}) {
		for (const plugin of this.plugins) {
			if (!plugin.export) continue;
			const res = await plugin.export(type, options);
			if (!res.supported) continue;
			return res.blob;
		}
		getLogger().error(`Export plugin with type ${type} not found`);
	}
	async init() {
		if (!guardCheck(this)) return;
		const allContainerPlugins = /* @__PURE__ */ new Map();
		for (const plugin of this.#pluginManager.plugins) {
			const containerPlugin = await plugin.getPlugin(this);
			if (containerPlugin.preInit) await containerPlugin.preInit();
			allContainerPlugins.set(plugin, containerPlugin);
		}
		await this.initDrawersAndUpdaters();
		this.#options = loadContainerOptions(this.#pluginManager, this, this.#initialSourceOptions, this.sourceOptions);
		this.actualOptions = loadContainerOptions(this.#pluginManager, this, this.#options);
		this.plugins.length = 0;
		this.particleDestroyedPlugins.length = 0;
		this.particleCreatedPlugins.length = 0;
		this.particlePositionPlugins.length = 0;
		for (const [plugin, containerPlugin] of allContainerPlugins) if (plugin.needsPlugin(this.actualOptions)) {
			this.plugins.push(containerPlugin);
			if (containerPlugin.particleCreated) this.particleCreatedPlugins.push(containerPlugin);
			if (containerPlugin.particleDestroyed) this.particleDestroyedPlugins.push(containerPlugin);
			if (containerPlugin.particlePosition) this.particlePositionPlugins.push(containerPlugin);
		}
		this.retina.init();
		this.canvas.init();
		this.updateActualOptions();
		this.canvas.initBackground();
		this.canvas.resize();
		const { delay, duration, fpsLimit, hdr, smooth, zLayers } = this.actualOptions;
		this.hdr = hdr;
		this.zLayers = zLayers;
		this.#duration = getRangeValue(duration) * millisecondsToSeconds;
		this.#delay = getRangeValue(delay) * millisecondsToSeconds;
		this.#lifeTime = 0;
		this.fpsLimit = fpsLimit > 0 ? fpsLimit : 120;
		this.#smooth = smooth;
		for (const plugin of this.plugins) await plugin.init?.();
		await this.particles.init();
		this.dispatchEvent(EventType.containerInit);
		this.particles.setDensity();
		for (const plugin of this.plugins) plugin.particlesSetup?.();
		this.dispatchEvent(EventType.particlesSetup);
	}
	async initDrawersAndUpdaters() {
		const pluginManager = this.#pluginManager;
		this.effectDrawers = await pluginManager.getEffectDrawers(this, true);
		this.shapeDrawers = await pluginManager.getShapeDrawers(this, true);
		this.particleUpdaters = await pluginManager.getUpdaters(this, true);
	}
	pause() {
		if (!guardCheck(this)) return;
		if (this.#drawAnimationFrame !== void 0) {
			cancelAnimation(this.#drawAnimationFrame);
			this.#drawAnimationFrame = void 0;
		}
		if (this.#paused) return;
		for (const plugin of this.plugins) plugin.pause?.();
		if (!this.pageHidden) this.#paused = true;
		this.dispatchEvent(EventType.containerPaused);
	}
	play(force) {
		if (!guardCheck(this)) return;
		const needsUpdate = this.#paused || force;
		if (this.#firstStart && !this.actualOptions.autoPlay) {
			this.#firstStart = false;
			return;
		}
		if (this.#paused) this.#paused = false;
		if (needsUpdate) {
			for (const plugin of this.plugins) if (plugin.play) plugin.play();
		}
		this.dispatchEvent(EventType.containerPlay);
		this.draw(needsUpdate ?? false);
	}
	async refresh() {
		if (!guardCheck(this)) return;
		this.stop();
		return this.start();
	}
	async reset(sourceOptions) {
		if (!guardCheck(this)) return;
		this.#initialSourceOptions = sourceOptions;
		this.#sourceOptions = sourceOptions;
		this.#options = loadContainerOptions(this.#pluginManager, this, this.#initialSourceOptions, this.sourceOptions);
		this.actualOptions = loadContainerOptions(this.#pluginManager, this, this.#options);
		return this.refresh();
	}
	async start() {
		if (!guardCheck(this) || this.started) return;
		await this.init();
		this.started = true;
		await new Promise((resolve) => {
			const start = async () => {
				this.#eventListeners.addListeners();
				for (const plugin of this.plugins) await plugin.start?.();
				this.dispatchEvent(EventType.containerStarted);
				this.play();
				resolve();
			};
			this.#delayTimeout = setTimeout(() => void start(), this.#delay);
		});
	}
	stop() {
		if (!guardCheck(this) || !this.started) return;
		if (this.#delayTimeout) {
			clearTimeout(this.#delayTimeout);
			this.#delayTimeout = void 0;
		}
		this.#firstStart = true;
		this.started = false;
		this.#eventListeners.removeListeners();
		this.pause();
		this.particles.clear();
		this.canvas.stop();
		for (const plugin of this.plugins) plugin.stop?.();
		this.particleCreatedPlugins.length = 0;
		this.particleDestroyedPlugins.length = 0;
		this.particlePositionPlugins.length = 0;
		this.#sourceOptions = this.#options;
		this.dispatchEvent(EventType.containerStopped);
	}
	updateActualOptions() {
		let refresh = false;
		for (const plugin of this.plugins) if (plugin.updateActualOptions) refresh = plugin.updateActualOptions() || refresh;
		return refresh;
	}
	#nextFrame = (timestamp) => {
		try {
			if (!this.#smooth && this.#lastFrameTime !== void 0 && timestamp < this.#lastFrameTime + 1e3 / this.fpsLimit) {
				this.draw(false);
				return;
			}
			this.#lastFrameTime ??= timestamp;
			updateDelta(this.#delta, timestamp - this.#lastFrameTime, this.fpsLimit, this.#smooth);
			this.addLifeTime(this.#delta.value);
			this.#lastFrameTime = timestamp;
			if (this.#delta.value > 1e3) {
				this.draw(false);
				return;
			}
			this.canvas.render.drawParticles(this.#delta);
			if (!this.alive()) {
				this.destroy();
				return;
			}
			if (this.animationStatus) this.draw(false);
		} catch (e) {
			getLogger().error("error in animation loop", e);
		}
	};
};
//#endregion
export { Container };

//# sourceMappingURL=Container-BC_tD0Nq.js.map