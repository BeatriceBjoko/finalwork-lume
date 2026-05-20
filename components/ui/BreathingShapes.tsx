import { BlurMask, Canvas, Circle, Group, Path, Skia, type SkPath } from "@shopify/react-native-skia";
import React, { memo, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, type SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { BREATHING, type Session } from "../../hooks/useBreathing";

// Pure path builders (worklet-safe)
function buildPolygonPath(cx: number, cy: number, radius: number, vertexCount: number, rotateOffsetDeg: number): SkPath {
	"worklet";
	const p = Skia.Path.Make();
	const startAngle = (rotateOffsetDeg * Math.PI) / 180 - Math.PI / 2;
	for (let i = 0; i < vertexCount; i++) {
		const a = startAngle + (i / vertexCount) * Math.PI * 2;
		const x = cx + Math.cos(a) * radius;
		const y = cy + Math.sin(a) * radius;
		if (i === 0) p.moveTo(x, y);
		else p.lineTo(x, y);
	}
	p.close();
	return p;
}

function buildBlobPath(cx: number, cy: number, baseRadius: number, variance: number, phase: number, segments = 7): SkPath {
	"worklet";
	const p = Skia.Path.Make();
	const pts: { x: number; y: number }[] = [];
	for (let i = 0; i < segments; i++) {
		const a = (i / segments) * Math.PI * 2;
		const r = baseRadius + Math.sin(a * 2 + phase) * variance + Math.cos(a * 3 + phase * 0.6) * variance * 0.55;
		pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
	}
	const first = pts[0];
	const last = pts[segments - 1];
	p.moveTo((last.x + first.x) / 2, (last.y + first.y) / 2);
	for (let i = 0; i < segments; i++) {
		const cur = pts[i];
		const next = pts[(i + 1) % segments];
		p.quadTo(cur.x, cur.y, (cur.x + next.x) / 2, (cur.y + next.y) / 2);
	}
	p.close();
	return p;
}

function buildBloomPath(cx: number, cy: number, petalLength: number, petalWidth: number, petals: number, rotationRad: number): SkPath {
	"worklet";
	const p = Skia.Path.Make();
	for (let i = 0; i < petals; i++) {
		const a = (i / petals) * Math.PI * 2 + rotationRad;
		const tipX = cx + Math.cos(a) * petalLength;
		const tipY = cy + Math.sin(a) * petalLength;
		const perpX = -Math.sin(a);
		const perpY = Math.cos(a);
		const midX = cx + Math.cos(a) * petalLength * 0.55;
		const midY = cy + Math.sin(a) * petalLength * 0.55;
		p.moveTo(cx, cy);
		p.quadTo(midX + perpX * petalWidth, midY + perpY * petalWidth, tipX, tipY);
		p.quadTo(midX - perpX * petalWidth, midY - perpY * petalWidth, cx, cy);
		p.close();
	}
	return p;
}

interface ShapeBaseProps {
	primary: string;
	glow: string;
	breathValue: SharedValue<number>;
	continuousRotation: SharedValue<number>;
}

function HobermanPolygon({ vertexCount, rotateOffset, primary, glow, breathValue, continuousRotation }: ShapeBaseProps & { vertexCount: number; rotateOffset: number }) {
	const halfAngleRad = Math.PI / vertexCount;
	const baseR = BREATHING.polygonBaseRadius;

	const outerStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${continuousRotation.value + rotateOffset}deg` }, { scale: 0.55 + breathValue.value * 0.55 }],
		opacity: 0.65 + breathValue.value * 0.35,
	}));

	const innerStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${-continuousRotation.value * 1.3 + rotateOffset}deg` }, { scale: 0.6 + (1 - breathValue.value) * 0.45 }],
		opacity: 0.35 + breathValue.value * 0.25,
	}));

	const renderEdges = (radius: number) => {
		const eDist = radius * Math.cos(halfAngleRad);
		const eLen = 2 * radius * Math.sin(halfAngleRad);
		return Array.from({ length: vertexCount }).map((_, i) => {
			const midAngle = ((i + 0.5) * 360) / vertexCount;
			return (
				<View key={`edge-${i}`} style={[styles.transformWrap, { transform: [{ rotate: `${midAngle}deg` }, { translateY: -eDist }] }]}>
					<View style={[styles.edge, { width: eLen, backgroundColor: primary, shadowColor: glow }]} />
				</View>
			);
		});
	};

	const renderVertices = (radius: number) =>
		Array.from({ length: vertexCount }).map((_, i) => {
			const angle = (i * 360) / vertexCount;
			return (
				<View key={`vertex-${i}`} style={[styles.transformWrap, { transform: [{ rotate: `${angle}deg` }, { translateY: -radius }] }]}>
					<View style={[styles.vertex, { backgroundColor: glow, borderColor: primary, shadowColor: glow }]} />
				</View>
			);
		});

	return (
		<>
			<Animated.View style={[styles.polygonContainer, innerStyle]}>{renderEdges(baseR * 0.55)}</Animated.View>
			<Animated.View style={[styles.polygonContainer, outerStyle]}>
				{renderEdges(baseR)}
				{renderVertices(baseR)}
			</Animated.View>
		</>
	);
}

