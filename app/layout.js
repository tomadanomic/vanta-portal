import './globals.css'

export const metadata = {
  title: 'VANTA Portal',
  description: 'VANTA Peptides Admin Dashboard',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-dark text-white">{children}</body>
    </html>
  )
}
