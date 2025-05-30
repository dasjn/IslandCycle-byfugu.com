import { useContext } from "react";
import { MagneticCursorContext } from "../context/MagneticCursorContext";

export const useMagneticCursor = () => {
  const context = useContext(MagneticCursorContext);
  if (!context) {
    throw new Error(
      "useMagneticCursor must be used within a MagneticCursorProvider"
    );
  }
  return context;
};
