import './globals.css'
import { MusicProvider } from './MusicProvider'
import { UIProvider } from './UIProvider'
import PersistentUI from './PersistentUI'

export const metadata = {
  title: 'Website',
  description: 'A modern website built with Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MusicProvider>
          <UIProvider>
            <PersistentUI />
            {children}
          </UIProvider>
        </MusicProvider>
      </body>
    </html>
  )
}

