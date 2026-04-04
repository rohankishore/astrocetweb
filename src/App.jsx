/* man its so hard not to act reckless */
/* why am i so peak? */


import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Events', href: '#events' },
  { label: 'Blogs', href: '#blogs' },
  { label: 'Team', href: '#team' },
  { label: 'Contact us', href: '#contact' },
]

const aboutMetrics = [
  {
    value: '2019',
    label: 'Founded as a student hobby club',
  },
  {
    value: 'CET',
    label: 'College of Engineering Trivandrum',
  },
  {
    value: 'Astronomy',
    label: 'Focused learning and sky exploration',
  },
  {
    value: 'Outreach',
    label: 'Activities for students and the public',
  },
]

const aboutPanels = [
  {
    id: 'vision',
    title: 'Vision',
    body:
      'AstroCET aims to lead astronomy education and outreach by inspiring students and the public to explore the cosmos through skill development, collaboration, and innovation.',
  },
  {
    id: 'mission',
    title: 'Mission',
    body:
      "The club's primary mission is to ignite passion for astronomy by providing a platform for learning, exploration, and innovation.",
  },
]

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

    material.roughness = 0.9
    material.metalness = 0.03
    material.emissive = new THREE.Color('#2b150f')
    material.emissiveIntensity = 0.28
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
    const xEnd = isMobile ? -0.78 : -2.72
    const yStart = isMobile ? -3.85 : -5.35
    const yEnd = isMobile ? -0.38 : -0.16

    const scale = THREE.MathUtils.lerp(startScale, endScale, t)
    const x = THREE.MathUtils.lerp(xStart, xEnd, t)
    const y = THREE.MathUtils.lerp(yStart, yEnd, t)

    groupRef.current.scale.setScalar(scale)
    groupRef.current.position.set(x, y, -0.25)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(0.2, 0.04, t)
    groupRef.current.rotation.z = THREE.MathUtils.lerp(-0.06, 0.02, t)
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
      <ambientLight intensity={0.58} />
      <hemisphereLight intensity={0.44} color="#bed7ff" groundColor="#101a2d" />
      <directionalLight position={[5.5, 4.5, 5.2]} intensity={1.16} color="#a6d3ff" />
      <directionalLight position={[-6, -2, -5]} intensity={0.5} color="#456ca3" />

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
  const [visibleSections, setVisibleSections] = useState({})
  const rafRef = useRef(0)

  const handleSubscribe = (event) => {
    event.preventDefault()
  }

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

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal-id]'))
    if (!nodes.length) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const id = entry.target.getAttribute('data-reveal-id')
          if (!id) return
          setVisibleSections((prev) => (prev[id] ? prev : { ...prev, [id]: true }))
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.35 },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const sceneProgress = clamp(scrollProgress * 1.45, 0, 1)
  const heroTransition = clamp(sceneProgress / 0.42, 0, 1)
  const aboutInFront = sceneProgress > 0.62
  const showNavItems = sceneProgress > 0.16
  const heroOpacity = clamp(1 - heroTransition, 0, 1)
  const heroShift = heroTransition * 108
  const heroBlur = heroTransition * 16
  const heroScale = 1 + heroTransition * 0.08

  return (
    <div className="app-shell">
      <div className="space-backdrop" aria-hidden="true">
        <Suspense fallback={null}>
          <SpaceScene progress={sceneProgress} />
        </Suspense>
      </div>

      <h1
        className="hero-behind-title"
        aria-hidden="true"
        style={{
          opacity: heroOpacity,
          filter: `blur(${heroBlur}px)`,
          transform: `translate3d(-50%, -50%, 0) scale(${heroScale})`,
        }}
      >
        ASTROCET
      </h1>

      <div className="star-dots" aria-hidden="true"></div>

      <header className={`top-nav ${sceneProgress > 0.08 ? 'top-nav--solid' : ''}`}>
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
            <button className="hero-cta">Explore</button>
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
          <article
            data-reveal-id="about-intro"
            className={`about-intro reveal ${visibleSections['about-intro'] ? 'is-visible' : ''}`}
          >
            <p className="about-kicker">astroCET</p>
            <h2>
              College of Engineering Trivandrum astronomy club.
            </h2>
            <p>
              AstroCET is the astronomy club of CET Trivandrum. Started in 2019
              as a hobby club, it has grown into an active student community for
              celestial observation, technical learning, and public outreach.
            </p>
          </article>

          <div className="about-metrics">
            {aboutMetrics.map((metric, index) => (
              <article
                key={metric.label}
                data-reveal-id={`metric-${index}`}
                className={`metric-item reveal ${visibleSections[`metric-${index}`] ? 'is-visible' : ''}`}
                style={{ '--delay': `${index * 90}ms` }}
              >
                <p className="metric-value">{metric.value}</p>
                <p className="metric-label">{metric.label}</p>
              </article>
            ))}
          </div>

          <div className="about-grid">
            <article
              data-reveal-id="about-core"
              className={`about-block about-block--lead reveal ${visibleSections['about-core'] ? 'is-visible' : ''}`}
              style={{ '--delay': '140ms' }}
            >
              <p className="about-kicker">Astro Story</p>
              <h3>A student-led club focused on astronomy.</h3>
              <p>
                From observation sessions to technical activities, AstroCET
                creates an inclusive space where students collaborate, build
                practical skills, and explore the universe together.
              </p>
              <div className="about-tags" aria-label="Club highlights">
                <span>Past Events</span>
                <span>Announcements</span>
                <span>Gallery</span>
                <span>Contact Us</span>
              </div>
            </article>

            <div className="about-column">
              {aboutPanels.map((panel, index) => (
                <article
                  key={panel.id}
                  data-reveal-id={`panel-${panel.id}`}
                  className={`about-block reveal ${visibleSections[`panel-${panel.id}`] ? 'is-visible' : ''}`}
                  style={{ '--delay': `${220 + index * 90}ms` }}
                >
                  <h3>{panel.title}</h3>
                  <p>{panel.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="club-grid">
            <article
              id="events"
              data-reveal-id="events"
              className={`club-card reveal ${visibleSections['events'] ? 'is-visible' : ''}`}
              style={{ '--delay': '260ms' }}
            >
              <p className="about-kicker">Events</p>
              <h3>Past Events & Announcements</h3>
              <p>
                AstroCET hosts night-sky observations, introductory astronomy
                sessions, and regular announcements for upcoming activities.
              </p>
            </article>

            <article
              id="blogs"
              data-reveal-id="blogs"
              className={`club-card reveal ${visibleSections['blogs'] ? 'is-visible' : ''}`}
              style={{ '--delay': '320ms' }}
            >
              <p className="about-kicker">Blogs</p>
              <h3>Knowledge from the club</h3>
              <p>
                Members publish astronomy notes and explainers to help beginners
                and enthusiasts stay connected with what we learn.
              </p>
            </article>

            <article
              id="team"
              data-reveal-id="team"
              className={`club-card reveal ${visibleSections['team'] ? 'is-visible' : ''}`}
              style={{ '--delay': '380ms' }}
            >
              <p className="about-kicker">Team</p>
              <h3>Built by CET students</h3>
              <p>
                The club is run by passionate students from CET Trivandrum who
                work together on astronomy outreach and technical activities.
              </p>
            </article>

            <article
              id="contact"
              data-reveal-id="contact"
              className={`club-card reveal ${visibleSections['contact'] ? 'is-visible' : ''}`}
              style={{ '--delay': '440ms' }}
            >
              <p className="about-kicker">Contact Us</p>
              <h3>Enter your email to subscribe</h3>
              <form className="contact-form" onSubmit={handleSubscribe}>
                <input type="email" placeholder="Enter your email" required />
                <button type="submit">Send</button>
              </form>
            </article>
          </div>

          <p className="site-credit reveal is-visible">Made by AstroCET. All rights reserved.</p>
        </div>
      </section>
    </div>
  )
}

useGLTF.preload('/models/mars.glb')

export default App
