import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Interview Simulator",
    description: "AI-powered technical interview practice",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
