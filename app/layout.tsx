import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Leave Management — Oxford & Cambridge Tutors',
  description: 'Staff leave management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&family=Open+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
