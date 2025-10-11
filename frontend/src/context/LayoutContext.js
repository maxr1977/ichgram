import { createContext, useContext } from 'react';

const LayoutContext = createContext({
  openPanel: () => {},
  closePanel: () => {},
  openCreateModal: () => {},
  closeCreateModal: () => {},
});

export const LayoutProvider = LayoutContext.Provider;

export const useLayout = () => useContext(LayoutContext);

export default LayoutContext;
