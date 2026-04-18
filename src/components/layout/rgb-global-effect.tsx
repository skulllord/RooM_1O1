'use client'

export function RgbGlobalEffect() {
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            var hue = 330;
            var lastTime = performance.now();
            var speed = 0.035;
            function animate(time) {
              var delta = Math.min(time - lastTime, 50);
              lastTime = time;
              hue = (hue + delta * speed) % 360;
              var val = Math.round(hue) + " 100% 55%";
              document.documentElement.style.setProperty('--primary', val);
              document.documentElement.style.setProperty('--ring', val);
              document.documentElement.style.setProperty('--accent', val);
              requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);
          })();
        `,
      }}
    />
  )
}
