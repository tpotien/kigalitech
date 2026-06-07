import { createContext, useContext, useState } from 'react';

const WhatsAppContext = createContext({ whatsappCtx: null, setWhatsappCtx: () => {} });

export function WhatsAppProvider({ children }) {
  const [whatsappCtx, setWhatsappCtx] = useState(null);
  return (
    <WhatsAppContext.Provider value={{ whatsappCtx, setWhatsappCtx }}>
      {children}
    </WhatsAppContext.Provider>
  );
}

export const useWhatsAppCtx = () => useContext(WhatsAppContext);