function BlobShape({ primary, glow, breathValue, continuousRotation, size = 260 }: ShapeBaseProps & { size?: number }) {
	const cx = size / 2;
	const cy = size / 2;

	const blobPath = useDerivedValue(() => {
		const t = breathValue.value;
		const baseR = size * 0.18 + (t - BREATHING.minScale) * size * 0.32;
		const variance = size * 0.06;
		const phase = (continuousRotation.value * Math.PI) / 180;
		return buildBlobPath(cx, cy, baseR, variance, phase, 7);
	});
	const ringRadius = useDerivedValue(() => size * 0.32 + breathValue.value * size * 0.08);

	return (
		<Canvas style={[styles.canvas, { width: size, height: size }]}>
			<Group>
				<Path path={blobPath} color={`${glow}55`}>
					<BlurMask blur={28} style="normal" />
				</Path>
				<Path path={blobPath} color={`${glow}AA`}>
					<BlurMask blur={10} style="normal" />
				</Path>
				<Path path={blobPath} color={primary} style="stroke" strokeWidth={2.2}>
					<BlurMask blur={3} style="solid" />
				</Path>
				<Circle cx={cx - size * 0.05} cy={cy - size * 0.06} r={size * 0.04} color={`${glow}FF`}>
					<BlurMask blur={8} style="normal" />
				</Circle>
				<Circle cx={cx} cy={cy} r={ringRadius} color={`${primary}66`} style="stroke" strokeWidth={1}>
					<BlurMask blur={6} style="solid" />
				</Circle>
			</Group>
		</Canvas>
	);
}

function BloomShape({ primary, glow, breathValue, continuousRotation, petals = 8, size = 260 }: ShapeBaseProps & { petals?: number; size?: number }) {
	const cx = size / 2;
	const cy = size / 2;

	const petalPath = useDerivedValue(() => {
		const t = breathValue.value;
		const open = 0.4 + (t - BREATHING.minScale) * 1.5;
		const rotationRad = (continuousRotation.value * Math.PI) / 180;
		const petalLength = size * 0.36 * open;
		const petalWidth = size * 0.08 * (0.7 + open * 0.4);
		return buildBloomPath(cx, cy, petalLength, petalWidth, petals, rotationRad);
	});
	const coreRadius = useDerivedValue(() => size * 0.05 + breathValue.value * size * 0.04);

	return (
		<Canvas style={[styles.canvas, { width: size, height: size }]}>
			<Group>
				<Path path={petalPath} color={`${glow}55`}>
					<BlurMask blur={22} style="normal" />
				</Path>
				<Path path={petalPath} color={`${glow}AA`}>
					<BlurMask blur={8} style="normal" />
				</Path>
				<Path path={petalPath} color={primary} style="stroke" strokeWidth={1.8}>
					<BlurMask blur={2.5} style="solid" />
				</Path>
				<Circle cx={cx} cy={cy} r={coreRadius} color={glow}>
					<BlurMask blur={14} style="normal" />
				</Circle>
				<Circle cx={cx} cy={cy} r={coreRadius} color={primary} />
			</Group>
		</Canvas>
	);
}

interface SceneProps {
	session: Session;
	breathValue: SharedValue<number>;
	continuousRotation: SharedValue<number>;
}

export const AnimatedScene = memo(function AnimatedScene({ session, breathValue, continuousRotation }: SceneProps) {
	const common = { primary: session.polygonColor, glow: session.polygonGlow, breathValue, continuousRotation };
	if (session.shape === "blob") return <BlobShape {...common} />;
	if (session.shape === "bloom") return <BloomShape {...common} petals={session.vertexCount} />;
	return <HobermanPolygon {...common} vertexCount={session.vertexCount} rotateOffset={session.rotateOffset} />;
});

function MiniPolygon({ vertexCount, rotateOffset, color, glow, size }: { vertexCount: number; rotateOffset: number; color: string; glow: string; size: number }) {
	const path = useMemo(() => buildPolygonPath(size / 2, size / 2, size * 0.42, vertexCount, rotateOffset), [size, vertexCount, rotateOffset]);
	const vertices = useMemo(() => {
		const r = size * 0.42;
		const startAngle = (rotateOffset * Math.PI) / 180 - Math.PI / 2;
		return Array.from({ length: vertexCount }, (_, i) => {
			const a = startAngle + (i / vertexCount) * Math.PI * 2;
			return { x: size / 2 + Math.cos(a) * r, y: size / 2 + Math.sin(a) * r };
		});
	}, [size, vertexCount, rotateOffset]);

	return (
		<Canvas style={{ width: size, height: size }}>
			<Group>
				<Path path={path} color={`${glow}99`}>
					<BlurMask blur={14} style="normal" />
				</Path>
				<Path path={path} color={`${glow}66`} />
				<Path path={path} color={color} style="stroke" strokeWidth={1.5}>
					<BlurMask blur={2} style="solid" />
				</Path>
				{vertices.map((v, i) => (
					<Circle key={i} cx={v.x} cy={v.y} r={size * 0.045} color={glow} />
				))}
			</Group>
		</Canvas>
	);
}

