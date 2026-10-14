"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export function useToast() {
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(""), 3000);
    return () => window.clearTimeout(t);
  }, [message]);

  const toast = message ? (
    <div className="toast" role="status">
      <Icon name="check" size={18} />
      {message}
    </div>
  ) : null;

  return [toast, setMessage] as const;
}
