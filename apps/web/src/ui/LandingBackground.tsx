// Static, no-kaplay backdrop for the unsigned-root landing. A single
// pre-rendered town overview (`/landing-bg.webp`) covers the viewport
// behind the welcome modal — no GL canvas, no realtime, no NPC sync.
//
// The image is rendered at native pixel-art crispness via
// `image-rendering: pixelated` so it doesn't blur when CSS scales it
// to fit.

export function LandingBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0"
      style={{
        backgroundColor: "#5b8a40",
        backgroundImage: "url(/landing-bg.webp)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        imageRendering: "pixelated",
      }}
    />
  );
}
