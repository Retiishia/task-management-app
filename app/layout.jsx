import './globals.css';

export const metadata = {
  title: 'Retiishia Tasks Project | Modern Task Management',
  description: 'Full-stack Task Management Application designed for learning Next.js, MongoDB, and Docker.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0d1117',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen text-slate-100 selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
