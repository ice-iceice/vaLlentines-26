'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useUI } from './UIProvider'
import { useMusic } from './MusicProvider'

function MenuBar() {
    const [timeString, setTimeString] = useState('')
    const [volume, setVolume] = useState(75) // Volume 0-100
    const [showVolumeSlider, setShowVolumeSlider] = useState(false)
    const router = useRouter()
    const { audioRef } = useMusic()
    const volumeSliderRef = useRef(null)

    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            const formatted = now.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
            })
            setTimeString(formatted)
        }

        updateTime()
        const intervalId = setInterval(updateTime, 30000) // update every 30s
        return () => clearInterval(intervalId)
    }, [])

    // Apply volume to audio element
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume / 100
        }
    }, [volume, audioRef])

    // Close volume slider when clicking outside
    useEffect(() => {
        if (!showVolumeSlider) return
        const handleClickOutside = (e) => {
            if (volumeSliderRef.current && !volumeSliderRef.current.contains(e.target)) {
                setShowVolumeSlider(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [showVolumeSlider])

    const handleLockClick = () => {
        router.push('/')
    }

    const handleVolumeClick = (e) => {
        e.stopPropagation()
        setShowVolumeSlider(prev => !prev)
    }

    const handleVolumeChange = (e) => {
        setVolume(parseInt(e.target.value))
    }

    return (
        <div className="menu-bar">
            <div className="menu-left">
                <span className="menu-apple"></span>
                <span>Finder</span>
                <span>File</span>
                <span>Edit</span>
                <span>View</span>
                <span>Go</span>
                <span>Window</span>
                <span>Help</span>
            </div>
            <div className="menu-right">
                <span className="menu-status" onClick={handleLockClick} style={{ cursor: 'pointer' }}>
                    Lock
                </span>
                <span className="menu-status">Wi‑Fi</span>
                <div 
                    className="menu-status volume-icon" 
                    onClick={handleVolumeClick}
                    style={{ cursor: 'pointer', position: 'relative' }}
                    ref={volumeSliderRef}
                >
                    <svg width="14" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 4L8 1V11L3 8V4Z" fill="currentColor" opacity="0.9"/>
                        <path d="M9 4.5C9.5 5 10.5 6 10.5 6C10.5 6 9.5 7 9 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.9"/>
                        <path d="M11 3C11.8 3.8 12.5 5 12.5 6C12.5 7 11.8 8.2 11 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.9"/>
                    </svg>
                    {showVolumeSlider && (
                        <div 
                            className="volume-slider-popup"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="volume-slider"
                            />
                            <span className="volume-percentage">{volume}%</span>
                        </div>
                    )}
                </div>
                <span className="menu-status battery-icon">
                    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="2" width="13" height="6" rx="1.2" fill="currentColor" opacity="0.9"/>
                        <rect x="14" y="3.5" width="1.5" height="3" rx="0.5" fill="currentColor" opacity="0.9"/>
                    </svg>
                </span>
                <span className="menu-time">{timeString}</span>
            </div>
        </div>
    )
}

function Dock({
    canAccessPlans,
    onPlanClick,
    onNotesClick,
    onLetterClick,
    onPhotosClick,
    onMusicClick,
    onCalendarClick,
}) {
    const items = [
        ...(canAccessPlans ? [{ label: 'Plan', src: '/thumbnails/plandock.png' }] : []),
        { label: 'Notes', src: '/thumbnails/notedock.png' },
        { label: 'Photos', src: '/thumbnails/photos.png' },
        { label: 'Letter', src: '/thumbnails/letter.png' },
        { label: 'Music', src: '/vinyl.png' },
        { label: 'Calendar', src: '/thumbnails/calendar.png' },
    ]
    return (
        <div className="dock">
            <div className="dock-inner">
                {items.map((item) => (
                    <button
                        key={item.label}
                        className="dock-item"
                        onClick={
                            item.label === 'Plan'
                                ? onPlanClick
                                : item.label === 'Notes'
                                    ? onNotesClick
                                : item.label === 'Letter'
                                    ? onLetterClick
                                    : item.label === 'Photos'
                                        ? onPhotosClick
                                        : item.label === 'Music'
                                            ? onMusicClick
                                            : item.label === 'Calendar'
                                                ? onCalendarClick
                                                : undefined
                        }
                    >
                        <div className="dock-icon">
                            <Image
                                src={item.src}
                                alt={item.label}
                                width={42}
                                height={42}
                                className="dock-icon-image"
                            />
                        </div>
                        <span className="dock-label">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

function MusicPlayerWidget() {
    const {
        audioRef,
        isPlaying,
        setIsPlaying,
        currentTrackIndex,
        setCurrentTrackIndex,
        tracks,
        wasPlayingRef,
        currentTrack,
    } = useMusic()

    const widgetRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)
    const [position, setPosition] = useState({ x: null, y: null })
    const dragOffsetRef = useRef({ x: 0, y: 0 })
    const widgetSizeRef = useRef({ width: 0, height: 0 })

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
            setIsPlaying(false)
        } else {
            audio.play()
            setIsPlaying(true)
        }
    }

    const handleNext = () => {
        wasPlayingRef.current = isPlaying // Remember if music was playing
        setCurrentTrackIndex((prev) => (prev + 1) % tracks.length)
    }

    const handlePrev = () => {
        wasPlayingRef.current = isPlaying // Remember if music was playing
        setCurrentTrackIndex((prev) => (prev === 0 ? tracks.length - 1 : prev - 1))
    }

    const handleMouseDown = (e) => {
        // Start dragging from anywhere on the widget except the control buttons
        if (e.target.closest('.music-play-button') || e.target.closest('.music-skip-button')) return

        const widget = widgetRef.current
        if (!widget) return

        const rect = widget.getBoundingClientRect()
        widgetSizeRef.current = { width: rect.width, height: rect.height }
        const startX = position.x ?? rect.left
        const startY = position.y ?? rect.top

        dragOffsetRef.current = {
            x: e.clientX - startX,
            y: e.clientY - startY,
        }
        setIsDragging(true)
        e.preventDefault()
    }

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e) => {
            const vw = window.innerWidth
            const vh = window.innerHeight
            const { width, height } = widgetSizeRef.current

            const marginRatio = 0.05 // 5% margin on each side to match desktop inner area
            const minX = vw * marginRatio
            const maxX = vw * (1 - marginRatio) - width
            const minY = vh * marginRatio
            const maxY = vh * (1 - marginRatio) - height

            let nextX = e.clientX - dragOffsetRef.current.x
            let nextY = e.clientY - dragOffsetRef.current.y

            // Clamp within margins
            nextX = Math.min(Math.max(nextX, minX), maxX)
            nextY = Math.min(Math.max(nextY, minY), maxY)

            setPosition({
                x: nextX,
                y: nextY,
            })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    return (
        <div
            className="music-widget"
            ref={widgetRef}
            onMouseDown={handleMouseDown}
            style={
                position.x != null && position.y != null
                    ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
                    : undefined
            }
        >
            <div className="music-widget-header">PLAY THIS LOVEY</div>
            <div className="music-widget-body">
                <div className="music-track-info">
                    <div className={`music-vinyl-container ${isPlaying ? 'playing' : ''}`}>
                        <Image
                            src={currentTrack?.vinyl || '/vinyl.png'}
                            alt="Vinyl Record"
                            width={100}
                            height={100}
                            className="music-vinyl"
                        />
                    </div>
                </div>
                <div className="music-controls-group">
                    <button
                        className="music-play-button"
                        onClick={togglePlay}
                    >
                        {isPlaying ? 'pause' : 'play'}
                    </button>
                    {tracks.length > 1 && (
                        <div className="music-skip-buttons">
                            <button
                                className="music-skip-button"
                                onClick={handlePrev}
                                aria-label="Previous track"
                            >
                                ‹
                            </button>
                            <button
                                className="music-skip-button"
                                onClick={handleNext}
                                aria-label="Next track"
                            >
                                ›
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function PlansWidget({ onClose }) {
    return (
        <div
            className="plans-overlay"
            onMouseDown={() => {
                onClose?.()
            }}
        >
            <div
                className="music-widget plans-widget"
                onMouseDown={(e) => {
                    // prevent "click outside" from firing when interacting with the window
                    e.stopPropagation()
                }}
            >
                <div className="music-widget-header">PLANS</div>
                <div className="plans-widget-body">
                    <Image
                        src="/images/plan.png"
                        alt="Plans"
                        width={600}
                        height={600}
                        className="plans-image"
                    />
                </div>
            </div>
        </div>
    )
}

function NotesWidget({ onClose }) {
    const { noteText, setNoteText } = useUI()
    const widgetRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)
    const [position, setPosition] = useState({ x: null, y: null })
    const dragOffsetRef = useRef({ x: 0, y: 0 })
    const widgetSizeRef = useRef({ width: 0, height: 0 })

    const handleMouseDown = (e) => {
        // Don't start dragging when interacting with the textarea
        if (e.target.closest('.notes-textarea')) return

        const widget = widgetRef.current
        if (!widget) return

        const rect = widget.getBoundingClientRect()
        widgetSizeRef.current = { width: rect.width, height: rect.height }
        const startX = position.x ?? rect.left
        const startY = position.y ?? rect.top

        dragOffsetRef.current = {
            x: e.clientX - startX,
            y: e.clientY - startY,
        }
        setIsDragging(true)
        e.preventDefault()
    }

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e) => {
            const vw = window.innerWidth
            const vh = window.innerHeight
            const { width, height } = widgetSizeRef.current

            const marginRatio = 0.05
            const minX = vw * marginRatio
            const maxX = vw * (1 - marginRatio) - width
            const minY = vh * marginRatio
            const maxY = vh * (1 - marginRatio) - height

            let nextX = e.clientX - dragOffsetRef.current.x
            let nextY = e.clientY - dragOffsetRef.current.y

            nextX = Math.min(Math.max(nextX, minX), maxX)
            nextY = Math.min(Math.max(nextY, minY), maxY)

            setPosition({
                x: nextX,
                y: nextY,
            })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    return (
        <div
            className="music-widget notes-widget"
            ref={widgetRef}
            onMouseDown={handleMouseDown}
            style={
                position.x != null && position.y != null
                    ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
                    : undefined
            }
        >
            <div className="notes-widget-header-row">
                <div className="music-widget-header notes-widget-header">STICKY NOTE</div>
                <button
                    type="button"
                    className="notes-close-button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onClose?.()
                    }}
                    aria-label="Close sticky note"
                >
                    ×
                </button>
            </div>
            <textarea
                className="notes-textarea"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write a sweet note here..."
            />
        </div>
    )
}

function CalendarWidget() {
    const widgetRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false)
    const [position, setPosition] = useState({ x: null, y: null })
    const dragOffsetRef = useRef({ x: 0, y: 0 })
    const widgetSizeRef = useRef({ width: 0, height: 0 })
    const [currentDate, setCurrentDate] = useState(() => new Date())
    const [showNote, setShowNote] = useState(false)
    const [noteTitle, setNoteTitle] = useState('February 14')
    const [noteType, setNoteType] = useState('valentines')

    const handleMouseDown = (e) => {
        // Only start dragging when grabbing the header
        if (!e.target.closest('.calendar-widget-header')) return

        const widget = widgetRef.current
        if (!widget) return

        const rect = widget.getBoundingClientRect()
        widgetSizeRef.current = { width: rect.width, height: rect.height }
        const startX = position.x ?? rect.left
        const startY = position.y ?? rect.top

        dragOffsetRef.current = {
            x: e.clientX - startX,
            y: e.clientY - startY,
        }
        setIsDragging(true)
        e.preventDefault()
    }

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e) => {
            const vw = window.innerWidth
            const vh = window.innerHeight
            const { width, height } = widgetSizeRef.current

            const marginRatio = 0.05
            const minX = vw * marginRatio
            const maxX = vw * (1 - marginRatio) - width
            const minY = vh * marginRatio
            const maxY = vh * (1 - marginRatio) - height

            let nextX = e.clientX - dragOffsetRef.current.x
            let nextY = e.clientY - dragOffsetRef.current.y

            nextX = Math.min(Math.max(nextX, minX), maxX)
            nextY = Math.min(Math.max(nextY, minY), maxY)

            setPosition({
                x: nextX,
                y: nextY,
            })
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    // When user has dragged, clamp position on resize so calendar never passes the margin (same as music player)
    useEffect(() => {
        if (position.x == null || position.y == null) return

        const clampToMargin = () => {
            const widget = widgetRef.current
            if (!widget) return
            const rect = widget.getBoundingClientRect()
            const vw = window.innerWidth
            const vh = window.innerHeight
            const marginRatio = 0.05
            const minX = vw * marginRatio
            const maxX = vw * (1 - marginRatio) - rect.width
            const minY = vh * marginRatio
            const maxY = vh * (1 - marginRatio) - rect.height

            setPosition((prev) => ({
                x: Math.min(Math.max(prev.x, minX), maxX),
                y: Math.min(Math.max(prev.y, minY), maxY),
            }))
        }

        clampToMargin()

        window.addEventListener('resize', clampToMargin)
        return () => window.removeEventListener('resize', clampToMargin)
    }, [position.x, position.y])

    const monthFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat('en-US', {
                month: 'long',
                year: 'numeric',
            }),
        []
    )

    const monthLabel = monthFormatter.format(currentDate)

    const goToPrevMonth = () => {
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }

    const goToNextMonth = () => {
        setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }

    const today = useMemo(() => new Date(), [])

    const { weeks } = useMemo(() => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const firstOfMonth = new Date(year, month, 1)
        const firstDay = firstOfMonth.getDay() // 0 (Sun) - 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate()

        const cells = []
        // Leading blanks
        for (let i = 0; i < firstDay; i++) {
            cells.push(null)
        }
        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            cells.push(day)
        }
        // Trailing blanks to fill the last week
        while (cells.length % 7 !== 0) {
            cells.push(null)
        }

        const weeksArr = []
        for (let i = 0; i < cells.length; i += 7) {
            weeksArr.push(cells.slice(i, i + 7))
        }

        return { weeks: weeksArr }
    }, [currentDate])

    const isValentinesDay = (day) => {
        if (!day) return false
        // Highlight February 14 (month index 1)
        return currentDate.getMonth() === 1 && day === 14
    }

    const isMarchThird2026 = (day) => {
        if (!day) return false
        return currentDate.getFullYear() === 2026 && currentDate.getMonth() === 2 && day === 3
    }

    const isSpecialHeartDay = (day) => isValentinesDay(day) || isMarchThird2026(day)

    const getNoteTitleForDay = (day) => {
        if (isValentinesDay(day)) return 'Note'
        if (isMarchThird2026(day)) return 'Note'
        return 'Special Day'
    }

    const handleWidgetClick = (e) => {
        if (!showNote) return
        // Close note when clicking anywhere inside the calendar widget,
        // except when clicking inside the note itself
        if (e.target.closest('.calendar-note')) return
        setShowNote(false)
    }

    useEffect(() => {
        if (!showNote) return

        const handleDocumentClick = (e) => {
            const widget = widgetRef.current
            if (!widget) return
            // If click is outside the calendar widget, close the note
            if (!widget.contains(e.target)) {
                setShowNote(false)
            }
        }

        document.addEventListener('mousedown', handleDocumentClick)

        return () => {
            document.removeEventListener('mousedown', handleDocumentClick)
        }
    }, [showNote])

    const isToday = (day) => {
        if (!day) return false
        return (
            day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear()
        )
    }

    return (
        <div
            className="music-widget calendar-widget"
            ref={widgetRef}
            onMouseDown={handleMouseDown}
            onClick={handleWidgetClick}
            style={
                position.x != null && position.y != null
                    ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
                    : undefined
            }
        >
            <div className="music-widget-header calendar-widget-header">CALENDAR</div>
            <div className="calendar-widget-body">
                <div className="calendar-header-row">
                    <button
                        type="button"
                        className="calendar-nav-button"
                        onClick={goToPrevMonth}
                    >
                        ‹
                    </button>
                    <div className="calendar-month-label">{monthLabel}</div>
                    <button
                        type="button"
                        className="calendar-nav-button"
                        onClick={goToNextMonth}
                    >
                        ›
                    </button>
                </div>
                <div className="calendar-grid">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
                        <div key={d} className="calendar-weekday">
                            {d}
                        </div>
                    ))}
                    {weeks.map((week, wi) =>
                        week.map((day, di) => (
                            <div
                                key={`${wi}-${di}`}
                                className={`calendar-day ${day ? 'has-day' : 'empty-day'} ${isToday(day) ? 'calendar-today' : ''
                                    } ${isSpecialHeartDay(day) ? 'calendar-special-day' : ''}`}
                                onClick={
                                    isSpecialHeartDay(day)
                                        ? (e) => {
                                            e.stopPropagation()
                                            const title = getNoteTitleForDay(day)
                                            setNoteTitle(title)
                                            setNoteType(
                                                isValentinesDay(day)
                                                    ? 'valentines'
                                                    : isMarchThird2026(day)
                                                        ? 'anniversary'
                                                        : 'special'
                                            )
                                            setShowNote((prev) => !prev)
                                        }
                                        : undefined
                                }
                            >
                                {isSpecialHeartDay(day) ? (
                                    <span className="calendar-heart-icon">❤</span>
                                ) : (
                                    day
                                )}
                            </div>
                        ))
                    )}
                </div>
                {showNote && (
                    <div
                        className="calendar-note"
                        onClick={() => setShowNote(false)}
                    >
                        <div className="calendar-note-header">
                            <span className="calendar-note-title">{noteTitle}</span>
                            <button
                                type="button"
                                className="calendar-note-close"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowNote(false)
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div className="calendar-note-body">
                            {/* Edit these texts to whatever messages you want */}
                            {noteType === 'valentines' && (
                                <p>
                                    to do,
                                    <br />- idate ang baby kong maganda, hopefully this day or whenever
                                    she's free
                                    <br />
                                    - either sa cubao expo since she misses the chili peanut noodles
                                    there or eastwood kasi she mentioned she wants to go walk there
                                    tapos kain yabu
                                </p>
                            )}
                            {noteType === 'anniversary' && (
                                <p>
                                    Anniversary day!
                                    <br />
                                    - i-date si llana my love so sweet sa tito boy's
                                    <br />
                                    - wag kalimutan yung ano
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function PersistentUI() {
    const pathname = usePathname()
    const router = useRouter()
    const isLockScreen = pathname === '/'
    const {
        showPlans,
        showNotes,
        showMusic,
        showCalendar,
        setShowPlans,
        setShowNotes,
        canAccessPlans,
        handleDockLetterClick,
        handleDockPhotosClick,
        handleDockMusicClick,
        handleDockCalendarClick,
        handleDockPlansClick,
        handleDockNotesClick,
    } = useUI()

    const handleLetterDockClick = () => {
        if (pathname === '/letter') {
            router.push('/desktop')
        } else {
            handleDockLetterClick()
        }
    }

    return (
        <>
            {!isLockScreen && <MenuBar />}
            {showPlans && <PlansWidget onClose={() => setShowPlans(false)} />}
            {showNotes && <NotesWidget onClose={() => setShowNotes(false)} />}
            {showMusic && <MusicPlayerWidget />}
            {showCalendar && <CalendarWidget />}
            {!isLockScreen && (
                <Dock
                    canAccessPlans={canAccessPlans}
                    onPlanClick={handleDockPlansClick}
                    onNotesClick={handleDockNotesClick}
                    onLetterClick={handleLetterDockClick}
                    onPhotosClick={handleDockPhotosClick}
                    onMusicClick={handleDockMusicClick}
                    onCalendarClick={handleDockCalendarClick}
                />
            )}
        </>
    )
}
