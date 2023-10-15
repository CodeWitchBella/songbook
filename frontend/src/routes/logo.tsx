// @ts-nocheck
import {
  ContactShadows,
  Environment,
  PresentationControls,
  useGLTF,
} from '@react-three/drei'
import type { GroupProps } from '@react-three/fiber'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'

export default function LogoRoute() {
  return (
    <div className="h-full w-full">
      <Canvas
        className="touch-none"
        shadows
        camera={{ position: [0, 1, 4], fov: 50 }}
      >
        <ambientLight intensity={0.5} />
        <spotLight
          penumbra={1}
          angle={0.15}
          castShadow
          position={[3, 10, 4]}
          intensity={0.7}
          shadow-mapSize={[1024, 1024]}
        />
        <PresentationControls
          global
          config={{ mass: 2, tension: 500 }}
          snap={{ mass: 4, tension: 1500 }}
          rotation={[0, 0.3, 0]}
          polar={[-Math.PI / 3, Math.PI / 3]}
          azimuth={[-Math.PI / 1.4, Math.PI / 2]}
        >
          <Watch
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.25, 0]}
            scale={0.003}
          />
        </PresentationControls>
        <ContactShadows
          rotation-x={Math.PI / 2}
          position={[0, -1.4, 0]}
          opacity={0.75}
          width={10}
          height={10}
          blur={2.6}
          far={2}
        />
        <Environment preset="park" />
      </Canvas>
    </div>
  )
}

function Watch(props: GroupProps) {
  const ref = useRef()
  const { nodes, materials } = useGLTF('/static/logo.glb')
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    ref.current.rotation.x = -Math.PI / 1.75 + Math.cos(t / 4) / 8
    ref.current.rotation.y = Math.sin(t / 4) / 8
    ref.current.rotation.z = (1 + Math.sin(t / 1.5)) / 20
    ref.current.position.y = (1 + Math.sin(t / 1.5)) / 10
  })

  const zmat = (
    <meshPhysicalMaterial
      transmission={0}
      envMapIntensity={0}
      emissive="#333"
      roughness={1}
      color="white"
    />
  )
  return (
    <group ref={ref} {...props} dispose={null}>
      <group scale={100} rotation={[0, Math.PI + 0.05, Math.PI]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.z.geometry}
          material={materials['SVGMat.007']}
          position={[-0.04, 0.55, -0.31]}
          scale={[64.54, 10, 64.54]}
        >
          {zmat}
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.bar.geometry}
          material={materials['SVGMat.008']}
          position={[0.01, 0.55, -0.55]}
          scale={[64.54, 7, 64.54]}
        >
          {zmat}
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.pick.geometry}
          position={[-0.28, 0.45, -1.33]}
          scale={[64.54, 10, 64.54]}
        >
          <meshPhysicalMaterial
            transmission={0.3}
            roughness={0}
            thickness={0.05}
            reflectivity={0.5}
            envMapIntensity={0.3}
            color="#333"
            clearcoat={0.5}
            clearcoatRoughness={1}
          />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes.chip.geometry}
          position={[0.01, 0.12, -0.39]}
          scale={[64.54, 64.54, 64.54]}
        >
          <meshPhysicalMaterial
            transmission={0}
            envMapIntensity={0}
            roughness={0.9}
            color="#9917da"
          />
        </mesh>
      </group>
    </group>
  )
}
