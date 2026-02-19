import React, { useRef, useEffect, useCallback } from 'react';

/**
 * Compute a point + outward normal along a rounded rectangle perimeter.
 * The path goes: top-right corner arc → right side → bottom-right arc → bottom → bottom-left arc → left → top-left arc → top
 * @param {number} t - Parameter 0..1 along the full perimeter
 * @param {number} x0 - Left of rect (in canvas space)
 * @param {number} y0 - Top of rect
 * @param {number} w - Width
 * @param {number} h - Height
 * @param {number} r - Corner radius (clamped to half the smaller dimension)
 * @returns {{ x: number, y: number, nx: number, ny: number }}
 */
function pointOnRoundedRect(t, x0, y0, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    // Segment lengths
    const straightH = w - 2 * r; // horizontal straight
    const straightV = h - 2 * r; // vertical straight
    const arcLen = (Math.PI / 2) * r; // quarter-circle arc length
    const totalPerimeter = 2 * straightH + 2 * straightV + 4 * arcLen;

    let d = ((t % 1) + 1) % 1; // normalize to [0,1)
    d *= totalPerimeter;

    // Segments in order: top, top-right arc, right, bottom-right arc, bottom, bottom-left arc, left, top-left arc
    const segments = [
        { type: 'line', len: straightH }, // top edge (left to right)
        { type: 'arc', len: arcLen, cx: x0 + w - r, cy: y0 + r, startAngle: -Math.PI / 2, dir: 1 }, // top-right
        { type: 'line', len: straightV }, // right edge (top to bottom)
        { type: 'arc', len: arcLen, cx: x0 + w - r, cy: y0 + h - r, startAngle: 0, dir: 1 }, // bottom-right
        { type: 'line', len: straightH }, // bottom edge (right to left)
        { type: 'arc', len: arcLen, cx: x0 + r, cy: y0 + h - r, startAngle: Math.PI / 2, dir: 1 }, // bottom-left
        { type: 'line', len: straightV }, // left edge (bottom to top)
        { type: 'arc', len: arcLen, cx: x0 + r, cy: y0 + r, startAngle: Math.PI, dir: 1 }, // top-left
    ];

    // Starting positions for each line segment
    const lineStarts = [
        { x: x0 + r, y: y0, dx: 1, dy: 0, nx: 0, ny: -1 },         // top: left→right, normal up
        null, // arc placeholder
        { x: x0 + w, y: y0 + r, dx: 0, dy: 1, nx: 1, ny: 0 },      // right: top→bottom, normal right
        null,
        { x: x0 + w - r, y: y0 + h, dx: -1, dy: 0, nx: 0, ny: 1 }, // bottom: right→left, normal down
        null,
        { x: x0, y: y0 + h - r, dx: 0, dy: -1, nx: -1, ny: 0 },    // left: bottom→top, normal left
        null,
    ];

    let accumulated = 0;
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (d <= accumulated + seg.len + 0.001) {
            const local = d - accumulated;
            if (seg.type === 'line') {
                const ls = lineStarts[i];
                const frac = seg.len > 0 ? local / seg.len : 0;
                return {
                    x: ls.x + ls.dx * frac * (seg.len),
                    y: ls.y + ls.dy * frac * (seg.len),
                    nx: ls.nx,
                    ny: ls.ny,
                };
            } else {
                // Arc
                const frac = seg.len > 0 ? local / seg.len : 0;
                const angle = seg.startAngle + frac * (Math.PI / 2) * seg.dir;
                return {
                    x: seg.cx + r * Math.cos(angle),
                    y: seg.cy + r * Math.sin(angle),
                    nx: Math.cos(angle),
                    ny: Math.sin(angle),
                };
            }
        }
        accumulated += seg.len;
    }

    // Fallback (shouldn't reach)
    return { x: x0 + r, y: y0, nx: 0, ny: -1 };
}

