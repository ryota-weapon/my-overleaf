#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${BLUE}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                    LaTeX Web Editor Setup                     ║
║                                                               ║
║  Local-first LaTeX editor with web preview and AI assistance ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if grep -q Microsoft /proc/version 2>/dev/null; then
            echo "wsl"
        else
            echo "linux"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    else
        echo "unknown"
    fi
}

OS=$(detect_os)
echo -e "${BLUE}Detected OS: ${GREEN}$OS${NC}"
echo ""

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print status
print_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# Check Node.js
check_node() {
    echo -e "${BLUE}Checking Node.js...${NC}"
    if command_exists node; then
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}✓${NC} Node.js $NODE_VERSION is installed"
        
        # Check version (require Node 18+)
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
        if [ $NODE_MAJOR -lt 18 ]; then
            echo -e "${YELLOW}⚠${NC} Node.js 18+ is recommended (you have $NODE_VERSION)"
        fi
    else
        echo -e "${RED}✗${NC} Node.js is not installed"
        echo ""
        echo "Please install Node.js 18+ from: https://nodejs.org/"
        if [ "$OS" == "macos" ]; then
            echo "Or install via Homebrew: brew install node"
        fi
        return 1
    fi
}

# Check and install pnpm
check_pnpm() {
    echo -e "${BLUE}Checking pnpm...${NC}"
    if command_exists pnpm; then
        PNPM_VERSION=$(pnpm -v)
        echo -e "${GREEN}✓${NC} pnpm $PNPM_VERSION is installed"
    else
        echo -e "${YELLOW}⚠${NC} pnpm is not installed"
        read -p "Would you like to install pnpm? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Installing pnpm..."
            npm install -g pnpm
            print_status "pnpm installed successfully"
        else
            echo -e "${RED}✗${NC} pnpm is required. Please install it manually: npm install -g pnpm"
            return 1
        fi
    fi
}

# Check LaTeX
check_latex() {
    echo -e "${BLUE}Checking LaTeX installation...${NC}"
    if command_exists pdflatex; then
        LATEX_VERSION=$(pdflatex --version | head -n 1)
        echo -e "${GREEN}✓${NC} LaTeX is installed: $LATEX_VERSION"
        
        # Check if tlmgr is available
        if command_exists tlmgr; then
            echo -e "${GREEN}✓${NC} tlmgr package manager is available"
        else
            echo -e "${YELLOW}⚠${NC} tlmgr not found - package installation may be limited"
        fi
    else
        echo -e "${RED}✗${NC} LaTeX (pdflatex) is not installed"
        echo ""
        
        if [ "$OS" == "macos" ]; then
            echo "LaTeX installation options for macOS:"
            echo ""
            echo "1) BasicTeX (Recommended - ~100MB):"
            echo "   brew install --cask basictex"
            echo ""
            echo "2) Full MacTeX (~4GB):"
            echo "   brew install --cask mactex"
            echo ""
            echo "After installation, add to PATH:"
            echo "   export PATH=\"/Library/TeX/texbin:\$PATH\""
        elif [ "$OS" == "linux" ] || [ "$OS" == "wsl" ]; then
            echo "Install TeX Live on Linux/WSL:"
            echo ""
            echo "Ubuntu/Debian:"
            echo "   sudo apt-get update"
            echo "   sudo apt-get install texlive-base texlive-latex-recommended texlive-fonts-recommended"
            echo ""
            echo "For full installation:"
            echo "   sudo apt-get install texlive-full"
        fi
        
        return 1
    fi
}

