function useProdHMR() {
  return false;
}

let webpackHMR = false;
let viteHMR = false;

function useDevHMR() {
  return webpackHMR || viteHMR;
}

export default process.env.NODE_ENV === "production" ? useProdHMR : useDevHMR;

// Webpack `module.hot.accept` do not support any deps update trigger
// We have to hack handler to force mark as HRM
if (
  process.env.NODE_ENV !== "production"
  && ((typeof module !== "undefined" && module && (module as any).hot)
    || (import.meta && (import.meta as any).hot))
  && typeof window !== "undefined"
) {
  // Use `globalThis` first, and `window` for older browsers
  // const win = globalThis as any;
  const win
    = typeof globalThis !== "undefined"
      ? globalThis
      : ((typeof window !== "undefined" ? window : null) as any);

  if (win && typeof win.webpackHotUpdate === "function") {
    const originWebpackHotUpdate = win.webpackHotUpdate;

    win.webpackHotUpdate = (...args: any[]) => {
      webpackHMR = true;
      setTimeout(() => {
        webpackHMR = false;
      }, 0);
      return originWebpackHotUpdate(...args);
    };
  }
  else if ((import.meta as any).hot) {
    viteHMR = true;
  }
}
