import "./globals.css";

export const metadata = {
  title: "Hub Alcântara Consultoria Farma 360",
  description: "Portal de projetos da Alcântara Consultoria Farma 360",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <head>
        {/* Fraunces: serifa usada nos títulos e nos números-destaque
            (identidade "Confiança Executiva"). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap"
        />
        {/* Aplica o tema salvo (localStorage) antes da hidratação, para não
            piscar o tema errado ao carregar a página. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("hub-theme");if(t==="claro"){document.documentElement.setAttribute("data-theme","claro");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
