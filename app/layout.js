import "./globals.css";

export const metadata = {
  title: "Hub Alcântara Consultoria Farma 360",
  description: "Portal de projetos da Alcântara Consultoria Farma 360",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
