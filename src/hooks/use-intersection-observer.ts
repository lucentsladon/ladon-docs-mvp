"use client"

import { useEffect, useState, useRef, RefObject } from 'react';

interface IntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: IntersectionObserverOptions = {},
): [RefObject<HTMLDivElement | null>, IntersectionObserverEntry | null] {
  const { threshold = 0.1, root = null, rootMargin = '0%', freezeOnceVisible = false } = options;
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  const isFrozen = entry?.isIntersecting && freezeOnceVisible;

  const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
    setEntry(entry);
  };

  useEffect(() => {
    const node = targetRef.current; // DOM Ref
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || isFrozen || !node) return;

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver(updateEntry, observerParams);

    observer.observe(node);

    return () => observer.disconnect();

     
  }, [targetRef, threshold, root, rootMargin, isFrozen, freezeOnceVisible]);

  return [targetRef, entry];
} 