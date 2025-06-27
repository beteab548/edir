// components/ModalPortal.tsx
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const elRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    elRef.current = document.body;
    setMounted(true);
  }, []);

  return mounted && elRef.current
    ? createPortal(children, elRef.current)
    : null;
}