const SaveSparkleEffect = ({
    active = false,
    sparkColor = '#fff',
    sparkSize = 10,
    sparkRadius = 15,
    sparkCount = 8,
    duration = 400,
    easing = 'ease-out',
    extraScale = 1.0,
    offset = 0,
}) => {
    const canvasRef = useRef(null);
    const sparksRef = useRef([]);
    const startTimeRef = useRef(null);
    const requestRef = useRef(null);
    const prevActiveRef = useRef(active);
    const dimsRef = useRef({ w: 0, h: 0, dpr: 1 });

    // Resize observer — measure the button sibling directly for pixel-perfect alignment
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        // Find the button sibling (the actual element we're tracing)
        const button = parent.querySelector('button') || parent;

        let resizeTimeout;

        const resizeCanvas = () => {
            const rect = button.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;

            // CSS size of the canvas (includes offset bleed area)
            const cssW = Math.ceil(rect.width) + offset * 2;
            const cssH = Math.ceil(rect.height) + offset * 2;

            // Drawing-surface size (scaled for crisp rendering)
            const drawW = Math.round(cssW * dpr);
            const drawH = Math.round(cssH * dpr);

            canvas.width = drawW;
            canvas.height = drawH;
            canvas.style.width = cssW + 'px';
            canvas.style.height = cssH + 'px';

            dimsRef.current = { w: Math.ceil(rect.width), h: Math.ceil(rect.height), dpr };
        };

        const handleResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resizeCanvas, 100);
        };

        const ro = new ResizeObserver(handleResize);
        ro.observe(button);

        resizeCanvas();

        return () => {
            ro.disconnect();
            clearTimeout(resizeTimeout);
        };
    }, [offset]);

    const easeFunc = useCallback(
        t => {
            switch (easing) {
                case 'linear':
                    return t;
                case 'ease-in':
                    return t * t;
                case 'ease-in-out':
                    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
                default:
                    return t * (2 - t);
            }
        },
        [easing]
    );

    const draw = useCallback((timestamp) => {
        if (!startTimeRef.current) {
            startTimeRef.current = timestamp;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = dimsRef.current.dpr;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(dpr, dpr); // scale drawing to CSS-pixel space

        sparksRef.current = sparksRef.current.filter(spark => {
            const elapsed = timestamp - spark.startTime;
            if (elapsed >= duration) {
                return false;
            }

            const progress = elapsed / duration;
            const eased = easeFunc(progress);

            const distance = eased * sparkRadius * extraScale;
            const lineLength = sparkSize * (1 - eased * 0.8);
            const opacity = 1 - eased * eased;

            const x1 = spark.x + distance * spark.nx;
            const y1 = spark.y + distance * spark.ny;
            const x2 = spark.x + (distance + lineLength) * spark.nx;
            const y2 = spark.y + (distance + lineLength) * spark.ny;

            ctx.globalAlpha = opacity;
            ctx.strokeStyle = sparkColor;
            ctx.lineWidth = 1.5 * (1 - eased * 0.5);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            return true;
        });

        ctx.restore();

        if (sparksRef.current.length > 0) {
            requestRef.current = requestAnimationFrame(draw);
        } else {
            requestRef.current = null;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, [duration, easeFunc, sparkRadius, sparkSize, extraScale, sparkColor]);

    // Trigger effect when 'active' changes from false to true
    useEffect(() => {
        if (active && !prevActiveRef.current) {
            const canvas = canvasRef.current;
            if (canvas) {
                const parent = canvas.parentElement;
                if (!parent) return;

                // Measure the button LIVE at trigger time (don't use stale dimsRef —
                // the button may have just resized, e.g. "Save Changes" → "Saved")
                const button = parent.querySelector('button') || parent;
                const rect = button.getBoundingClientRect();
                const computedStyle = getComputedStyle(button);
                const borderRadius = parseFloat(computedStyle.borderRadius) || 0;

                const w = rect.width;
                const h = rect.height;
                const x0 = offset;
                const y0 = offset;
                const r = Math.min(borderRadius, w / 2, h / 2);

                // Also update canvas size immediately to match the current button
                const dpr = window.devicePixelRatio || 1;
                const cssW = Math.ceil(w) + offset * 2;
                const cssH = Math.ceil(h) + offset * 2;
                canvas.width = Math.round(cssW * dpr);
                canvas.height = Math.round(cssH * dpr);
                canvas.style.width = cssW + 'px';
                canvas.style.height = cssH + 'px';
                dimsRef.current = { w: Math.ceil(w), h: Math.ceil(h), dpr };

                const now = performance.now();

                const newSparks = Array.from({ length: sparkCount }, (_, i) => {
                    const t = i / sparkCount;
                    // Add slight randomness to distribution
                    const jitter = (Math.random() - 0.5) * (0.5 / sparkCount);
                    const { x, y, nx, ny } = pointOnRoundedRect(t + jitter, x0, y0, w, h, r);

                    // Add slight angular randomness to the outward normal
                    const angleOffset = (Math.random() - 0.5) * 0.4;
                    const baseAngle = Math.atan2(ny, nx);
                    const finalAngle = baseAngle + angleOffset;

                    return {
                        x,
                        y,
                        nx: Math.cos(finalAngle),
                        ny: Math.sin(finalAngle),
                        startTime: now + Math.random() * 60, // stagger slightly
                    };
                });

                sparksRef.current.push(...newSparks);

                if (!requestRef.current) {
                    startTimeRef.current = null;
                    requestRef.current = requestAnimationFrame(draw);
                }
            }
        }
        prevActiveRef.current = active;
    }, [active, sparkCount, draw, offset]);

    // Clean up animation on unmount
    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: 'block',
                userSelect: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 0
            }}
        />
    );
};

export default SaveSparkleEffect;
