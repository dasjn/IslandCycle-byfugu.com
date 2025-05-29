export default function CircleSelector({ parallaxValues, isVisible }) {
  //   const [transform, setTransform] = useState("translate3d(0px, 0px, 0)");

  //   useEffect(() => {
  //     if (parallaxValues && parallaxValues.viewport) {
  //       // Aplicar la misma intensidad que las nubes (2%)
  //       const intensity = 0.05;
  //       const moveX =
  //         parallaxValues.x * intensity * parallaxValues.viewport.width;
  //       const moveY =
  //         parallaxValues.y * intensity * parallaxValues.viewport.height;
  //       setTransform(`translate3d(${moveX}px, ${-moveY}px, 0)`);
  //     }
  //   }, [parallaxValues]);

  if (!isVisible) return null;

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[5] pointer-events-none transition-none will-change-transform w-screen h-screen font-['Helvetica_Neue',Arial,sans-serif]">
      {/* Central circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] rounded-full border border-white/30 "></div>

      {/* CLOUD - Top */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 text-center text-white">
        <div className="text-[10px] font-light tracking-[3px] mb-2 opacity-70 uppercase">
          THE DIGITAL IDENTITY
        </div>
        <div className="text-[48px] font-light tracking-[12px] leading-none">
          CLOUD
        </div>
      </div>

      {/* Number 1 */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-6 h-6 border border-white/50 rounded-full flex items-center justify-center text-[11px] text-white/80 font-light">
        1
      </div>

      {/* RAIN - Left */}
      <div className="absolute top-[40%] left-[28%] -translate-y-1/2 text-left text-white">
        <div className="text-[9px] font-light tracking-[2px] mb-[2px] opacity-60 uppercase">
          WHERE DIGITAL &
        </div>
        <div className="text-[9px] font-light tracking-[2px] mb-[10px] opacity-60 uppercase">
          PHYSICAL MEET
        </div>
        <div className="text-[40px] font-light tracking-[8px] leading-none mb-[6px]">
          RAIN
        </div>
        <div className="text-[9px] opacity-50 font-light">
          The cohesion across channels
        </div>
      </div>

      {/* Number 2 */}
      <div className="absolute top-[48%] left-[30%] -translate-y-1/2 w-6 h-6 border border-white/50 rounded-full flex items-center justify-center text-[11px] text-white/80 font-light">
        2
      </div>

      {/* EVAPORATION - Right */}
      <div className="absolute top-[40%] right-[28%] -translate-y-1/2 text-right text-white">
        <div className="text-[9px] font-light tracking-[2px] mb-[10px] opacity-60 uppercase">
          MOMENTUM & GROWTH
        </div>
        <div className="text-[28px] font-light tracking-[4px] leading-none mb-[6px]">
          EVAPORATION
        </div>
        <div className="text-[9px] opacity-50 font-light">
          Brand evolution & updates
        </div>
      </div>

      {/* Number 5 */}
      <div className="absolute top-[48%] right-[30%] -translate-y-1/2 w-6 h-6 border border-white/50 rounded-full flex items-center justify-center text-[11px] text-white/80 font-light">
        5
      </div>

      {/* GROUND - Bottom Left */}
      <div className="absolute bottom-[15%] left-[38%] -translate-x-1/2 text-center text-white">
        <div className="text-[9px] font-light tracking-[2px] mb-[10px] opacity-60 uppercase">
          PHYSICAL IDENTITY
        </div>
        <div className="text-[40px] font-light tracking-[8px] leading-none mb-[6px]">
          GROUND
        </div>
        <div className="text-[9px] opacity-50 font-light">
          Offline touchpoints
        </div>
      </div>

      {/* Number 3 */}
      <div className="absolute bottom-[12%] left-[25%] -translate-x-1/2 w-6 h-6 border border-white/50 rounded-full flex items-center justify-center text-[11px] text-white/80 font-light">
        3
      </div>

      {/* SEA - Bottom Right */}
      <div className="absolute bottom-[15%] right-[38%] translate-x-1/2 text-center text-white">
        <div className="text-[9px] font-light tracking-[2px] mb-[2px] opacity-60 uppercase">
          STRUCTURE &
        </div>
        <div className="text-[9px] font-light tracking-[2px] mb-[10px] opacity-60 uppercase">
          POSITIONING
        </div>
        <div className="text-[40px] font-light tracking-[8px] leading-none mb-[6px]">
          SEA
        </div>
        <div className="text-[9px] opacity-50 font-light">
          Who you are and where you stand
        </div>
      </div>

      {/* Number 4 */}
      <div className="absolute bottom-[12%] right-[25%] translate-x-1/2 w-6 h-6 border border-white/50 rounded-full flex items-center justify-center text-[11px] text-white/80 font-light">
        4
      </div>
    </div>
  );
}
