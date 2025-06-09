import React from "react";

export default function CircleTitlesSvg({
  width = 1301,
  height = 1081,
  className = "",
  style = {},
}) {
  return (
    <div className={`island-cycle-container ${className}`} style={style}>
      <svg
        id="Capa_2"
        data-name="Capa 2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1301 1081"
        width={width}
        height={height}
        className="h-screen w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none sm:p-0"
      >
        <title>The Island Cycle - Brand Identity Framework</title>
        <defs>
          <style>
            {`
              .cls-1, .cls-2, .cls-3, .cls-4 {
                fill: #fff;
              }

              .cls-5 {
                stroke: #fff;
                stroke-miterlimit: 10;
              }

              .cls-5, .cls-6 {
                fill: none;
              }

              .cls-2 {
                font-family: Archivo-Regular, Archivo;
                font-size: 12.1px;
              }

              .cls-3 {
                font-size: 47.94px;
                letter-spacing: 5px;
              }

              .cls-3, .cls-4 {
                font-family: Archivo-Bold, Archivo;
                font-weight: 700;
              }

              .cls-4 {
                font-size: 12.89px;
              }

              /* Hover effects */
              .cycle-section {
                transition: all 0.3s ease;
              }
              
              .cycle-section:hover .cls-3 {
                fill: #60a5fa;
              }
              
              .cycle-section:hover .cls-4 {
                fill: #93c5fd;
              }
            `}
          </style>
        </defs>

        <g id="Capa_1-2" data-name="Capa 1">
          {/* Cloud Section */}
          <g className="cycle-section" data-section="cloud">
            <text className="cls-3" transform="translate(555.23 133.76)">
              <tspan x="0" y="0">
                CLOUD
              </tspan>
            </text>
            <text className="cls-4" transform="translate(578.21 90.91)">
              <tspan x="0" y="0">
                THE DIGITAL IDENTITY
              </tspan>
            </text>
            <text className="cls-2" transform="translate(567.14 151.19)">
              <tspan x="0" y="0">
                Online presence: Website + UX
              </tspan>
            </text>
          </g>

          {/* Rain Section */}
          <g className="cycle-section" data-section="rain">
            <text className="cls-3" transform="translate(173.34 430.44)">
              <tspan x="0" y="0">
                RAIN
              </tspan>
            </text>
            <text className="cls-4" transform="translate(182.5 380.12)">
              <tspan x="0" y="0">
                WHERE DIGITAL &amp;
              </tspan>
              <tspan x="5.13" y="11">
                PHYSICAL MEET
              </tspan>
            </text>
            <text className="cls-2" transform="translate(159.46 447.86)">
              <tspan x="0" y="0">
                The cohesion across channels
              </tspan>
            </text>
          </g>

          {/* Evaporation Section */}
          <g className="cycle-section" data-section="evaporation">
            <text className="cls-3" transform="translate(859.06 430.1)">
              <tspan x="0" y="0">
                EVAPORATION
              </tspan>
            </text>
            <text className="cls-4" transform="translate(982.36 387.25)">
              <tspan x="0" y="0">
                MOMENTUM &amp; GROWTH
              </tspan>
            </text>
            <text className="cls-2" transform="translate(989.73 447.52)">
              <tspan x="0" y="0">
                Brand evolution &amp; updates
              </tspan>
            </text>
          </g>

          {/* Ground Section */}
          <g className="cycle-section" data-section="ground">
            <text className="cls-3" transform="translate(264.25 903.9)">
              <tspan x="0" y="0">
                GROUND
              </tspan>
            </text>
            <text className="cls-4" transform="translate(320.88 861.05)">
              <tspan x="0" y="0">
                PHYSICAL IDENTITY
              </tspan>
            </text>
            <text className="cls-2" transform="translate(335.13 921.33)">
              <tspan x="0" y="0">
                Offline touchpoints
              </tspan>
            </text>
          </g>

          {/* Sea Section */}
          <g className="cycle-section" data-section="sea">
            <text className="cls-3" transform="translate(861.71 904.25)">
              <tspan x="0" y="0">
                SEA
              </tspan>
            </text>
            <text className="cls-4" transform="translate(869.43 853.7)">
              <tspan x="0" y="0">
                STRUCTURE &amp;
              </tspan>
              <tspan x="2.99" y="11">
                POSITIONING
              </tspan>
            </text>
            <text className="cls-2" transform="translate(826.68 921.68)">
              <tspan x="0" y="0">
                Who you are and where you stand
              </tspan>
            </text>
          </g>
        </g>

        <g id="Capa_4" data-name="Capa 4">
          <polyline
            className="cls-6"
            points="769.59 135.7 766.8 130.99 771.71 128.56"
          />
        </g>
      </svg>
    </div>
  );
}
