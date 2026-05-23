import { createContext, useContext, useState, ReactNode } from "react";
import { PhoneDialer } from "../components/PhoneDialer";

interface DialerPrefill {
  phone: string;
  name?: string;
  clientId?: string;
}

interface PhoneDialerCtx {
  openDialer: (prefill?: DialerPrefill) => void;
}

const PhoneDialerContext = createContext<PhoneDialerCtx>({ openDialer: () => {} });

export function usePhoneDialer() {
  return useContext(PhoneDialerContext);
}

export function PhoneDialerProvider({ children }: { children: ReactNode }) {
  const [prefill, setPrefill] = useState<DialerPrefill | null>(null);

  return (
    <PhoneDialerContext.Provider value={{ openDialer: (p) => setPrefill(p ?? null) }}>
      {children}
      <PhoneDialer prefill={prefill} onClearPrefill={() => setPrefill(null)} />
    </PhoneDialerContext.Provider>
  );
}