function MiniBlob({ color, glow, size }: { color: string; glow: string; size: number }) {
	const path = useMemo(() => buildBlobPath(size / 2, size / 2, size * 0.34, size * 0.06, 0, 7), [size]);
	return (
		<Canvas style={{ width: size, height: size }}>
			<Group>
				<Path path={path} color={`${glow}AA`}>
					<BlurMask blur={16} style="normal" />
				</Path>
				<Path path={path} color={`${glow}80`}>
					<BlurMask blur={5} style="normal" />
				</Path>
				<Path path={path} color={color} style="stroke" strokeWidth={1.6}>
					<BlurMask blur={2} style="solid" />
				</Path>
				<Circle cx={size / 2 - size * 0.06} cy={size / 2 - size * 0.07} r={size * 0.04} color="#FFFFFF" opacity={0.85} />
			</Group>
		</Canvas>
	);
}

function MiniBloom({ color, glow, petals, size }: { color: string; glow: string; petals: number; size: number }) {
	const path = useMemo(() => buildBloomPath(size / 2, size / 2, size * 0.38, size * 0.09, petals, 0), [size, petals]);
	return (
		<Canvas style={{ width: size, height: size }}>
			<Group>
				<Path path={path} color={`${glow}AA`}>
					<BlurMask blur={14} style="normal" />
				</Path>
				<Path path={path} color={`${glow}80`}>
					<BlurMask blur={4} style="normal" />
				</Path>
				<Path path={path} color={color} style="stroke" strokeWidth={1.4}>
					<BlurMask blur={2} style="solid" />
				</Path>
				<Circle cx={size / 2} cy={size / 2} r={size * 0.06} color={glow}>
					<BlurMask blur={6} style="normal" />
				</Circle>
				<Circle cx={size / 2} cy={size / 2} r={size * 0.04} color="#FFFFFF" />
			</Group>
		</Canvas>
	);
}

export const MiniShape = memo(function MiniShape({ session, size = 60 }: { session: Session; size?: number }) {
	if (session.shape === "blob") return <MiniBlob color={session.polygonColor} glow={session.polygonGlow} size={size} />;
	if (session.shape === "bloom") return <MiniBloom color={session.polygonColor} glow={session.polygonGlow} petals={session.vertexCount} size={size} />;
	return <MiniPolygon vertexCount={session.vertexCount} rotateOffset={session.rotateOffset} color={session.polygonColor} glow={session.polygonGlow} size={size} />;
});

export const Ripple = memo(function Ripple({ delay, durationMs, color }: { delay: number; durationMs: number; color: string }) {
	const scale = useSharedValue(0);
	const opacity = useSharedValue(0);

	useEffect(() => {
		const timeout = setTimeout(() => {
			scale.value = withRepeat(withTiming(1, { duration: durationMs, easing: Easing.out(Easing.cubic) }), -1, false);
			opacity.value = withRepeat(withSequence(withTiming(0.6, { duration: durationMs * 0.15, easing: Easing.linear }), withTiming(0, { duration: durationMs * 0.85, easing: Easing.linear })), -1, false);
		}, delay);
		return () => clearTimeout(timeout);
	}, [delay, durationMs, scale, opacity]);

	const style = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
		opacity: opacity.value,
	}));

	const size = BREATHING.sceneSize * 0.78;
	return (
		<Animated.View
			style={[
				{
					position: "absolute",
					width: size,
					height: size,
					borderRadius: size / 2,
					borderWidth: 1.5,
					borderColor: color,
					backgroundColor: "transparent",
				},
				style,
			]}
		/>
	);
});

const styles = StyleSheet.create({
	canvas: { position: "absolute" },
	polygonContainer: {
		width: 250,
		height: 250,
		alignItems: "center",
		justifyContent: "center",
		position: "absolute",
	},
	transformWrap: {
		position: "absolute",
		alignItems: "center",
		justifyContent: "center",
	},
	edge: {
		height: 2.5,
		borderRadius: 1.5,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.95,
		shadowRadius: 14,
		elevation: 8,
	},
	vertex: {
		width: 16,
		height: 16,
		borderRadius: 8,
		borderWidth: 2,
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 1,
		shadowRadius: 16,
		elevation: 10,
	},
});
