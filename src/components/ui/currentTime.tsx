"use client";
import { useEffect, useState } from "react";

export default function CurrentTime() {
  const [now, setNow] = useState("");

  useEffect(() => {
    const date = new Date();
    setNow(date.toUTCString());
  }, []);

  return <span>{now}</span>;
}
