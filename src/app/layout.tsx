// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* This makes Tailwind work without the broken local compiler */}
        <script src="https://cdn.tailwindcss.com"></script>
        <title>BODU NINMUN 2026</title>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}