# Install LaTeX packages
install_latex_packages() {
    if command_exists tlmgr; then
        echo -e "${BLUE}Checking essential LaTeX packages...${NC}"
        
        PACKAGES=(
            "amsmath"
            "amsfonts"
            "amssymb"
            "geometry"
            "graphicx"
            "hyperref"
            "babel"
            "inputenc"
            "fontenc"
        )
        
        echo "Would you like to install/update essential LaTeX packages?"
        echo "This requires sudo access and may take a few minutes."
        read -p "Install packages? (y/n) " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "Updating tlmgr..."
            sudo tlmgr update --self 2>/dev/null || echo -e "${YELLOW}⚠${NC} Could not update tlmgr"
            
            for package in "${PACKAGES[@]}"; do
                echo -n "Installing $package... "
                sudo tlmgr install $package 2>/dev/null && echo -e "${GREEN}✓${NC}" || echo -e "${YELLOW}skipped${NC}"
            done
            
            echo -e "${GREEN}✓${NC} LaTeX packages installation complete"
        fi
    fi
}

# Install Node dependencies
install_dependencies() {
    echo -e "${BLUE}Installing Node.js dependencies...${NC}"
    
    if [ -f "package.json" ]; then
        pnpm install
        print_status "Dependencies installed successfully"
    else
        echo -e "${RED}✗${NC} package.json not found. Are you in the project directory?"
        return 1
    fi
}

# Create sample project
create_sample_project() {
    echo -e "${BLUE}Creating sample project...${NC}"
    
    if [ ! -d "papers/sample-paper" ]; then
        read -p "Would you like to create a sample LaTeX project? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            mkdir -p papers/sample-paper
            
            cat > papers/sample-paper/main.tex << 'EOL'
\documentclass[12pt,a4paper]{article}
\usepackage[utf8]{inputenc}
\usepackage{amsmath}
\usepackage{graphicx}
\usepackage{hyperref}
\usepackage{geometry}
\geometry{margin=1in}

\title{Sample LaTeX Document}
\author{Your Name}
\date{\today}

\begin{document}

\maketitle

\section{Introduction}
Welcome to the LaTeX Web Editor! This is a sample document to demonstrate the basic features of LaTeX.

\section{Mathematics}
LaTeX is excellent for mathematical notation. Here's the quadratic formula:
\begin{equation}
    x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
\end{equation}

\section{Lists}
\subsection{Itemized List}
\begin{itemize}
    \item First item
    \item Second item
    \item Third item
\end{itemize}

\subsection{Numbered List}
\begin{enumerate}
    \item Edit this file in your IDE
    \item Save to trigger auto-compilation
    \item View the PDF in your browser
\end{enumerate}

\section{Text Formatting}
You can make text \textbf{bold}, \textit{italic}, or \underline{underlined}.

\section{Conclusion}
This sample document shows basic LaTeX features. Feel free to modify and experiment!

\end{document}
EOL
            echo -e "${GREEN}✓${NC} Sample project created at papers/sample-paper/"
        fi
    else
        echo -e "${GREEN}✓${NC} Sample project already exists"
    fi
}

# Main setup flow
main() {
    echo -e "${YELLOW}Starting setup process...${NC}"
    echo ""
    
    # Check prerequisites
    SETUP_FAILED=false
    
    check_node || SETUP_FAILED=true
    echo ""
    
    check_pnpm || SETUP_FAILED=true
    echo ""
    
    check_latex || SETUP_FAILED=true
    echo ""
    
    if [ "$SETUP_FAILED" = true ]; then
        echo -e "${RED}Setup incomplete. Please install missing dependencies and run this script again.${NC}"
        exit 1
    fi
    
    # Optional steps
    install_latex_packages
    echo ""
    
    install_dependencies
    echo ""
    
    create_sample_project
    echo ""
    
    # Success message
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}║                    Setup Complete! 🎉                         ║${NC}"
    echo -e "${GREEN}║                                                               ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Start the development server: ${BLUE}pnpm dev${NC}"
    echo "  2. Open your browser at: ${BLUE}http://localhost:3000${NC}"
    echo "  3. Edit LaTeX files in the ${BLUE}papers/${NC} directory"
    echo ""
    echo "Happy writing! 📝"
}

# Run main function
main