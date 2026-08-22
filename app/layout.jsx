import './globals.css';

export const metadata = {
  title: 'Task Manager | Next.js, MongoDB & Docker',
  description: 'Full-stack Task Management Application designed for learning Next.js, MongoDB, and Docker.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen text-slate-100 selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
