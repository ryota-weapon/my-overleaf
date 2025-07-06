# LaTeX Web Editor

A local-first LaTeX editor with web preview, designed for IDE-based editing with AI assistance (Copilot, Claude Code) and real-time PDF preview in browser.

## Features

- 📝 **IDE Integration**: Edit LaTeX files in your favorite IDE with full AI assistance
- 🔄 **Auto-compilation**: Automatic PDF generation when `.tex` files change
- 🌐 **Web Preview**: Real-time PDF preview in browser with zoom/navigation
- 📁 **Project Management**: Simple project listing and organization
- 🚨 **Error Reporting**: Compilation error display with detailed logs

## Prerequisites

### Required Dependencies

1. **Node.js & pnpm**
   ```bash
   # Install pnpm if not already installed
   npm install -g pnpm
   ```

2. **LaTeX Distribution**
   
   **Option A: BasicTeX (Recommended - Lightweight)**
   ```bash
   # Install BasicTeX via Homebrew
   brew install --cask basictex
   
   # Update PATH (add to your shell profile)
   export PATH="/Library/TeX/texbin:$PATH"
   
   # Install essential packages
   sudo tlmgr update --self
   sudo tlmgr install collection-fontsrecommended
   sudo tlmgr install collection-latex
   sudo tlmgr install amsmath amsfonts amssymb geometry
   ```
   
   **Option B: Full MacTeX (Complete but Large ~4GB)**
   ```bash
   brew install --cask mactex
   ```

3. **Verify LaTeX Installation**
   ```bash
   which pdflatex
   # Should output: /Library/TeX/texbin/pdflatex
   
   pdflatex --version
   # Should show TeX Live version
   ```

## Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository>
   cd my-overleaf
   pnpm install
   ```

2. **Start development server**
   ```bash
   pnpm dev
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

## Usage

### Creating Projects

1. Create a new directory in `papers/`:
   ```bash
   mkdir papers/my-paper
   ```

2. Add LaTeX files:
   ```bash
   # Create main.tex or any .tex file
   touch papers/my-paper/main.tex
   ```

3. The project will automatically appear on the web interface

### Editing Workflow

1. **Edit in IDE**: Open `.tex` files in VS Code or your preferred editor
2. **AI Assistance**: Use GitHub Copilot, Claude Code, or other AI tools while editing
3. **Auto-compile**: Save files to trigger automatic PDF compilation
4. **View Results**: Check the web interface for updated PDF and any compilation errors

### File Structure

```
my-overleaf/
├── papers/                 # Your LaTeX projects
│   ├── project1/
│   │   ├── main.tex
│   │   ├── sections/
│   │   └── build/         # Generated PDFs and logs
│   └── project2/
├── src/                   # Next.js application
└── templates/            # LaTeX templates (optional)
```

## Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes for compilation and file serving
- **PDF Viewer**: react-pdf with PDF.js
- **File Watching**: chokidar for real-time file monitoring
- **LaTeX Compilation**: Local pdflatex via child_process

## Troubleshooting

### Common Issues

1. **"pdflatex: command not found"**
   - Ensure LaTeX is installed and in PATH
   - Restart terminal after installation
   - Check: `which pdflatex`

2. **Font/Package errors**
   - Install missing packages: `sudo tlmgr install <package-name>`
   - Update TeX Live: `sudo tlmgr update --all`

3. **Permission errors**
   - Ensure write permissions in `papers/` directory
   - Check build directory permissions

4. **Compilation fails silently**
   - Check browser console for errors
   - Verify `.tex` file syntax
   - Check compilation logs in web interface

### Package Installation

For additional LaTeX packages:
```bash
# Search for packages
tlmgr search <package-name>

# Install packages
sudo tlmgr install <package-name>

# Update all packages
sudo tlmgr update --all
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with sample LaTeX documents
5. Submit a pull request

## License

MIT License
