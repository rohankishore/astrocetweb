import { useEffect, useRef, useState } from 'react'
import scrollVideoUrl from './assets/Rover_through_Mars_202604030601_scroll.mp4?url'
import './App.css'

const scrubPortion = 0.72

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getScrollPhases(sectionElement) {
  if (!sectionElement) {
    return { overall: 0, scrub: 0, reveal: 0 }
  }

  const rect = sectionElement.getBoundingClientRect()
  const travelDistance = rect.height - window.innerHeight
  const overall =
    travelDistance <= 0
      ? rect.top < 0
        ? 1
        : 0
      : clamp(-rect.top / travelDistance, 0, 1)

  const scrub = clamp(overall / scrubPortion, 0, 1)
  const reveal =
    overall <= scrubPortion
      ? 0
      : clamp((overall - scrubPortion) / (1 - scrubPortion), 0, 1)

  return { overall, scrub, reveal }
}

function App() {
  const sequenceSectionRef = useRef(null)
  const videoRef = useRef(null)
  const durationRef = useRef(0)
  const targetTimeRef = useRef(0)
  const animationFrameRef = useRef(0)
  const [videoReady, setVideoReady] = useState(false)
  const [scrubProgress, setScrubProgress] = useState(0)

  useEffect(() => {
    function updateFromScrollPosition() {
      if (!sequenceSectionRef.current) {
        return
      }

      const { scrub } = getScrollPhases(sequenceSectionRef.current)
      setScrubProgress(scrub)

      if (durationRef.current > 0) {
        targetTimeRef.current = scrub * durationRef.current
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
    const video = videoRef.current
    if (!video) {
      return
    }

    function handleReady() {
      durationRef.current = video.duration || 0
      setVideoReady(durationRef.current > 0)

      if (sequenceSectionRef.current && durationRef.current > 0) {
        const { scrub } = getScrollPhases(sequenceSectionRef.current)
        setScrubProgress(scrub)
        targetTimeRef.current = scrub * durationRef.current
      }
    }

    video.pause()
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'

    video.addEventListener('loadedmetadata', handleReady)
    video.addEventListener('canplay', handleReady)

    return () => {
      video.removeEventListener('loadedmetadata', handleReady)
      video.removeEventListener('canplay', handleReady)
    }
  }, [])

  useEffect(() => {
    function syncVideoToScroll() {
      const video = videoRef.current
      if (video && durationRef.current > 0) {
        const safeDuration = Math.max(durationRef.current - 0.001, 0)
        const target = clamp(targetTimeRef.current, 0, safeDuration)
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

      animationFrameRef.current = window.requestAnimationFrame(syncVideoToScroll)
    }

    animationFrameRef.current = window.requestAnimationFrame(syncVideoToScroll)

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current)
    }
  }, [])

  const introTaglineReveal = clamp(1 - scrubProgress / 0.36, 0, 1)
  const astrocetReveal = clamp((scrubProgress - 0.22) / 0.36, 0, 1)

  return (
    <main className="app-shell">
      <section className="sequence-section" ref={sequenceSectionRef}>
        <div className="sequence-sticky">
          <video
            ref={videoRef}
            className="sequence-video"
            src={scrollVideoUrl}
            muted
            playsInline
            preload="auto"
            aria-label="Scroll synced rover sequence"
          />

          <div className="sequence-shade" aria-hidden="true" />

          <p
            className="club-intro-text"
            style={{
              opacity: introTaglineReveal,
              transform: `translate(-50%, calc(-50% + ${scrubProgress * 34}px))`,
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

          {!videoReady && <p className="sequence-loading">Loading sequence...</p>}
        </div>
      </section>
    </main>
  )
}

export default App
