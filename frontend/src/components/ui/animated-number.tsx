import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    className?: string;
    suffix?: string;
    prefix?: string;
}

export function AnimatedNumber({
    value,
    duration = 1000,
    className = '',
    suffix = '',
    prefix = ''
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const countingRef = useRef<number | null>(null);
    const startTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (value === 0) {
            setDisplayValue(0);
            return;
        }

        startTimeRef.current = Date.now();

        function animate() {
            const now = Date.now();
            const timePassed = now - (startTimeRef.current || now);
            const progress = Math.min(timePassed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(value * easeOutQuart);

            setDisplayValue(currentValue);

            if (progress < 1) {
                countingRef.current = requestAnimationFrame(animate);
            } else {
                setDisplayValue(value);
            }
        }

        countingRef.current = requestAnimationFrame(animate);

        return () => {
            if (countingRef.current) {
                cancelAnimationFrame(countingRef.current);
            }
        };
    }, [value, duration]);

    return (
        <span className={className}>
            {prefix}{displayValue.toLocaleString()}{suffix}
        </span>
    );
}
