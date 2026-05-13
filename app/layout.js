import './globals.css'
import { ThemeProvider } from './providers'

export const metadata = {
  title: 'VANTA Admin Portal',
  description: 'Peptides Business Management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-black transition-colors">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
