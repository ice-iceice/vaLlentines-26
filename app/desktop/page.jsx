'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useMusic } from '../MusicProvider'
import { useUI } from '../UIProvider'

// Component for modal that shows FULL-SIZE images when thumbnails are clicked
// Looks for images in: public/images/p1.jpg, public/images/letter.jpg, etc.
function ModalImage({ baseName }) {
    const [extensionIndex, setExtensionIndex] = useState(0)
    const [showPlaceholder, setShowPlaceholder] = useState(false)
    const extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    // Full-size images go in: public/images/ for letters and public/photos/ for all photos
    // Encode spaces in filenames for URL compatibility
    // Special case: '/location' uses 'myart.png' instead
    let imageName = baseName.replace(/ /g, '%20')
    if (baseName === '/location') {
        imageName = '/myart'
    }
    // Photos are: location* images and single-letter images (a-r) - all use /photos/
    const isPhoto = baseName.startsWith('/location ') || 
                    /^\/[a-r]$/.test(baseName)
    const baseFolder = isPhoto ? '/photos' : '/images'
    const currentPath = `${baseFolder}${imageName}${extensions[extensionIndex]}`

    const handleError = () => {
        if (extensionIndex < extensions.length - 1) {
            // Try next extension
            setExtensionIndex(extensionIndex + 1)
        } else {
            // All extensions failed
            setShowPlaceholder(true)
        }
    }

    if (showPlaceholder) {
        return (
            <div className="modal-image-placeholder">
                Image not found. Please add your full-size image ({baseName}) to the <code>public/images/</code> folder.
            </div>
        )
    }

    return (
        <Image
            key={currentPath} // Force re-render when path changes
            src={currentPath}
            alt="Zoomed Image"
            fill
            className="modal-image"
            style={{ objectFit: 'contain' }}
            priority
            onError={handleError}
        />
    )
}

// Component that tries different image extensions for THUMBNAILS (the clickable buttons)
// Looks for images in: public/thumbnails/p1.jpg, public/thumbnails/letter.jpg, etc.
function ThumbnailImage({ baseName }) {
    const [extensionIndex, setExtensionIndex] = useState(0)
    const [showFallback, setShowFallback] = useState(false)
    const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'] // Try .png first since that's what you have
    // Thumbnail images go in: public/thumbnails/
    // Encode spaces in filenames for URL compatibility
    const encodedBaseName = baseName.replace(/ /g, '%20')
    const currentPath = `/thumbnails${encodedBaseName}${extensions[extensionIndex]}`

    const handleError = () => {
        if (extensionIndex < extensions.length - 1) {
            setExtensionIndex(extensionIndex + 1)
        } else {
            setShowFallback(true)
        }
    }

    if (showFallback) {
        const fallbackIndex = Math.min(parseInt(baseName.replace('/p', '').replace('/letter', '2').replace('/location', '5')) || 1, 9)
        return <div className={`thumbnail-image thumbnail-fallback thumbnail-${fallbackIndex}`}></div>
    }

    return (
        <Image
            src={currentPath}
            alt={baseName.replace('/', '')}
            fill
            className="thumbnail-image"
            style={{ objectFit: 'cover' }}
            onError={handleError}
        />
    )
}

