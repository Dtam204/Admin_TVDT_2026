"use client";

import { useLayoutEffect, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
    const pathname = usePathname();

    // Handle the "useLayoutEffect does nothing on the server" warning
    const useIsomorphicLayoutEffect =
        typeof window !== "undefined" ? useLayoutEffect : useEffect;

    useIsomorphicLayoutEffect(() => {
        // Disable browser's default scroll restoration to prevent flickering
        // and rely entirely on our manual scroll control
        const handleScroll = () => {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "instant",
            });
        };

        // Attempt to set scroll restoration to manual
        if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }

        handleScroll();

        // Also try to scroll on a slight delay for reliable execution in some edge cases
        // (though layout effect should catch the paint)
        // requestAnimationFrame(handleScroll); 

        return () => {
            // Optional: Reset if needed, but for this app we likely want manual control always
        };
    }, [pathname]);

    return null;
}
