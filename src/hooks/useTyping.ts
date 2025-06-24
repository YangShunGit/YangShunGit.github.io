import { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface TypingOption {
    /**
     * @default 1
     */
    step?: number;
    /**
     * @default 50
     */
    interval?: number;
    /**
     * @default null
     */
    suffix?: React.ReactNode;
}


export interface TypingProps {
    enabled: boolean
    content: unknown
    interval?: number
    step?: number 
    onTypingComplete?: VoidFunction
}

export interface TypingResult {
    typingContent: unknown
    isTyping: boolean
    typingRef: {
        pause: VoidFunction
        start: VoidFunction
        restart: VoidFunction
    }
}
// 自定义打字hook
export const useTyping = ({enabled, content, interval, step, onTypingComplete}: TypingProps): TypingResult => {
    const [typingIndex, setTypingIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false)
    const oldContentRef = useRef('');
    const indexRef = useRef(0);
    const timerRef = useRef<NodeJS.Timeout>(null);

    const reset = () => {
        indexRef.current = 0;
        setTypingIndex(indexRef.current)
    }

    const start = () => {
        setIsTyping(true);
        indexRef.current = indexRef.current + (step || 2)
        setTypingIndex(indexRef.current)
    }

    const stop = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
        }
    }
    
    useEffect(() => {
        if (enabled && typeof content === 'string') {
            oldContentRef.current = content;
        }
    }, [content, enabled])

    useLayoutEffect(() => {
        if (typeof content === 'string' && content.length > 0) {
            if (!content.startsWith(oldContentRef.current)) {
                reset()
            } else {
                if (typingIndex < content.length) {
                    timerRef.current = setTimeout(() => {
                        start()
                    }, interval || 100)
                } else {
                    setIsTyping(false);
                    if (typeof onTypingComplete === 'function') {
                        onTypingComplete()
                    }
                }
            }
        }
        return () => {
            stop()
        }
    }, [typingIndex, content, interval, onTypingComplete])

    return {
        typingContent: enabled ? (content as string).slice(0, typingIndex) : content, 
        isTyping, 
        typingRef: {
            pause: () => {
                setIsTyping(false);
                stop()
            },
            start,
            restart: () => {
                reset()
            }
        } 
    };
}