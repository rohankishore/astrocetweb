import { useEffect, useRef, useState } from 'react'
import heroVideoUrl from './assets/ROVER_scroll.mp4?url'
import roverVideoUrl from './assets/Mars_rover_moving_202604030727_scroll.mp4?url'
import stardomeImageUrl from './image 1.png'
import './App.css'

const scrubPortion = 0.72

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getSectionProgress(sectionElement) {
  if (!sectionElement) {
    return 0
  }

  const rect = sectionElement.getBoundingClientRect()
  const travelDistance = rect.height - window.innerHeight

  if (travelDistance <= 0) {
    return rect.top < 0 ? 1 : 0
  }

  return clamp(-rect.top / travelDistance, 0, 1)
}

function getSectionScrubProgress(sectionElement) {
  if (!sectionElement) {
    return 0
  }

  const overall = getSectionProgress(sectionElement)
  return clamp(overall / scrubPortion, 0, 1)
}

function syncVideoFrame(video, duration, targetTime) {
  if (!video || duration <= 0) {
    return
  }

  const safeDuration = Math.max(duration - 0.001, 0)
  const target = clamp(targetTime, 0, safeDuration)
  const delta = target - video.currentTime

  if (Math.abs(delta) > 0.008) {
    const step = Math.abs(delta) < 0.045 ? delta : delta * 0.22
    const nextTime = clamp(video.currentTime + step, 0, safeDuration)

    try {
      video.currentTime = nextTime
    } catch {
      // Ignore seek exceptions while the browser is still buffering.
    }
  }
}

