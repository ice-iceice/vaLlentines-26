'use client'

import { createContext, useContext, useState, useRef, useEffect } from 'react'

const MusicContext = createContext(null)

export function useMusic() {
    const context = useContext(MusicContext)
    if (!context) {
        throw new Error('useMusic must be used within MusicProvider')
    }
    return context
}

export function MusicProvider({ children }) {
    const audioRef = useRef(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
    const wasPlayingRef = useRef(false)

    // Your music playlist - add your songs here
    // Place your music files in: public/music/
    // For each track, you can set:
    // - src: the audio file
    // - vinyl: the image to show for that song (put images in public/, e.g. /vinyls/song1.png)
    const tracks = [
        {
            src: '/music/NIKI - Tsunami.mp3',
            vinyl: '/vinyl.png',
        },
        
        {
            src: '/music/Everyone Adores You (at least I do).mp3',
            vinyl: '/eayaidvinyl.png',
        },
        {
            src: '/music/Bawat Piyesa.mp3',
            vinyl: '/bpvinyl.png',
        },
        {
            src: '/music/You Are In Love.mp3',
            vinyl: '/1989vinyl.webp',
        },
        {
            src: '/music/My Love Mine All Mine.mp3',
            vinyl: '/mitskivinyl.png',
        },
        {
            src: '/music/ang balikat at baywang.mp3',
            vinyl: '/balikatvinyl.png',
        },
        // Example for more songs:
        // {
        //   src: '/music/Another Song.mp3',
        //   vinyl: '/vinyls/another-song.png',
        // },
        // {
        //   src: '/music/Third Song.mp3',
        //   vinyl: '/vinyls/third-song.png',
        // },
    ]

    const currentTrack = tracks[currentTrackIndex] || tracks[0]
    const currentSrc = currentTrack?.src || ''

    // Handle when audio ends - auto-advance to next track
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleEnded = () => {
            if (tracks.length > 1) {
                wasPlayingRef.current = true // Track was playing, continue to next
                const nextIndex = (currentTrackIndex + 1) % tracks.length
                setCurrentTrackIndex(nextIndex)
            } else {
                setIsPlaying(false)
            }
        }

        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('ended', handleEnded)
        }
    }, [currentTrackIndex, tracks.length])

    // Update audio src when track changes - auto-play if it was playing before
    useEffect(() => {
        const audio = audioRef.current
        if (audio) {
            audio.load()
            // Auto-play if music was playing before track change
            if (wasPlayingRef.current) {
                audio.play()
                    .then(() => {
                        setIsPlaying(true)
                        wasPlayingRef.current = false // Reset after handling
                    })
                    .catch((error) => {
                        console.error('Error playing audio:', error)
                        setIsPlaying(false)
                        wasPlayingRef.current = false
                    })
            } else {
                setIsPlaying(false)
            }
        }
    }, [currentSrc])

    const value = {
        audioRef,
        isPlaying,
        setIsPlaying,
        currentTrackIndex,
        setCurrentTrackIndex,
        tracks,
        wasPlayingRef,
        currentTrack,
    }

    return (
        <MusicContext.Provider value={value}>
            {children}
            {/* Audio element - always mounted so music continues across pages */}
            <audio key={currentSrc} ref={audioRef} src={currentSrc} style={{ display: 'none' }} />
        </MusicContext.Provider>
    )
}
