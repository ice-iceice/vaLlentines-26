'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useUI } from '../UIProvider'
import Image from 'next/image'

export default function LetterPage() {
    const router = useRouter()
    const { setCanAccessPlans } = useUI()
    const [extensionIndex, setExtensionIndex] = useState(0)
    const [showPlaceholder, setShowPlaceholder] = useState(false)
    const [hasOpened, setHasOpened] = useState(false)
    const [isOpening, setIsOpening] = useState(false)
    // Start with the letter (PNG) as the front of the card
    const [isFlipped, setIsFlipped] = useState(false)
    const [showYesHoverImage, setShowYesHoverImage] = useState(false)
    const [showNoHoverImage, setShowNoHoverImage] = useState(false)
    const [hasSaidYes, setHasSaidYes] = useState(false)
    const [hasSaidNo, setHasSaidNo] = useState(false)
    const [noCardImageSrc, setNoCardImageSrc] = useState('/images/no-card-bg.png')
    // Try .png first since your letter is letter.png
    const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    const currentPath = `/images/letter${extensions[extensionIndex]}`

    const handleError = () => {
        if (extensionIndex < extensions.length - 1) {
            setExtensionIndex(extensionIndex + 1)
        } else {
            setShowPlaceholder(true)
        }
    }

    const handleButton1Click = () => {
        setHasSaidYes(true)
        setCanAccessPlans(true)
    }

    const handleButton2Click = () => {
        setHasSaidNo(true)
        setNoCardImageSrc('/images/no-card-bg.png')
    }

    const handleNoCardOption1Click = () => {
        setNoCardImageSrc((prev) =>
            prev === '/images/offer1.png' ? '/images/no-card-bg.png' : '/images/offer1.png'
        )
    }

    const handleNoCardOption2Click = () => {
        setNoCardImageSrc((prev) =>
            prev === '/images/offer2.png' ? '/images/no-card-bg.png' : '/images/offer2.png'
        )
    }

    const handleNoCardOption3Click = () => {
        setNoCardImageSrc((prev) =>
            prev === '/images/offer3.png' ? '/images/no-card-bg.png' : '/images/offer3.png'
        )
    }

    const handleThinkAgainClick = () => {
        // Hide the "No" card and return to the main letter with Yes/No buttons
        setHasSaidNo(false)
        setNoCardImageSrc('/images/no-card-bg.png')
    }

    const handleEnvelopeClick = () => {
        if (hasOpened || isOpening) return
        setIsOpening(true)
        setTimeout(() => {
            setHasOpened(true)
            setIsOpening(false)
        }, 650) // match CSS animation duration
    }

    return (
        <div className="letter-page-container">
            {/* App-style window frame so the letter feels like its own app */}
            <div className="letter-app-window">
                {/* Full-size card that appears when they said Yes – same size as app rectangle */}
                {hasSaidYes && (
                    <div className="letter-yes-card">
                        <div className="letter-yes-card-inner">
                            <Image
                                src="/images/yes-card.gif"
                                alt=""
                                width={800}
                                height={600}
                                className="letter-yes-card-gif"
                                style={{ objectFit: 'contain' }}
                                unoptimized
                            />
                            <div className="letter-yes-card-letter">
                                <Image
                                    src="/images/yes-card-letter.png"
                                    alt="Letter"
                                    width={800}
                                    height={1000}
                                    className="letter-yes-card-letter-img"
                                    style={{ objectFit: 'contain' }}
                                />
                            </div>
                        </div>
                    </div>
                )}
                {/* Full-size card that appears when they said No – same size as app rectangle */}
                {hasSaidNo && (
                    <div className="letter-no-card">
                        <div className="letter-no-card-inner">
                            <div className="letter-image-container">
                                <Image
                                    src={noCardImageSrc}
                                    alt=""
                                    width={800}
                                    height={600}
                                    className="letter-no-card-bg-img"
                                    style={{ objectFit: 'contain' }}
                                />
                                <div className="letter-buttons">
                                    <button
                                        type="button"
                                        className="letter-button button-1"
                                        onClick={handleNoCardOption1Click}
                                    >
                                        this
                                    </button>
                                    <button
                                        type="button"
                                        className="letter-button button-2"
                                        onClick={handleNoCardOption2Click}
                                    >
                                        this
                                    </button>
                                    <button
                                        type="button"
                                        className="letter-button button-3"
                                        onClick={handleNoCardOption3Click}
                                    >
                                        and this
                                    </button>
                                </div>
                                <div className="letter-buttons">
                                    <button
                                        type="button"
                                        className="letter-button button-4"
                                        onClick={handleThinkAgainClick}
                                    >
                                        okay, i'll think about it again
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Image that appears on the left when hovering Yes */}
                {showYesHoverImage && !hasSaidYes && !hasSaidNo && (
                    <div className="letter-yes-hover-image">
                        <Image
                            src="/images/yesreaction.png"
                            alt=""
                            width={320}
                            height={448}
                            className="letter-yes-hover-image-img"
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                )}
                {showNoHoverImage && !hasSaidYes && !hasSaidNo && (
                    <div className="letter-no-hover-image">
                        <Image
                            src="/images/noreaction.png"
                            alt=""
                            width={320}
                            height={448}
                            className="letter-no-hover-image-img"
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                )}
                {!hasOpened && (
                    <div
                        className={`letter-envelope-overlay ${isOpening ? 'opening' : ''}`}
                        onClick={handleEnvelopeClick}
                    >
                        <div
                            className="letter-envelope"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleEnvelopeClick()
                            }}
                        >
                            <span className="letter-envelope-icon">✉</span>
                        </div>
                    </div>
                )}
                <div className={`letter-content ${hasSaidYes || hasSaidNo ? 'letter-content-hidden' : ''}`}>
                    <div className="letter-image-container">
                        {hasOpened && !hasSaidYes && !hasSaidNo && (
                            <div className="letter-card-area">
                                <div
                                    className={`letter-flip-card ${isFlipped ? 'flipped' : ''}`}
                                    onClick={() => setIsFlipped((prev) => !prev)}
                                >
                                <div className="letter-flip-card-inner">
                                    {/* Front of the card: front letter PNG */}
                                    <div className="letter-flip-card-face front">
                                        <Image
                                            src="/images/front%20letter.png"
                                            alt="Front of letter"
                                            width={800}
                                            height={1000}
                                            className="letter-image"
                                            style={{ objectFit: 'contain' }}
                                            priority
                                        />
                                    </div>
                                    {/* Back of the card: full letter PNG */}
                                    <div className="letter-flip-card-face back">
                                        <div className="letter-back-content">
                                            {showPlaceholder ? (
                                                <div className="letter-image-placeholder">
                                                    Letter image not found. Please add your letter image to the <code>public/images/</code> folder as <code>letter.png</code> (or .jpg, .jpeg, .webp, .gif)
                                                </div>
                                            ) : (
                                                <Image
                                                    key={currentPath}
                                                    src={currentPath}
                                                    alt="Letter"
                                                    width={800}
                                                    height={1000}
                                                    className="letter-image"
                                                    style={{ objectFit: 'contain' }}
                                                    priority
                                                    onError={handleError}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            </div>
                        )}
                        {hasOpened && isFlipped && (
                            <div className="letter-buttons">
                                <button
                                    type="button"
                                    className="letter-button button-1"
                                    onClick={handleButton1Click}
                                    onMouseEnter={() => setShowYesHoverImage(true)}
                                    onMouseLeave={() => setShowYesHoverImage(false)}
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    className="letter-button button-2"
                                    onClick={handleButton2Click}
                                    onMouseEnter={() => setShowNoHoverImage(true)}
                                    onMouseLeave={() => setShowNoHoverImage(false)}
                                >
                                    No
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
