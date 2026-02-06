'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const UIContext = createContext(null)

export function useUI() {
    const context = useContext(UIContext)
    if (!context) {
        throw new Error('useUI must be used within UIProvider')
    }
    return context
}

export function UIProvider({ children }) {
    const [showLetters, setShowLetters] = useState(false)
    const [showPhotos, setShowPhotos] = useState(false)
    const [showMusic, setShowMusic] = useState(false)
    const [showCalendar, setShowCalendar] = useState(false)
    const [showPlans, setShowPlans] = useState(false)
    const [showNotes, setShowNotes] = useState(false)
    const [canAccessPlans, setCanAccessPlans] = useState(false)
    const [noteText, setNoteText] = useState('')
    const [noteLoaded, setNoteLoaded] = useState(false)

    // Load saved sticky note on first mount (client-side)
    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            const saved = window.localStorage.getItem('sticky-note-text')
            if (saved != null) {
                setNoteText(saved)
            }
            setNoteLoaded(true)
        } catch {
            // ignore
        }
    }, [])

    // Persist sticky note whenever it changes
    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!noteLoaded) return
        try {
            window.localStorage.setItem('sticky-note-text', noteText)
        } catch {
            // ignore
        }
    }, [noteText, noteLoaded])

    const handleDockLetterClick = () => {
        setShowLetters(prev => !prev)
    }

    const handleDockPhotosClick = () => {
        setShowPhotos(prev => !prev)
    }

    const handleDockMusicClick = () => {
        setShowMusic(prev => !prev)
    }

    const handleDockCalendarClick = () => {
        setShowCalendar(prev => !prev)
    }

    const handleDockPlansClick = () => {
        setShowPlans(prev => !prev)
    }

    const handleDockNotesClick = () => {
        setShowNotes(prev => !prev)
    }

    const value = {
        showLetters,
        setShowLetters,
        showPhotos,
        setShowPhotos,
        showMusic,
        setShowMusic,
        showCalendar,
        setShowCalendar,
        showPlans,
        setShowPlans,
        showNotes,
        setShowNotes,
        noteText,
        setNoteText,
        canAccessPlans,
        setCanAccessPlans,
        handleDockLetterClick,
        handleDockPhotosClick,
        handleDockMusicClick,
        handleDockCalendarClick,
        handleDockPlansClick,
        handleDockNotesClick,
    }

    return (
        <UIContext.Provider value={value}>
            {children}
        </UIContext.Provider>
    )
}
