import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

const WallMesh = ({ wall }) => {
    const { position, rotation, length } = useMemo(() => {
        const scale = 0.001;
        const startX = wall.start.x * scale;
        const startZ = wall.start.y * scale;
        const endX = wall.end.x * scale;
        const endZ = wall.end.y * scale;
        const height = wall.height * scale;
        const thickness = wall.thickness * scale;

        const dx = endX - startX;
        const dz = endZ - startZ;
        const length = Math.sqrt(dx * dx + dz * dz);
        const centerX = (startX + endX) / 2;
        const centerZ = (startZ + endZ) / 2;
        const centerY = height / 2;
        const angle = Math.atan2(dz, dx);

        return {
            position: new THREE.Vector3(centerX, centerY, centerZ),
            rotation: new THREE.Euler(0, -angle, 0),
            length,
            height,
            thickness
        };
    }, [wall]);

    return (
        <mesh position={position} rotation={rotation} castShadow receiveShadow>
            <boxGeometry args={[length, wall.height * 0.001, wall.thickness * 0.001]} />
            <meshStandardMaterial color="#f5f5f5" roughness={0.8} />
        </mesh>
    );
};

export default function FloorPlan3DViewer({ data }) {
    if (!data?.walls) return null;

    return (
        <div className="w-full h-full absolute inset-0">
            <Canvas
                camera={{ position: [5, 5, 10], fov: 50 }}
                shadows={{ type: THREE.PCFShadowMap }}
                gl={{
                    antialias: true,
                    // THREE.Clock은 감쇠 예정이므로 가능한 경우 THREE.Timer를 사용하도록 유도하거나 설정을 강화합니다.
                    // (Fiber 내부에 따라 동작이 다를 수 있음)
                }}
            >
                <color attach="background" args={["#0f172a"]} />
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 20, 10]}
                    intensity={1}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <OrbitControls makeDefault />
                <Grid renderOrder={-1} position={[0, 0, 0]} infiniteGrid fadeDistance={30} fadeStrength={5} />
                <group position={[-2.5, 0, -2]}>
                    {data.walls.map((wall, i) => (
                        <WallMesh key={wall.id || `wall-${i}`} wall={wall} />
                    ))}
                </group>
            </Canvas>
        </div>
    );
}
