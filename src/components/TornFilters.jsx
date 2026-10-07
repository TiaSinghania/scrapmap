// Hidden <svg> that holds the SVG filters used for torn-paper edges.
// Render it ONCE near the top of the app (see App.jsx). CSS applies the filters
// to background layers via `filter: url(#torn-edge)`, so the displacement only
// wobbles the paper shape and never the text sitting on top of it.
export default function TornFilters() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0 }}
    >
      <defs>
        {/* Big pieces of paper (the sidebar). Higher scale = rougher tear. */}
        <filter id="torn-edge" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        {/* Small pieces (photo frames, buttons). Finer noise, gentler tear. */}
        <filter id="torn-edge-small" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" seed="8" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
