"use client";

import { motion, useInView, UseInViewOptions, HTMLMotionProps, Variants } from "framer-motion";
import { useRef, ReactNode } from "react";

// --- Variants ---

export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.22, 1, 0.36, 1] // Custom refined bezier
        }
    }
};

export const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05
        }
    }
};

export const scaleIn: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: "easeOut"
        }
    }
};

export const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -60 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

export const slideInRight: Variants = {
    hidden: { opacity: 0, x: 60 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};

export const zoomInVariant: Variants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: "easeOut" }
    }
};

// --- Components ---

interface MotionProps extends HTMLMotionProps<"div"> {
    children: ReactNode;
    delay?: number;
    viewport?: UseInViewOptions;
    /** If true, this component will NOT trigger on its own viewport entry, but wait for parent propagation. */
    manualTrigger?: boolean;
}

interface SlideInProps extends MotionProps {
    direction?: "left" | "right" | "up" | "down";
}

export function FadeIn({ children, delay = 0, className, manualTrigger = false, ...props }: MotionProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView={manualTrigger ? undefined : "visible"}
            viewport={manualTrigger ? undefined : { once: true, margin: "-20px" }}
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: 0.5,
                        delay: delay,
                        ease: "easeOut"
                    }
                }
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function SlideIn({ children, className, direction = "left", delay = 0, manualTrigger = false, ...props }: SlideInProps) {
    const variants: Variants = {
        hidden: {
            opacity: 0,
            x: direction === "left" ? -60 : direction === "right" ? 60 : 0,
            y: direction === "up" ? 60 : direction === "down" ? -60 : 0
        },
        visible: {
            opacity: 1,
            x: 0,
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" as const, delay: delay }
        }
    };

    return (
        <motion.div
            initial="hidden"
            whileInView={manualTrigger ? undefined : "visible"}
            viewport={manualTrigger ? undefined : { once: true, margin: "-20px" }}
            variants={variants}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function ZoomIn({ children, className, delay = 0, manualTrigger = false, ...props }: MotionProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView={manualTrigger ? undefined : "visible"}
            viewport={manualTrigger ? undefined : { once: true, margin: "-20px" }}
            variants={{
                hidden: { opacity: 0, scale: 0.8 },
                visible: {
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.5, ease: "easeOut", delay: delay }
                }
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function StaggerContainer({ children, className, delay = 0, manualTrigger = false, ...props }: MotionProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView={manualTrigger ? undefined : "visible"}
            viewport={manualTrigger ? undefined : { once: true, margin: "-20px" }}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: 0.1,
                        delayChildren: delay
                    }
                }
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
}

export function TechBorderReveal({ children, className }: { children: ReactNode, className?: string }) {
    return (
        <div className={`relative group ${className}`}>
            {/* Corner borders - Techno feel */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-transparent group-hover:border-cyan-500 transition-colors duration-300" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-transparent group-hover:border-cyan-500 transition-colors duration-300" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-transparent group-hover:border-blue-500 transition-colors duration-300" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-transparent group-hover:border-blue-500 transition-colors duration-300" />

            {/* Glowing line overlay */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            </div>

            {children}
        </div>
    );
}

// Draw Line Animation (for timelines or separators)
export function DrawLine({ className }: { className?: string }) {
    return (
        <motion.div
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className={className}
        >
            <svg width="100%" height="2">
                <motion.line
                    x1="0" y1="0" x2="100%" y2="0"
                    stroke="currentColor"
                    strokeWidth="2"
                />
            </svg>
        </motion.div>
    );
}

/**
 * A wrapper that triggers "visible" state for all child motion components when
 * ANY part of this section enters the viewport (with small margin).
 * Useful for when you want a whole section to animate in together.
 */
export function InViewSection({ children, className, stagger = 0.1, ...props }: MotionProps & { stagger?: number }) {
    return (
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10% 0px -10% 0px", amount: 0.1 }}
            variants={{
                hidden: { opacity: 0 },
                visible: {
                    opacity: 1,
                    transition: {
                        staggerChildren: stagger,
                        when: "beforeChildren"
                    }
                }
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.section>
    );
}
