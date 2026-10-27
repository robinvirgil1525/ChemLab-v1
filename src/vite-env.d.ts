/// <reference types="vite/client" />

declare module '3dmol' {
  const $3Dmol: any;
  export default $3Dmol;
  export const createViewer: (element: HTMLElement | string, config?: any) => any;
  export const rasmolElementColors: any;
  export const SurfaceType: {
    VDW: number;
    MS: number;
    SAS: number;
    SES: number;
  };
}

declare module 'smiles-drawer' {
  const SmilesDrawer: any;
  export default SmilesDrawer;
}
