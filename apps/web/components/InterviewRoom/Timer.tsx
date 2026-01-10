"use client";

import { useEffect, useState } from "react";

interface TimerProps {
    startTime: number;
}

export default function Timer({ startTime }: TimerProps) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Date.now() - startTime);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    return (
        <div className="text-2xl font-mono font-bold text-gray-700 dark:text-gray-300">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
    );
}
