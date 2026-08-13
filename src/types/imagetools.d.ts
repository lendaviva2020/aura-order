/** Tipagem para os imports processados pelo vite-imagetools (`?as=picture`). */
declare module "*&as=picture" {
  const value: {
    sources: Record<string, string>;
    img: { src: string; w: number; h: number };
  };
  export default value;
}
