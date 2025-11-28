"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Points, PointMaterial } from '@react-three/drei';
import { useTheme } from '@mui/material';
import * as THREE from 'three';

// --- Configuration Constants ---
const GLOBE_BASE_SPEED = 0.1;
const GLOBE_MOUSE_SPEED_FACTOR = 0.2; // Controls how much the mouse accelerates the rotation
const GLOBE_MOUSE_TILT_FACTOR = 0.2;  // Controls how much the mouse tilts the globe

const PARTICLES_BASE_SPEED = 0.05;
const PARTICLES_MOUSE_SPEED_FACTOR = 0.2;
const PARTICLES_MOUSE_TILT_FACTOR = 0.2;

function Particles({ count = 2000, color, radius = 1.2 }: { count?: number; color: string; radius?: number }) {
    const points = useRef<THREE.Points>(null!);

    // Store original positions to return to them
    const originalPositions = useMemo(() => {
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = radius + Math.random() * (radius * 0.4);
            const theta = 2 * Math.PI * Math.random();
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        return positions;
    }, [count, radius]);

    // Current positions (mutable)
    const positions = useMemo(() => new Float32Array(originalPositions), [originalPositions]);

    // Refs for smooth transition
    const targetRotationX = useRef(0);
    const targetRotationY_Speed = useRef(PARTICLES_BASE_SPEED); // Base speed

    useFrame((state, delta) => {
        if (points.current) {
            // 1. Calculate targets
            const mouseTiltX = state.mouse.y * PARTICLES_MOUSE_TILT_FACTOR; // Particles tilt less
            const mouseSpinSpeed = PARTICLES_BASE_SPEED + (state.mouse.x * PARTICLES_MOUSE_SPEED_FACTOR);

            // 2. Smoothly interpolate
            const smooth = 2 * delta;
            targetRotationX.current = THREE.MathUtils.lerp(targetRotationX.current, mouseTiltX, smooth);
            targetRotationY_Speed.current = THREE.MathUtils.lerp(targetRotationY_Speed.current, mouseSpinSpeed, smooth);

            // 3. Apply rotations
            points.current.rotation.x = targetRotationX.current;
            points.current.rotation.y += targetRotationY_Speed.current * delta;

            // Breathing effect
            const dist = Math.sqrt(state.mouse.x ** 2 + state.mouse.y ** 2);
            // Smoothly lerp scale too
            points.current.scale.setScalar(THREE.MathUtils.lerp(points.current.scale.x, 1 + dist * 0.1, smooth));
        }
    });

    return (
        <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
            <PointMaterial
                transparent
                color={color}
                size={0.02}
                sizeAttenuation={true}
                depthWrite={false}
            />
        </Points>
    );
}

function AnimatedGlobe({ primaryColor, secondaryColor }: { primaryColor: string; secondaryColor: string }) {
    const meshRef = useRef<THREE.Mesh>(null!);

    // Refs for smooth transition
    const targetRotationX = useRef(0);
    const targetRotationY_Speed = useRef(GLOBE_BASE_SPEED); // Base speed

    useFrame((state, delta) => {
        if (meshRef.current) {
            // 1. Calculate targets based on mouse
            // Tilt X based on mouse Y (inverted for natural feel)
            const mouseTiltX = state.mouse.y * GLOBE_MOUSE_TILT_FACTOR; // Max tilt ~0.5 rad
            // Spin speed based on mouse X. Base is 0.1. Mouse adds up to +/- 0.5
            const mouseSpinSpeed = GLOBE_BASE_SPEED + (state.mouse.x * GLOBE_MOUSE_SPEED_FACTOR);

            // 2. Smoothly interpolate current values towards targets (Damping)
            // Lerp factor (adjust for smoothness)
            const smooth = 2 * delta;

            targetRotationX.current = THREE.MathUtils.lerp(targetRotationX.current, mouseTiltX, smooth);
            targetRotationY_Speed.current = THREE.MathUtils.lerp(targetRotationY_Speed.current, mouseSpinSpeed, smooth);

            // 3. Apply rotations
            // Apply smoothed tilt
            meshRef.current.rotation.x = targetRotationX.current;

            // Apply smoothed speed to continuous rotation
            meshRef.current.rotation.y += targetRotationY_Speed.current * delta;
        }
    });

    return (
        <group>
            {/* Main Wireframe Sphere */}
            <Sphere ref={meshRef} args={[1, 32, 32]}>
                <meshBasicMaterial
                    color={primaryColor}
                    wireframe
                    transparent
                    opacity={0.3}
                    side={THREE.DoubleSide}
                />
            </Sphere>

            {/* Dense Particle Core - Replaces the solid inner sphere */}
            <Particles count={800} color={secondaryColor} radius={0.5} />
        </group>
    );
}

export default function LogisticsGlobe() {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Invert colors based on the INVERTED background logic in page.tsx
    // If isDark (App Dark Mode) -> Globe Background is Light -> Particles should be Dark
    // If !isDark (App Light Mode) -> Globe Background is Dark -> Particles should be Light
    const primaryColor = theme.palette.primary.main;
    const secondaryColor = isDark ? '#000000' : '#ffffff';
    const particleColor = isDark ? theme.palette.primary.dark : '#ffffff';

    return (
        <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />

                <AnimatedGlobe primaryColor={primaryColor} secondaryColor={secondaryColor} />
                {/* Outer particle field */}
                <Particles count={1500} color={particleColor} radius={1.2} />
            </Canvas>
        </div>
    );
}