function App() {
  const sequenceSectionRef = useRef(null)
  const roverSectionRef = useRef(null)
  const stardomeSectionRef = useRef(null)

  const heroVideoRef = useRef(null)
  const roverVideoRef = useRef(null)
  const heroDurationRef = useRef(0)
  const roverDurationRef = useRef(0)
  const heroTargetTimeRef = useRef(0)
  const roverTargetTimeRef = useRef(0)
  const animationFrameRef = useRef(0)

  const [heroVideoReady, setHeroVideoReady] = useState(false)
  const [roverVideoReady, setRoverVideoReady] = useState(false)
  const [heroScrubProgress, setHeroScrubProgress] = useState(0)
  const [roverScrubProgress, setRoverScrubProgress] = useState(0)
  const [stardomeProgress, setStardomeProgress] = useState(0)

  useEffect(() => {
    function updateFromScrollPosition() {
      if (sequenceSectionRef.current) {
        const scrub = getSectionScrubProgress(sequenceSectionRef.current)
        setHeroScrubProgress(scrub)

        if (heroDurationRef.current > 0) {
          heroTargetTimeRef.current = scrub * heroDurationRef.current
        }
      }

      if (roverSectionRef.current) {
        const scrub = getSectionScrubProgress(roverSectionRef.current)
        setRoverScrubProgress(scrub)

        if (roverDurationRef.current > 0) {
          roverTargetTimeRef.current = scrub * roverDurationRef.current
        }
      }

      if (stardomeSectionRef.current) {
        setStardomeProgress(getSectionProgress(stardomeSectionRef.current))
      }
    }

    updateFromScrollPosition()
    window.addEventListener('scroll', updateFromScrollPosition, { passive: true })
    window.addEventListener('resize', updateFromScrollPosition)

    return () => {
      window.removeEventListener('scroll', updateFromScrollPosition)
      window.removeEventListener('resize', updateFromScrollPosition)
    }
  }, [])

  useEffect(() => {
    const heroVideo = heroVideoRef.current
    const roverVideo = roverVideoRef.current

    function prepareVideo(video) {
      video.pause()
      video.muted = true
      video.playsInline = true
      video.preload = 'auto'
    }

    function handleHeroReady() {
      heroDurationRef.current = heroVideo?.duration || 0
      setHeroVideoReady(heroDurationRef.current > 0)

      if (sequenceSectionRef.current && heroDurationRef.current > 0) {
        const scrub = getSectionScrubProgress(sequenceSectionRef.current)
        setHeroScrubProgress(scrub)
        heroTargetTimeRef.current = scrub * heroDurationRef.current
      }
    }

    function handleRoverReady() {
      roverDurationRef.current = roverVideo?.duration || 0
      setRoverVideoReady(roverDurationRef.current > 0)

      if (roverSectionRef.current && roverDurationRef.current > 0) {
        const scrub = getSectionScrubProgress(roverSectionRef.current)
        setRoverScrubProgress(scrub)
        roverTargetTimeRef.current = scrub * roverDurationRef.current
      }
    }

    if (heroVideo) {
      prepareVideo(heroVideo)
      heroVideo.addEventListener('loadedmetadata', handleHeroReady)
      heroVideo.addEventListener('canplay', handleHeroReady)
    }

    if (roverVideo) {
      prepareVideo(roverVideo)
      roverVideo.addEventListener('loadedmetadata', handleRoverReady)
      roverVideo.addEventListener('canplay', handleRoverReady)
    }

    return () => {
      if (heroVideo) {
        heroVideo.removeEventListener('loadedmetadata', handleHeroReady)
        heroVideo.removeEventListener('canplay', handleHeroReady)
      }

      if (roverVideo) {
        roverVideo.removeEventListener('loadedmetadata', handleRoverReady)
        roverVideo.removeEventListener('canplay', handleRoverReady)
      }
    }
  }, [])

  useEffect(() => {
    function syncVideosToScroll() {
      syncVideoFrame(heroVideoRef.current, heroDurationRef.current, heroTargetTimeRef.current)
      syncVideoFrame(roverVideoRef.current, roverDurationRef.current, roverTargetTimeRef.current)

      animationFrameRef.current = window.requestAnimationFrame(syncVideosToScroll)
    }

    animationFrameRef.current = window.requestAnimationFrame(syncVideosToScroll)

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const introTaglineReveal = clamp(1 - heroScrubProgress / 0.36, 0, 1)
  const astrocetReveal = clamp((heroScrubProgress - 0.22) / 0.36, 0, 1)
  const roverTextReveal = clamp((roverScrubProgress - 0.28) / 0.46, 0, 1)

  const projectileProgress = clamp(stardomeProgress / 0.56, 0, 1)
  const imageReveal = clamp((stardomeProgress - 0.54) / 0.36, 0, 1)
  const parabolaFade = clamp(1 - imageReveal * 1.25, 0, 1)
  const stardomeTitleReveal = clamp((stardomeProgress - 0.62) / 0.28, 0, 1)
  const stardomeImageParallax = (0.5 - stardomeProgress) * 120

  const projectileX = 8 + projectileProgress * 84
  const projectileY = 82 - 66 * 4 * projectileProgress * (1 - projectileProgress)

  return (
    <main className="app-shell">
      <section className="sequence-section" ref={sequenceSectionRef}>
        <div className="sequence-sticky">
          <video
            ref={heroVideoRef}
            className="sequence-video"
            src={heroVideoUrl}
            muted
            playsInline
            preload="auto"
            aria-label="Scroll synced club hero sequence"
          />

          <div className="sequence-shade" aria-hidden="true" />

          <p
            className="club-intro-text"
            style={{
              opacity: introTaglineReveal,
              transform: `translate(-50%, calc(-50% + ${heroScrubProgress * 34}px))`,
            }}
          >
            CET'S OWN ASTRONOMY CLUB
          </p>

          <h1
            className="astrocet-title-text"
            style={{
              opacity: astrocetReveal,
              transform: `translate(-50%, calc(-50% + ${(1 - astrocetReveal) * 24}px)) scale(${0.9 + astrocetReveal * 0.1})`,
            }}
          >
            ASTROCET
          </h1>

          {!heroVideoReady && <p className="sequence-loading">Loading sequence...</p>}
        </div>
      </section>

      <section className="rover-section" ref={roverSectionRef}>
        <div className="rover-sticky">
          <video
            ref={roverVideoRef}
            className="rover-video"
            src={roverVideoUrl}
            muted
            playsInline
            preload="auto"
            aria-label="Scroll synced rover movement sequence"
          />

          <div className="sequence-shade" aria-hidden="true" />

          <h2
            className="rover-title-text"
            style={{
              opacity: roverTextReveal,
              transform: `translate(-50%, calc(-50% + ${(1 - roverTextReveal) * 30}px)) scale(${0.9 + roverTextReveal * 0.1})`,
            }}
          >
            ROVER
          </h2>

          {!roverVideoReady && <p className="sequence-loading rover-loading">Loading sequence...</p>}
        </div>
      </section>

      <section className="stardome-section" ref={stardomeSectionRef}>
        <div className="stardome-sticky">
          <div className="stardome-parabola-shell" style={{ opacity: parabolaFade }}>
            <svg className="stardome-parabola" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <path
                pathLength="1"
                d="M 8 82 Q 50 12 92 82"
                style={{ strokeDasharray: 1, strokeDashoffset: 1 - projectileProgress }}
              />
            </svg>

            <div
              className="stardome-projectile"
              style={{
                left: `${projectileX}%`,
                top: `${projectileY}%`,
                opacity: clamp(0.42 + projectileProgress, 0, 1),
              }}
              aria-hidden="true"
            />
          </div>

          <div
            className="stardome-image-shell"
            style={{
              opacity: imageReveal,
              transform: `translateX(-50%) translateY(${stardomeImageParallax}px) scale(${0.82 + imageReveal * 0.18})`,
            }}
            aria-hidden="true"
          >
            <img src={stardomeImageUrl} alt="" />
            <div className="stardome-image-mask" />
          </div>

          <h2
            className="stardome-title"
            style={{
              opacity: stardomeTitleReveal,
              transform: `translate(-50%, calc(-50% + ${(1 - stardomeTitleReveal) * 24}px))`,
            }}
          >
            STARDOME
          </h2>
        </div>
      </section>
    </main>
  )
}

export default App
