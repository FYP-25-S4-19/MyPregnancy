import { useCallback, useMemo, useState } from "react";

type GuestGateCopy = {
  title?: string;
  message?: string;
};

export default function useGuestGate(defaultCopy?: GuestGateCopy) {
  const [visible, setVisible] = useState(false);
  const [copy, setCopy] = useState<GuestGateCopy>({
    title: defaultCopy?.title,
    message: defaultCopy?.message,
  });

  const open = useCallback((nextCopy?: GuestGateCopy) => {
    if (nextCopy) setCopy((prev) => ({ ...prev, ...nextCopy }));
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  /**
   * Call this when a guest taps a restricted feature.
   * Optional: pass custom title/message for specific screens.
   */
  const gate = useCallback((nextCopy?: GuestGateCopy) => {
    open(nextCopy);
  }, [open]);

  const value = useMemo(() => {
    return { visible, copy, open, close, gate };
  }, [visible, copy, open, close, gate]);

  return value;
}