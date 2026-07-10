import { createContext, useContext, useState } from 'react';

const SidebarExtrasContext = createContext(null);

export const SidebarExtrasProvider = ({ children }) => {
  const [extraNav, setExtraNav] = useState(null);
  return (
    <SidebarExtrasContext.Provider value={{ extraNav, setExtraNav }}>
      {children}
    </SidebarExtrasContext.Provider>
  );
};

export const useSidebarExtras = () => useContext(SidebarExtrasContext);