export default function Desktop() {
    const router = useRouter()
    const [selectedImage, setSelectedImage] = useState(null)
    const [zoomLevel, setZoomLevel] = useState(1)
    const [isLetterOpening, setIsLetterOpening] = useState(false)
    // UI state - shared across all pages via UIProvider
    const {
        showLetters,
        setShowLetters,
        showPhotos,
        setShowPhotos,
        showMusic,
    } = useUI()
    const [draggingThumbId, setDraggingThumbId] = useState(null)
    const [thumbnailPositions, setThumbnailPositions] = useState({})
    const thumbDragOffsetRef = useRef({ x: 0, y: 0 })
    const thumbDragMovedRef = useRef(false)
    const inactivityTimeoutRef = useRef(null)
    const hasLoadedPositionsRef = useRef(false)

    // Load saved thumbnail positions from localStorage (persist across reloads)
    useEffect(() => {
        if (typeof window === 'undefined') return
        try {
            const saved = window.localStorage.getItem('thumbnailPositions')
            if (saved) {
                const parsed = JSON.parse(saved)
                if (parsed && typeof parsed === 'object') {
                    setThumbnailPositions(parsed)
                }
            }
            hasLoadedPositionsRef.current = true
        } catch (err) {
            console.error('Error loading thumbnail positions from localStorage', err)
        }
    }, [])

    // Array of image identifiers - uses p1, p2, p3, etc. with exceptions: letter and location
    // Photo locations shown when Photos is open (files in public/photos/, thumbnails in public/thumbnails/)
    const PHOTO_IMAGE_BASES = useMemo(() => [
        '/location eastwood',
        '/location cubao',
        '/a', '/b', '/c', '/d', '/e', '/f', '/g', '/h', '/i', '/j', '/k', '/l', '/m', '/n', '/o', '/p', '/q', '/r',
    ], [])

    // To add new images: just add them here and put the files in public/thumbnails/ and public/images/ (or public/photos/ for location*)
    const images = useMemo(() => [
        '/p1', '/letter', '/p2', '/p3', '/location', '/location eastwood', '/location cubao',
        '/p4', '/p5', '/p6', '/p7',
        '/a', '/b', '/c', '/d', '/e', '/f', '/g', '/h', '/i', '/j', '/k', '/l', '/m', '/n', '/o', '/p', '/q', '/r',
    ], [])

    // Base positions for thumbnails (no randomization), all well inside the desktop margin
    // Desktop has 5% margin, so inner box is 5% to 95% - positions stay inside that range
    // Using 8% to 92% to keep items clearly inside, not on the edge
    const baseThumbnailPositions = useMemo(
        () => [
            { top: '15%', left: '8%' },
            { top: '22%', right: '12%' },
            { top: '10%', left: '45%' },
            { top: '35%', left: '10%' },
            { top: '18%', right: '30%' },
            { top: '45%', left: '25%' },
            { top: '28%', right: '10%' },
            { bottom: '25%', left: '20%' },
            { bottom: '38%', right: '25%' },
            { top: '52%', left: '15%' },
            { top: '38%', right: '25%' },
            { bottom: '20%', left: '42%' },
            { bottom: '30%', right: '15%' },
            { top: '65%', left: '35%' },
            { bottom: '15%', right: '35%' },
        ],
        []
    )

    // Helper to get display name for label
    const getDisplayName = (path) => {
        const name = path.replace('/', '')
        return name.includes('.') ? name : `${name}.jpg`
    }

    const handleThumbnailClick = (imageBase, index) => {
        // Special animation for letter - navigate to letter page
        if (imageBase === '/letter') {
            setIsLetterOpening(true)
            // Wait for animation to complete before navigating
            setTimeout(() => {
                router.push('/letter')
                setIsLetterOpening(false)
            }, 600) // Match animation duration
        } else {
            setSelectedImage({ path: imageBase, index })
            setZoomLevel(1)
        }
    }

    const closeModal = useCallback(() => {
        setSelectedImage(null)
        setZoomLevel(1)
    }, [])

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(prev + 0.25, 3))
    }

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
    }

    const handlePrevPhoto = useCallback(() => {
        if (!selectedImage) return
        const currentIndex = PHOTO_IMAGE_BASES.findIndex(photo => photo === selectedImage.path)
        if (currentIndex > 0) {
            const prevPhoto = PHOTO_IMAGE_BASES[currentIndex - 1]
            const prevIndex = images.findIndex(img => img === prevPhoto)
            setSelectedImage({ path: prevPhoto, index: prevIndex })
            setZoomLevel(1)
        } else {
            // Wrap to last photo
            const lastPhoto = PHOTO_IMAGE_BASES[PHOTO_IMAGE_BASES.length - 1]
            const lastIndex = images.findIndex(img => img === lastPhoto)
            setSelectedImage({ path: lastPhoto, index: lastIndex })
            setZoomLevel(1)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedImage, PHOTO_IMAGE_BASES, images])

    const handleNextPhoto = useCallback(() => {
        if (!selectedImage) return
        const currentIndex = PHOTO_IMAGE_BASES.findIndex(photo => photo === selectedImage.path)
        if (currentIndex < PHOTO_IMAGE_BASES.length - 1) {
            const nextPhoto = PHOTO_IMAGE_BASES[currentIndex + 1]
            const nextIndex = images.findIndex(img => img === nextPhoto)
            setSelectedImage({ path: nextPhoto, index: nextIndex })
            setZoomLevel(1)
        } else {
            // Wrap to first photo
            const firstPhoto = PHOTO_IMAGE_BASES[0]
            const firstIndex = images.findIndex(img => img === firstPhoto)
            setSelectedImage({ path: firstPhoto, index: firstIndex })
            setZoomLevel(1)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedImage, PHOTO_IMAGE_BASES, images])

    const handleWheel = (e) => {
        if (selectedImage) {
            e.preventDefault()
            const delta = e.deltaY > 0 ? -0.1 : 0.1
            setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)))
        }
    }

    const handleThumbnailMouseDown = (e, slot, id) => {
        // Don't allow dragging empty slots or the centered letter thumbnail
        if (slot.isEmpty || slot.imageBase === '/letter') return
        thumbDragMovedRef.current = false
        const el = e.currentTarget
        const rect = el.getBoundingClientRect()
        thumbDragOffsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }
        setDraggingThumbId(id)
        e.preventDefault()
    }

    useEffect(() => {
        if (draggingThumbId === null) return

        const handleMouseMove = (e) => {
            const vw = window.innerWidth
            const vh = window.innerHeight
            const thumbSize = 120

            // Keep thumbnails/photos well inside the inner margin box
            // Desktop has 5% margin, so inner box starts at 5% and ends at 95%
            // Add responsive padding inside that box to keep items away from edges
            const marginRatio = 0.05
            // Responsive padding: smaller on small screens, larger on big screens
            const paddingInside = Math.max(20, Math.min(40, vw * 0.02))
            const menuBarHeight = 40
            const dockHeight = 100

            // Calculate inner box boundaries
            const innerBoxLeft = vw * marginRatio
            const innerBoxRight = vw * (1 - marginRatio)
            const innerBoxTop = vh * marginRatio
            const innerBoxBottom = vh * (1 - marginRatio)

            // Ensure we have enough space (at least thumbSize + padding on each side)
            const minX = Math.max(innerBoxLeft + paddingInside, paddingInside)
            const maxX = Math.min(innerBoxRight - thumbSize - paddingInside, vw - thumbSize - paddingInside)
            const minY = Math.max(innerBoxTop + menuBarHeight + paddingInside, menuBarHeight + paddingInside)
            const maxY = Math.min(innerBoxBottom - thumbSize - dockHeight - paddingInside, vh - thumbSize - dockHeight - paddingInside)

            // Ensure valid bounds (max must be >= min)
            const finalMinX = Math.min(minX, maxX - thumbSize)
            const finalMaxX = Math.max(maxX, minX + thumbSize)
            const finalMinY = Math.min(minY, maxY - thumbSize)
            const finalMaxY = Math.max(maxY, minY + thumbSize)

            let x = e.clientX - thumbDragOffsetRef.current.x
            let y = e.clientY - thumbDragOffsetRef.current.y

            x = Math.min(Math.max(x, finalMinX), finalMaxX)
            y = Math.min(Math.max(y, finalMinY), finalMaxY)

            // Mark that a drag actually happened (used to suppress click)
            thumbDragMovedRef.current = true

            setThumbnailPositions(prev => ({
                ...prev,
                [draggingThumbId]: { left: x, top: y },
            }))
        }

        const handleMouseUp = () => {
            setDraggingThumbId(null)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [draggingThumbId])

    // Scale or clamp thumbnail positions when window resizes so they keep relative position
    const positionsRef = useRef(thumbnailPositions)
    const prevBoundsRef = useRef(null)

    useEffect(() => {
        positionsRef.current = thumbnailPositions
    }, [thumbnailPositions])

    useEffect(() => {
        if (typeof window === 'undefined' || !hasLoadedPositionsRef.current) return

        const getBounds = () => {
            const vw = window.innerWidth
            const vh = window.innerHeight
            const thumbSize = 120
            const marginRatio = 0.05
            const paddingInside = Math.max(20, Math.min(40, vw * 0.02))
            const menuBarHeight = 40
            const dockHeight = 100

            const innerBoxLeft = vw * marginRatio
            const innerBoxRight = vw * (1 - marginRatio)
            const innerBoxTop = vh * marginRatio
            const innerBoxBottom = vh * (1 - marginRatio)

            const minX = Math.max(innerBoxLeft + paddingInside, paddingInside)
            const maxX = Math.min(innerBoxRight - thumbSize - paddingInside, vw - thumbSize - paddingInside)
            const minY = Math.max(innerBoxTop + menuBarHeight + paddingInside, menuBarHeight + paddingInside)
            const maxY = Math.min(innerBoxBottom - thumbSize - dockHeight - paddingInside, vh - thumbSize - dockHeight - paddingInside)

            const finalMinX = Math.min(minX, maxX - thumbSize)
            const finalMaxX = Math.max(maxX, minX + thumbSize)
            const finalMinY = Math.min(minY, maxY - thumbSize)
            const finalMaxY = Math.max(maxY, minY + thumbSize)

            return { minX: finalMinX, maxX: finalMaxX, minY: finalMinY, maxY: finalMaxY }
        }

        const validatePositions = () => {
            const currentPositions = positionsRef.current
            if (!currentPositions || Object.keys(currentPositions).length === 0) return

            const bounds = getBounds()
            const { minX, maxX, minY, maxY } = bounds
            const prev = prevBoundsRef.current

            let needsUpdate = false
            const newPositions = {}

            Object.keys(currentPositions).forEach((id) => {
                const pos = currentPositions[id]
                if (!pos || pos.left === undefined || pos.top === undefined) return

                let newX = pos.left
                let newY = pos.top

                if (prev && (prev.maxX - prev.minX) > 0 && (prev.maxY - prev.minY) > 0) {
                    // Scale from previous bounds to current bounds so relative position is preserved
                    const relX = (pos.left - prev.minX) / (prev.maxX - prev.minX)
                    const relY = (pos.top - prev.minY) / (prev.maxY - prev.minY)
                    newX = minX + relX * (maxX - minX)
                    newY = minY + relY * (maxY - minY)
                }

                // Clamp to current bounds (handles first run or any overflow)
                newX = Math.min(Math.max(newX, minX), maxX)
                newY = Math.min(Math.max(newY, minY), maxY)

                newPositions[id] = { left: newX, top: newY }
                if (newX !== pos.left || newY !== pos.top) {
                    needsUpdate = true
                }
            })

            prevBoundsRef.current = bounds

            if (needsUpdate) {
                setThumbnailPositions(newPositions)
            }
        }

        let resizeTimeout
        const handleResize = () => {
            clearTimeout(resizeTimeout)
            resizeTimeout = setTimeout(validatePositions, 100)
        }

        window.addEventListener('resize', handleResize)
        // Set initial bounds so first resize has a previous size to scale from
        prevBoundsRef.current = getBounds()
        // Validate once on mount to clamp any out-of-bounds saved positions
        validatePositions()

        return () => {
            window.removeEventListener('resize', handleResize)
            if (resizeTimeout) clearTimeout(resizeTimeout)
        }
    }, [hasLoadedPositionsRef])

    // Persist thumbnail positions to localStorage whenever they change
    useEffect(() => {
        if (typeof window === 'undefined') return
        if (!hasLoadedPositionsRef.current) return
        if (!thumbnailPositions || Object.keys(thumbnailPositions).length === 0) return
        try {
            window.localStorage.setItem('thumbnailPositions', JSON.stringify(thumbnailPositions))
        } catch (err) {
            console.error('Error saving thumbnail positions to localStorage', err)
        }
    }, [thumbnailPositions])

    // Keyboard navigation for photos (left/right arrows)
    useEffect(() => {
        if (!selectedImage || !PHOTO_IMAGE_BASES.includes(selectedImage.path)) return

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault()
                handlePrevPhoto()
            } else if (e.key === 'ArrowRight') {
                e.preventDefault()
                handleNextPhoto()
            } else if (e.key === 'Escape') {
                e.preventDefault()
                closeModal()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedImage, handlePrevPhoto, handleNextPhoto, closeModal, PHOTO_IMAGE_BASES])

    // Auto-lock after inactivity (3 minutes)
    useEffect(() => {
        const INACTIVITY_MS = 3 * 60 * 1000

        const resetTimer = () => {
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current)
            }
            inactivityTimeoutRef.current = setTimeout(() => {
                router.push('/')
            }, INACTIVITY_MS)
        }

        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart']
        activityEvents.forEach((evt) => window.addEventListener(evt, resetTimer))

        resetTimer()

        return () => {
            if (inactivityTimeoutRef.current) {
                clearTimeout(inactivityTimeoutRef.current)
            }
            activityEvents.forEach((evt) =>
                window.removeEventListener(evt, resetTimer)
            )
        }
    }, [router])

    const handleThumbnailClickWrapper = (imageBase, index) => {
        // If we just dragged, don't treat it as a click
        if (thumbDragMovedRef.current) {
            thumbDragMovedRef.current = false
            return
        }
        handleThumbnailClick(imageBase, index)
    }

    return (
        <div className="desktop-container" onWheel={handleWheel}>
            {/* Photos - Each with individual container */}
            {showPhotos && (() => {
                // Use fixed base positions (no randomization)
                const positions = baseThumbnailPositions

                // Create slots for visible images
                const allSlots = []

                // Find letter index and separate other images
                const letterIndex = images.findIndex(img => img === '/letter')
                const otherImages = images.filter((img, idx) => idx !== letterIndex)

                const isPhotoImage = (imageBase) =>
                    PHOTO_IMAGE_BASES.includes(String(imageBase).trim())

                // Filter visible images - only photos (location eastwood + location cubao)
                const visibleOtherImages = otherImages.filter((img) =>
                    isPhotoImage(img)
                )

                // Add all photo images at base positions
                visibleOtherImages.forEach((imageBase, index) => {
                    allSlots.push({
                        imageBase,
                        index: images.indexOf(imageBase),
                        position: positions[index],
                        isEmpty: false
                    })
                })

                return allSlots.map((slot, idx) => {
                    const customPos = thumbnailPositions[slot.index]
                    const style = customPos || slot.position

                    return (
                        <div
                            key={idx}
                            className="photo-item-container"
                            style={style}
                        >
                            <div
                                className={`thumbnail ${slot.isEmpty ? 'thumbnail-empty' : ''} ${slot.isCentered ? 'thumbnail-centered' : ''} ${slot.imageBase === '/letter' && isLetterOpening ? 'letter-opening' : ''} ${slot.imageBase === '/letter' ? 'letter-thumbnail' : ''}`}
                                onMouseDown={(e) => handleThumbnailMouseDown(e, slot, slot.index)}
                                onClick={slot.isEmpty ? undefined : () => handleThumbnailClickWrapper(slot.imageBase, slot.index)}
                            >
                                <div className="thumbnail-image-wrapper">
                                    {slot.isEmpty ? (
                                        <div className="thumbnail-placeholder"></div>
                                    ) : (
                                        <ThumbnailImage baseName={slot.imageBase} />
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })
            })()}

            {/* Scattered Thumbnails for Letters */}
            {showLetters && (() => {
                const positions = baseThumbnailPositions

                const allSlots = []

                const letterIndex = images.findIndex(img => img === '/letter')
                const otherImages = images.filter((img, idx) => idx !== letterIndex)

                const isLetterImage = (imageBase) =>
                    ['/p1', '/p2', '/p3', '/p4', '/p5', '/p6', '/p7', '/letter', '/location'].includes(imageBase)

                const centerPosition = { top: '50%', left: '50%' }

                const visibleOtherImages = otherImages.filter((img) =>
                    isLetterImage(img)
                )

                visibleOtherImages.forEach((imageBase, index) => {
                    allSlots.push({
                        imageBase,
                        index: images.indexOf(imageBase),
                        position: positions[index],
                        isEmpty: false
                    })
                })

                if (letterIndex !== -1) {
                    allSlots.push({
                        imageBase: '/letter',
                        index: letterIndex,
                        position: centerPosition,
                        isEmpty: false,
                        isCentered: true
                    })
                }

                return allSlots.map((slot, idx) => {
                    const customPos = thumbnailPositions[slot.index]
                    const style = customPos || slot.position

                    return (
                        <div
                            key={idx}
                            className={`thumbnail ${slot.isEmpty ? 'thumbnail-empty' : ''} ${slot.isCentered ? 'thumbnail-centered' : ''} ${slot.imageBase === '/letter' && isLetterOpening ? 'letter-opening' : ''} ${slot.imageBase === '/letter' ? 'letter-thumbnail' : ''}`}
                            style={style}
                            onMouseDown={(e) => handleThumbnailMouseDown(e, slot, slot.index)}
                            onClick={slot.isEmpty ? undefined : () => handleThumbnailClickWrapper(slot.imageBase, slot.index)}
                        >
                            <div className="thumbnail-image-wrapper">
                                {slot.isEmpty ? (
                                    <div className="thumbnail-placeholder"></div>
                                ) : (
                                    <ThumbnailImage baseName={slot.imageBase} />
                                )}
                            </div>
                        </div>
                    )
                })
            })()}

            {/* Zoom Modal */}
            {selectedImage && (
                <div className={`modal-overlay ${selectedImage.path === '/letter' ? 'letter-modal' : ''}`} onClick={closeModal}>
                    <div className={`modal-content ${selectedImage.path === '/letter' ? 'letter-modal-content' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="window-chrome">
                            <div className="window-dots">
                                <span className="window-dot red" />
                                <span className="window-dot yellow" />
                                <span className="window-dot green" />
                            </div>
                            <div className="window-title">Preview — {selectedImage.path.replace('/', '')}</div>
                        </div>
                        <button className="modal-close" onClick={closeModal}>×</button>
                        {PHOTO_IMAGE_BASES.includes(selectedImage.path) && (
                            <>
                                <button 
                                    className="modal-nav-button modal-nav-left" 
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handlePrevPhoto()
                                    }}
                                    aria-label="Previous photo"
                                >
                                    ‹
                                </button>
                                <button 
                                    className="modal-nav-button modal-nav-right" 
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleNextPhoto()
                                    }}
                                    aria-label="Next photo"
                                >
                                    ›
                                </button>
                            </>
                        )}
                        <div className="modal-image-container" style={{ transform: `scale(${zoomLevel})` }}>
                            <ModalImage baseName={selectedImage.path} />
                        </div>
                        <div className="modal-controls">
                            <button className="zoom-button" onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                                −
                            </button>
                            <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                            <button className="zoom-button" onClick={handleZoomIn} disabled={zoomLevel >= 3}>
                                +
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

