import React, { ReactNode } from "react";
import { Github } from "lucide-react";
import "../styles/globals.css";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="container">
      <header className="header">
        <Github size={32} className="logo" />
        <h1>AI Release Notes Generator</h1>
      </header>
      <main className="main">{children}</main>
      <footer className="footer">© 2025 AI Release Notes | Open Source ❤️</footer>
    </div>
  );
};

export default Layout;
