'use client'
import CounterGSAP from '../component/CounterGSAP'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function StatsSection() {
  const sectionRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(
      sectionRef.current.children,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reset',
        },
      }
    )
  }, [])

  return (
    <section className="w-full py-24
      bg-black/80 text-white relative overflow-hidden">
      
      <div
        ref={sectionRef}
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-14 text-center"
      >
        <div>
          <CounterGSAP end={300} />
          <p className="mt-3 text-lg font-semibold">Total Institude</p>
        </div>

        <div>
          <CounterGSAP end={1235} />
          <p className="mt-3 text-lg font-semibold">Total Course</p>
        </div>

        <div>
          <CounterGSAP end={7153} />
          <p className="mt-3 text-lg font-semibold">Total Student</p>
        </div>

        <div>
          <CounterGSAP end={528} />
          <p className="mt-3 text-lg font-semibold"> Reviews</p>
        </div>
      </div>
    </section>
  )
}
