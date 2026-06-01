import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Next.js 14 Demo",
  description: "Multi-tenant middleware, PostGIS geofence, Socket.io",
};

const nav = [
  { href: "/", label: "Home" },
  { href: "/tenant", label: "Tenant" },
  { href: "/geofence", label: "Geofence" },
  { href: "/realtime", label: "Realtime" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand">
              <span className="brand-title">Next.js 14 Demo</span>
              <span className="brand-sub">Middleware · PostGIS · Socket.io</span>
            </Link>
            <nav className="site-nav" aria-label="Main">
              {nav.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <div className="site-body">{children}</div>
        <footer className="site-footer">
          <p>Built by Mahasooq</p>
        </footer>
      </body>
    </html>
  );
}
