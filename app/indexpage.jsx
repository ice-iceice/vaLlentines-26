'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Change this to whatever password you want
const CORRECT_PASSWORD = '030324'
const PIN_LENGTH = CORRECT_PASSWORD.length

export default function IndexPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [timeString, setTimeString] = useState('')
    const [dateString, setDateString] = useState('')
    const [error, setError] = useState('')
    const [showInput, setShowInput] = useState(false)

    const tryUnlock = (nextValue) => {
        if (nextValue.length === PIN_LENGTH) {
            if (nextValue === CORRECT_PASSWORD) {
                router.push('/desktop')
            } else {
                setError('Wrong password. Try again, lovey.')
                setPassword('')
            }
        }
    }

    const handleActivate = () => {
        if (!showInput) {
            setShowInput(true)
        } else {
            // Clicking outside when input is active resets to initial screen
            setShowInput(false)
            setPassword('')
            setError('')
        }
    }

    const handleKeypadPress = (digit) => {
        if (password.length >= PIN_LENGTH) return
        const next = password + digit
        setPassword(next)
        if (error) setError('')
        tryUnlock(next)
    }

    const handleBackspace = (e) => {
        if (e) e.stopPropagation()
        if (!password.length) return
        setPassword((prev) => prev.slice(0, -1))
        if (error) setError('')
    }

    useEffect(() => {
        const updateTime = () => {
            const now = new Date()
            const formatted = now.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
            })
            setTimeString(formatted)
            
            const formattedDate = now.toLocaleDateString([], {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
            })
            setDateString(formattedDate)
        }

        updateTime()
        const intervalId = setInterval(updateTime, 30000) // update every 30s
        return () => clearInterval(intervalId)
    }, [])

    // Allow keyboard digits / backspace as PIN input
    useEffect(() => {
        if (!showInput) return

        const handleKeyDown = (e) => {
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault()
                handleKeypadPress(e.key)
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                e.preventDefault()
                handleBackspace()
            } else if (e.key === 'Escape') {
                // Escape key resets to initial screen
                e.preventDefault()
                setShowInput(false)
                setPassword('')
                setError('')
            } else {
                // Any other key resets to initial screen
                setShowInput(false)
                setPassword('')
                setError('')
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [showInput, password, error])

    const keypadRows = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', '⌫'],
    ]

    return (
        <div className={`lock-screen-container ${showInput ? 'input-active' : ''}`} onClick={handleActivate}>
            {!showInput && (
                <div className="lock-screen-time-container">
                    <div className="lock-screen-time">{timeString}</div>
                    <div className="lock-screen-date">{dateString}</div>
                </div>
            )}
            <div className="lock-screen-center">
                {showInput && (
                    <>
                        <div className="lock-screen-avatar" />
                        <div className="lock-screen-name">Lorence&apos;s Computer</div>
                    </>
                )}
                {showInput ? (
                    <>
                        <div className="lock-screen-pin">
                            {Array.from({ length: PIN_LENGTH }).map((_, idx) => (
                                <span
                                    key={idx}
                                    className={
                                        'lock-screen-pin-dot' +
                                        (idx < password.length ? ' filled' : '')
                                    }
                                />
                            ))}
                        </div>
                        <div
                            className="lock-screen-keypad"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {keypadRows.map((row, ri) => (
                                <div key={ri} className="lock-screen-keypad-row">
                                    {row.map((key) => {
                                        if (key === '') {
                                            return (
                                                <button
                                                    key="empty"
                                                    type="button"
                                                    className="lock-screen-key-button empty"
                                                    disabled
                                                />
                                            )
                                        }
                                        if (key === '⌫') {
                                            return (
                                                <button
                                                    key="backspace"
                                                    type="button"
                                                    className="lock-screen-key-button control"
                                                    onClick={handleBackspace}
                                                >
                                                    ⌫
                                                </button>
                                            )
                                        }
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                className="lock-screen-key-button"
                                                onClick={() => handleKeypadPress(key)}
                                            >
                                                {key}
                                            </button>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </>
                ) : null}
                {error && <div className="lock-screen-error">{error}</div>}
                {showInput && !error && (
                    <div className="lock-screen-hint">Password hint: Anniversary</div>
                )}
            </div>
        </div>
    )
}
