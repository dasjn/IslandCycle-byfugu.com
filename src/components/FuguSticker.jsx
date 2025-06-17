import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";

export default function FuguSticker(props) {
  const { nodes, materials } = useGLTF("/FuguSticker.glb");
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Pegatina.geometry}
        material={materials.Pegata_v01}
        scale={1.899}
      />
    </group>
  );
}

useGLTF.preload("/FuguSticker.glb");
