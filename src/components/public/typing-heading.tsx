'use client'

import { useState, useEffect } from 'react'

const WORDS = ['Your Language', 'English', 'हिन्दी']

export function TypingHeading() {
  const [wordIndex, setWordIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const current = WORDS[wordIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (!isDeleting && displayed === current) {
      // Pause at full word, then start deleting
      timeout = setTimeout(() => setIsDeleting(true), 2000)
    } else if (isDeleting && displayed === '') {
      // Finished deleting, move to next word
      setIsDeleting(false)
      setWordIndex((prev) => (prev + 1) % WORDS.length)
    } else {
      // Type or delete one character
      const nextChar = isDeleting
        ? current.substring(0, displayed.length - 1)
        : current.substring(0, displayed.length + 1)
      timeout = setTimeout(() => setDisplayed(nextChar), isDeleting ? 50 : 100)
    }

    return () => clearTimeout(timeout)
  }, [displayed, isDeleting, wordIndex])

  return (
    <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto">
      Learn Practical Skills in{' '}
      <span className="text-primary inline-block min-w-[1ch]">
        {displayed}
        <span className="animate-pulse">|</span>
      </span>
    </h1>
  )
}
