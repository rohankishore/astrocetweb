import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import Lenis from 'lenis'
import './App.css'

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Events', href: '#events' },
  { label: 'Blogs', href: '#blogs' },
  { label: 'Team', href: '#team' },
]

const clubHighlights = [
  {
    id: 'events',
    kicker: 'Events',
    title: 'Past Events & Announcements',
    body:
      'AstroCET hosts night-sky observations, introductory astronomy sessions, and regular announcements for upcoming activities.',
  },
  {
    id: 'blogs',
    kicker: 'Blogs',
    title: 'Knowledge From The Club',
    body:
      'Members publish astronomy notes and explainers to help beginners and enthusiasts stay connected with what we learn.',
  },
  {
    id: 'team',
    kicker: 'Team',
    title: 'Built By CET Students',
    body:
      'The club is run by passionate students from CET Trivandrum who work together on astronomy outreach and technical activities.',
  },
]

const marsPhases = {
  rightMoveStart: 0.20,
  rightMoveEnd: 0.35,
  leftMoveStart: 0.45,
  leftMoveEnd: 0.60,
  centerMoveStart: 0.82,
  centerMoveEnd: 0.98,
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function MarsModel({ progress }) {
  const groupRef = useRef(null)
  const smoothedProgress = useRef(0)
  const { viewport, gl } = useThree()
  const { scene } = useGLTF('/models/mars.glb')

  const meshAsset = useMemo(() => {
    let firstMesh = null
    scene.traverse((node) => {
      if (!firstMesh && node.isMesh) {
        firstMesh = node
      }
    })

    if (!firstMesh) {
      return null
    }

    const geometry = firstMesh.geometry.clone()
    geometry.computeBoundingBox()
    const center = geometry.boundingBox?.getCenter(new THREE.Vector3())
    if (center) {
      geometry.translate(-center.x, -center.y, -center.z)
    }

    geometry.computeBoundingSphere()
    const radius = geometry.boundingSphere?.radius || 1

    const sourceMaterial = Array.isArray(firstMesh.material)
      ? firstMesh.material[0]
      : firstMesh.material
    const material = sourceMaterial?.clone
      ? sourceMaterial.clone()
      : new THREE.MeshStandardMaterial({ color: '#a96245' })

    if (material.map) {
      material.map.anisotropy = gl.capabilities.getMaxAnisotropy()
      material.map.needsUpdate = true
    }

    material.roughness = 0.8
    material.metalness = 0.05
    material.emissive = new THREE.Color('#381b13')
    material.emissiveIntensity = 0.45
    material.needsUpdate = true

    return { geometry, material, radius }
  }, [scene, gl])

  useFrame((_, delta) => {
    if (!groupRef.current || !meshAsset) return

    smoothedProgress.current = THREE.MathUtils.damp(
      smoothedProgress.current,
      progress,
      5,
      delta,
    )

    const t = smoothedProgress.current
    const isMobile = viewport.width < 8

    const targetStartRadius = isMobile ? 4.15 : 5.8
    const targetEndRadius = isMobile ? 1.9 : 2.45
    const startScale = targetStartRadius / meshAsset.radius
    const endScale = targetEndRadius / meshAsset.radius
    const xStart = isMobile ? 0 : -0.05
    const yStart = isMobile ? -3.85 : -5.35

    const rightPhaseStart = marsPhases.rightMoveStart
    const rightPhaseEnd = marsPhases.rightMoveEnd
    const leftPhaseStart = marsPhases.leftMoveStart
    const leftPhaseEnd = marsPhases.leftMoveEnd
    const centerPhaseStart = marsPhases.centerMoveStart
    const centerPhaseEnd = marsPhases.centerMoveEnd

    const toHeroEnd = clamp(t / rightPhaseStart, 0, 1)
    const toRight = clamp((t - rightPhaseStart) / (rightPhaseEnd - rightPhaseStart), 0, 1)
    const toLeft = clamp((t - leftPhaseStart) / (leftPhaseEnd - leftPhaseStart), 0, 1)
    const toCenter = clamp((t - centerPhaseStart) / (centerPhaseEnd - centerPhaseStart), 0, 1)

    const xAtHeroEnd = isMobile ? 0.16 : 0.56
    const xRight = isMobile ? 0.95 : 2.15
    const xLeft = isMobile ? -0.8 : -1.95

    const yAtHeroEnd = isMobile ? -0.45 : -0.18
    const yRight = isMobile ? -0.34 : -0.1
    const yLeft = isMobile ? -0.38 : -0.16

    const scaleAtHeroEnd = THREE.MathUtils.lerp(startScale, endScale, 0.72)
    const scaleAtRight = endScale * 0.92

    let x = xStart
    let y = yStart
    let scale = startScale
    let rotationX = 0.2
    let rotationZ = -0.06

    if (t <= rightPhaseStart) {
      x = THREE.MathUtils.lerp(xStart, xAtHeroEnd, toHeroEnd)
      y = THREE.MathUtils.lerp(yStart, yAtHeroEnd, toHeroEnd)
      scale = THREE.MathUtils.lerp(startScale, scaleAtHeroEnd, toHeroEnd)
      rotationX = THREE.MathUtils.lerp(0.2, 0.06, toHeroEnd)
      rotationZ = THREE.MathUtils.lerp(-0.06, 0, toHeroEnd)
    } else if (t <= rightPhaseEnd) {
      x = THREE.MathUtils.lerp(xAtHeroEnd, xRight, toRight)
      y = THREE.MathUtils.lerp(yAtHeroEnd, yRight, toRight)
      scale = THREE.MathUtils.lerp(scaleAtHeroEnd, scaleAtRight, toRight)
      rotationX = THREE.MathUtils.lerp(0.06, 0.02, toRight)
      rotationZ = THREE.MathUtils.lerp(0, 0.08, toRight)
    } else if (t <= leftPhaseStart) {
      x = xRight
      y = yRight
      scale = scaleAtRight
      rotationX = 0.02
      rotationZ = 0.08
    } else if (t <= leftPhaseEnd) {
      x = THREE.MathUtils.lerp(xRight, xLeft, toLeft)
      y = THREE.MathUtils.lerp(yRight, yLeft, toLeft)
      scale = THREE.MathUtils.lerp(scaleAtRight, endScale, toLeft)
      rotationX = THREE.MathUtils.lerp(0.02, 0.08, toLeft)
      rotationZ = THREE.MathUtils.lerp(0.08, -0.04, toLeft)
    } else if (t <= centerPhaseStart) {
      x = xLeft
      y = yLeft
      scale = endScale
      rotationX = 0.08
      rotationZ = -0.04
    } else {
      x = THREE.MathUtils.lerp(xLeft, xStart, toCenter)
      y = THREE.MathUtils.lerp(yLeft, yStart - 0.55, toCenter) // Lowering Mars so top half covers text bottom
      scale = THREE.MathUtils.lerp(endScale, startScale * 1.05, toCenter) // zoomed in
      rotationX = THREE.MathUtils.lerp(0.08, 0.25, toCenter)
      rotationZ = THREE.MathUtils.lerp(-0.04, 0, toCenter)
    }

    groupRef.current.scale.setScalar(scale)
    groupRef.current.position.set(x, y, -0.25)
    groupRef.current.rotation.x = rotationX
    groupRef.current.rotation.z = rotationZ
    groupRef.current.rotation.y += delta * 0.12
  })

  return (
    <group ref={groupRef}>
      {meshAsset ? (
        <mesh
          geometry={meshAsset.geometry}
          material={meshAsset.material}
          frustumCulled={false}
        />
      ) : null}
    </group>
  )
}

function SpaceScene({ progress }) {
  return (
    <Canvas
      className="scene-canvas"
      camera={{ position: [0, 0.2, 7.8], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.setClearColor('#000000', 0)
      }}
    >
      <ambientLight intensity={0.9} />
      <hemisphereLight intensity={0.65} color="#bed7ff" groundColor="#101a2d" />
      <directionalLight position={[5.5, 4.5, 5.2]} intensity={1.6} color="#a6d3ff" />
      <directionalLight position={[-6, -2, -5]} intensity={0.8} color="#456ca3" />

      <Stars
        radius={180}
        depth={90}
        count={1900}
        factor={3.4}
        saturation={0}
        fade
        speed={0.25}
      />

      <MarsModel progress={progress} />
    </Canvas>
  )
}

function App() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 0.8,
    })

    let rafId
    function raf(time) {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    const getProgress = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      return maxScroll > 0 ? window.scrollY / maxScroll : 0
    }

    const syncProgress = () => {
      setScrollProgress(clamp(getProgress(), 0, 1))
      rafRef.current = 0
    }

    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = window.requestAnimationFrame(syncProgress)
    }

    syncProgress()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  const starDotsRef = useRef(null)

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!starDotsRef.current) return
      const x = (e.clientX / window.innerWidth - 0.5) * 36
      const y = (e.clientY / window.innerHeight - 0.5) * 36
      starDotsRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [])

  const sceneProgress = clamp(scrollProgress * 1.15, 0, 1)
  const heroTransition = clamp(sceneProgress / 0.42, 0, 1)
  const aboutInFront = sceneProgress > 0.62
  const heroOpacity = clamp(1 - heroTransition, 0, 1)
  const heroShift = heroTransition * 108
  const heroBlur = heroTransition * 16
  const heroScale = 1 + heroTransition * 0.08

  const centerMoveProgress = clamp(
    (sceneProgress - marsPhases.centerMoveStart) /
      (marsPhases.centerMoveEnd - marsPhases.centerMoveStart),
    0,
    1,
  )

  const showNavItems = sceneProgress > 0.16 && centerMoveProgress < 0.1

  const endTitleOpacity = clamp((centerMoveProgress - 0.2) / 0.5, 0, 1)
  const endTitleShift = (1 - centerMoveProgress) * 140 - 75 // Rises 75px higher than the hero text did to show 3/4 above Mars
  const endTitleScale = 1 + (1 - centerMoveProgress) * 0.1

  // Use max to mix the first hero state and final state for the background title
  const finalTitleOpacity = Math.max(heroOpacity, endTitleOpacity)
  const finalTitleShift = heroOpacity > 0 ? heroShift : endTitleShift
  const finalTitleBlur = heroOpacity > 0 ? heroBlur : 0
  const finalTitleScale = heroOpacity > 0 ? heroScale : endTitleScale

  const leftStoryFadeIn = clamp((sceneProgress - 0.22) / 0.1, 0, 1)
  const leftStoryFadeOut = clamp((sceneProgress - 0.4) / 0.1, 0, 1)
  const masterFadeOut = clamp(centerMoveProgress / 0.35, 0, 1) // Fades everything out as Mars enters center
  
  const leftStoryFade = clamp(leftStoryFadeIn * (1 - leftStoryFadeOut), 0, 1) * (1 - masterFadeOut)
  const rightStoryFade = clamp((sceneProgress - 0.48) / 0.15, 0, 1) * (1 - masterFadeOut)

  const leftStoryStyle = {
    opacity: leftStoryFade,
    transform: `translate3d(${(1 - leftStoryFade) * -34}px, ${(1 - leftStoryFade) * 18}px, 0)`,
    filter: `blur(${(1 - leftStoryFade) * 7}px)`,
  }

  const rightStoryStyle = {
    opacity: rightStoryFade,
    transform: `translate3d(${(1 - rightStoryFade) * 34}px, ${(1 - rightStoryFade) * 18}px, 0)`,
    filter: `blur(${(1 - rightStoryFade) * 7}px)`,
  }

  return (
    <div className="app-shell">
      <div className="space-backdrop" aria-hidden="true">
        <Suspense fallback={null}>
          <SpaceScene progress={sceneProgress} />
        </Suspense>
      </div>

      <div
        className="hero-behind-title-wrap"
        aria-hidden="true"
        style={{
          opacity: finalTitleOpacity,
          filter: `blur(${finalTitleBlur}px)`,
          transform: `translate3d(-50%, calc(-50% + ${finalTitleShift}px), 0) scale(${finalTitleScale})`,
        }}
      >
        <h1 className="hero-behind-title">ASTROCET</h1>
        <p className="site-credit-fixed" style={{ opacity: endTitleOpacity }}>
          Made by Rohan Kishore. Minimal AI slop used.
        </p>
      </div>

      <div className="star-dots-wrap" ref={starDotsRef} aria-hidden="true">
        <div className="star-dots"></div>
      </div>

      <header className="top-nav">
        <a href="#" className={`brand ${showNavItems ? '' : 'brand--hidden'}`}>
          astroCET
        </a>
        <nav
          className={`menu ${showNavItems ? '' : 'menu--hidden'}`}
          aria-label="Primary"
        >
          {navItems.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main>
        <section className="hero-stage" id="home">
          <div
            className="hero-copy"
            style={{
              opacity: heroOpacity,
              transform: `translate3d(0, ${heroShift}px, 0)`,
              filter: `blur(${heroBlur * 0.65}px)`,
            }}
          >
          </div>
          <div className="scroll-indicator" aria-hidden="true">
            <span></span>
          </div>
        </section>
      </main>

      <section
        className={`about-stage ${aboutInFront ? 'about-stage--front' : 'about-stage--behind'}`}
        id="about"
      >
        <div className="about-wrap">
          <div className="story-flow">
            <div className="story-row story-row--left">
              <article
                className="story-panel"
                style={leftStoryStyle}
              >
                <p className="about-kicker">astroCET</p>
                <h2>CET Trivandrum's astronomy club for curious minds.</h2>
                <p>
                  Founded in 2019 as a student hobby club, AstroCET has grown
                  into a vibrant space for celestial observation, technical
                  learning, and community-driven exploration of the cosmos.
                  We bring together students from various disciplines who share a 
                  profound fascination for the universe. Whether you are a seasoned 
                  stargazer or just looking up at the night sky for the first time, 
                  our community offers a welcoming environment to learn, grow, and 
                  discover the wonders of astronomy together.
                </p>
              </article>
            </div>

            <div className="story-row story-row--right">
              <article
                className="story-panel"
                style={rightStoryStyle}
              >
                <p className="about-kicker">Our Focus</p>
                <h2>Observation nights, learning sessions, and outreach.</h2>
                <p>
                  The club runs past events, announcements, and beginner-friendly
                  astronomy activities that help students and the public build
                  practical skills while staying connected to space science.
                </p>
              </article>
            </div>

            {clubHighlights.map((item, index) => {
              const startFade = 0.58 + index * 0.07;
              const itemFade = clamp((sceneProgress - startFade) / 0.1, 0, 1) * (1 - masterFadeOut);
              
              const itemStyle = {
                opacity: itemFade,
                transform: `translate3d(${(1 - itemFade) * 34}px, ${(1 - itemFade) * 18}px, 0)`,
                filter: `blur(${(1 - itemFade) * 7}px)`,
              };

              return (
                <div key={item.id} className="story-row story-row--right">
                  <article
                    id={item.id}
                    className="story-panel club-panel"
                    style={itemStyle}
                  >
                    <div className="club-item">
                      <p className="about-kicker">{item.kicker}</p>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

useGLTF.preload('/models/mars.glb')

export default App
