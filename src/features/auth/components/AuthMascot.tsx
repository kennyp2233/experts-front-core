"use client";

import { useEffect, useRef, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

export default function AuthMascot({ isShy = false }: { isShy?: boolean }) {
    const theme = useTheme();
    const svgRef = useRef<SVGSVGElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const isDark = theme.palette.mode === 'dark';

    // Eye tracking logic
    useEffect(() => {
        if (isShy) return; // Stop tracking when shy

        const handleMouseMove = (event: MouseEvent) => {
            if (!svgRef.current) return;

            // Get SVG position
            const rect = svgRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Calculate distance from center
            const dx = event.clientX - centerX;
            const dy = event.clientY - centerY;

            // Elliptical constraint math
            const a = 4.5; // Horizontal limit
            const b = 7.5; // Vertical limit

            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Calculate the radius of the ellipse at this angle
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const maxRadiusAtAngle = (a * b) / Math.sqrt(Math.pow(b * cos, 2) + Math.pow(a * sin, 2));

            // Move towards mouse but clamp to ellipse boundary
            const moveDistance = Math.min(distance / 10, maxRadiusAtAngle);

            const moveX = Math.cos(angle) * moveDistance;
            const moveY = Math.sin(angle) * moveDistance;

            setMousePos({ x: moveX, y: moveY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isShy]);

    const primaryColor = theme.palette.primary.main;
    const strokeColor = isDark ? '#E2E8F0' : '#334155';
    const faceFill = isDark ? '#1E293B' : '#FFFFFF';
    const blushColor = '#FF99AA';

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <svg
                ref={svgRef}
                width="140"
                height="120"
                viewBox="0 0 140 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Anime Robot Ears (Cat-like) */}
                <path d="M35 40 L20 15 Q40 10 55 30" fill={faceFill} stroke={strokeColor} strokeWidth="3" strokeLinejoin="round" />
                <path d="M105 40 L120 15 Q100 10 85 30" fill={faceFill} stroke={strokeColor} strokeWidth="3" strokeLinejoin="round" />

                {/* Inner Ear Details */}
                <path d="M30 25 L38 35" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
                <path d="M110 25 L102 35" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />

                {/* Head Shape (Soft Squircle) */}
                <rect x="25" y="30" width="90" height="75" rx="35" fill={faceFill} stroke={strokeColor} strokeWidth="3" />

                {/* Blush Marks (Kawaii essential) - Animated */}
                <motion.ellipse
                    cx="45"
                    cy="75"
                    rx="8"
                    ry="5"
                    fill={blushColor}
                    animate={{ opacity: isShy ? 0.9 : 0.6 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                />
                <motion.ellipse
                    cx="95"
                    cy="75"
                    rx="8"
                    ry="5"
                    fill={blushColor}
                    animate={{ opacity: isShy ? 0.9 : 0.6 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                />

                {/* Eyes Container */}
                <g transform="translate(70, 60)">
                    {/* Morphing Eye Ovals - They "close" when shy */}
                    <motion.ellipse
                        cx="-25"
                        cy="0"
                        rx="7"
                        fill={strokeColor}
                        animate={{
                            ry: isShy ? 1.5 : 10
                        }}
                        transition={{
                            duration: 0.4,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.ellipse
                        cx="25"
                        cy="0"
                        rx="7"
                        fill={strokeColor}
                        animate={{
                            ry: isShy ? 1.5 : 10
                        }}
                        transition={{
                            duration: 0.4,
                            ease: "easeInOut"
                        }}
                    />

                    {/* Moving White Pupils (fade out when shy) */}
                    <motion.g
                        transform={`translate(${mousePos.x}, ${mousePos.y})`}
                        animate={{
                            opacity: isShy ? 0 : 1
                        }}
                        transition={{
                            duration: 0.3,
                            ease: "easeInOut"
                        }}
                    >
                        <circle cx="-25" cy="0" r="2.5" fill="white" opacity="0.9" />
                        <circle cx="25" cy="0" r="2.5" fill="white" opacity="0.9" />
                    </motion.g>
                </g>

                {/* Tiny Mouth (Cat 'w' style) */}
                <path
                    d="M62 82 Q70 88 78 82"
                    stroke={strokeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                />

                {/* Antenna (Cute bobble) */}
                <line x1="70" y1="30" x2="70" y2="15" stroke={strokeColor} strokeWidth="2" />
                <circle cx="70" cy="12" r="5" fill={primaryColor} stroke={strokeColor} strokeWidth="2" />
                {/* Antenna Shine */}
                <circle cx="68" cy="10" r="1.5" fill="white" opacity="0.8" />

            </svg>
        </Box>
    );
}
