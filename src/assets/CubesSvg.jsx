import { motion } from "framer-motion";

export default function CubesSvg({ selectedNumber }) {
  // Datos de cada polígono con sus puntos
  const polygons = [
    {
      id: 1,
      name: "clouds",
      points:
        "204.45 0 162.06 0 159.91 36.09 159.91 60.59 206.6 60.59 206.6 36.09 204.45 0",
    },
    {
      id: 2,
      name: "rain",
      points:
        "96.01 62.95 23.69 50.42 0 75.74 3.85 101.23 77.08 115.54 97.3 88.64 96.01 62.95",
    },
    {
      id: 3,
      name: "ground",
      points:
        "139.14 168.3 94.63 146.31 27.62 196.4 32.16 223.62 77.08 249.61 140.99 194.72 139.14 168.3",
    },
    {
      id: 4,
      name: "sea",
      points:
        "271.87 146.31 227.37 168.3 225.51 194.72 289.43 249.61 334.35 223.62 338.89 196.4 271.87 146.31",
    },
    {
      id: 5,
      name: "evaporation",
      points:
        "342.82 50.42 270.49 62.95 269.21 88.64 289.43 115.54 362.65 101.23 366.51 75.74 342.82 50.42",
    },
  ];

  return (
    <svg
      id="Capa_2"
      data-name="Capa 2"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 366.51 249.61"
      className="w-100 h-40"
    >
      <g id="Capa_1-2" data-name="Capa 1">
        {polygons.map((polygon, index) => {
          const isSelected = polygon.id <= selectedNumber;

          return (
            <motion.polygon
              key={polygon.id}
              points={polygon.points}
              fill="currentColor"
              initial={{
                opacity: 0,
                scale: 0.3,
              }}
              animate={{
                opacity: isSelected ? 1 : 0.25,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.3,
              }}
              transition={{
                duration: 0.6,
                delay: index * 0.15, // Delay escalonado para que aparezcan uno tras otro
                ease: [0.25, 0.1, 0.25, 1],
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
