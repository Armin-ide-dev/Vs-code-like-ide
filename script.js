require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs' } });
require(['vs/editor/editor.main'], () => {
  class WebIDE {
    constructor() {
      this.fileExplorer = document.getElementById('fileExplorer');
      this.newFileBtn = document.getElementById('newFileBtn');
      this.newFolderBtn = document.getElementById('newFolderBtn');
      this.themeSelect = document.getElementById('themeSelect');
      this.runBtn = document.getElementById('runBtn');
      this.previewFrame = document.getElementById('previewFrame');
      this.fontSizeSelect = document.getElementById('fontSizeSelect');
      this.tabSizeSelect = document.getElementById('tabSizeSelect');
      this.wordWrapCheckbox = document.getElementById('wordWrapCheckbox');
      this.lineNumbersCheckbox = document.getElementById('lineNumbersCheckbox');
      this.minimapCheckbox = document.getElementById('minimapCheckbox');
      this.renderWhitespaceCheckbox = document.getElementById('renderWhitespaceCheckbox');
      this.editor = null;
      this.files = this.loadFiles();
      this.folders = this.loadFolders();
      this.currentFile = 'index.html';
      this.initEditor();
      this.defineCustomThemes();
      this.addEventListeners();
      this.renderFileExplorer();
      this.updatePreview();
    }

    loadFiles() {
      try {
        return JSON.parse(localStorage.getItem('ideFiles')) || {
          'index.html': { content: '<h1>Hello, World!</h1>', type: 'html' },
          'styles.css': { content: 'body { font-family: Arial; }', type: 'css' },
          'script.js': { content: 'console.log("Hello, World!");', type: 'javascript' }
        };
      } catch (e) {
        console.error('Failed to load files:', e);
        return {
          'index.html': { content: '<h1>Hello, World!</h1>', type: 'html' },
          'styles.css': { content: 'body { font-family: Arial; }', type: 'css' },
          'script.js': { content: 'console.log("Hello, World!");', type: 'javascript' },
        };
      }
    }

    loadFolders() {
      try {
        return JSON.parse(localStorage.getItem('ideFolders')) || { 'src': ['index.html', 'styles.css', 'script.js'] };
      } catch (e) {
        console.error('Failed to load folders:', e);
        return { 'src': ['index.html', 'styles.css', 'script.js'] };
      }
    }

    defineCustomThemes() {
      try {
        // Solarized Dark
        monaco.editor.defineTheme('solarized-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: '', foreground: '#839496', background: '#002b36' },
            { token: 'comment', foreground: '#586e75' },
            { token: 'keyword', foreground: '#cb4b16' },
            { token: 'string', foreground: '#2aa198' }
          ],
          colors: {
            'editor.background': '#002b36',
            'editor.foreground': '#839496',
            'editor.lineHighlightBackground': '#073642'
          }
        });

        // Nord
        monaco.editor.defineTheme('nord', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: '', foreground: '#ECEFF4', background: '#2E3440' },
            { token: 'comment', foreground: '#4C566A' },
            { token: 'keyword', foreground: '#81A1C1' },
            { token: 'string', foreground: '#A3BE8C' }
          ],
          colors: {
            'editor.background': '#2E3440',
            'editor.foreground': '#ECEFF4',
            'editor.lineHighlightBackground': '#3B4252'
          }
        });

        // Monokai
        monaco.editor.defineTheme('monokai', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: '', foreground: '#F8F8F2', background: '#272822' },
            { token: 'comment', foreground: '#75715E' },
            { token: 'keyword', foreground: '#F92672' },
            { token: 'string', foreground: '#E6DB74' }
          ],
          colors: {
            'editor.background': '#272822',
            'editor.foreground': '#F8F8F2',
            'editor.lineHighlightBackground': '#3E3D32'
          }
        });

        // Dracula
        monaco.editor.defineTheme('dracula', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: '', foreground: '#F8F8F2', background: '#282A36' },
            { token: 'comment', foreground: '#6272A4' },
            { token: 'keyword', foreground: '#FF79C6' },
            { token: 'string', foreground: '#F1FA8C' }
          ],
          colors: {
            'editor.background': '#282A36',
            'editor.foreground': '#F8F8F2',
            'editor.lineHighlightBackground': '#44475A'
          }
        });

        // GitHub
        monaco.editor.defineTheme('github', {
          base: 'vs',
          inherit: true,
          rules: [
            { token: '', foreground: '#24292E', background: '#FFFFFF' },
            { token: 'comment', foreground: '#6A737D' },
            { token: 'keyword', foreground: '#D73A49' },
            { token: 'string', foreground: '#032F62' }
          ],
          colors: {
            'editor.background': '#FFFFFF',
            'editor.foreground': '#24292E',
            'editor.lineHighlightBackground': '#F6F8FA'
          }
        });
      } catch (e) {
        console.error('Failed to define themes:', e);
      }
    }

    initEditor() {
      try {
        if (!document.getElementById('editor')) {
          console.error('Editor container not found');
          return;
        }
        this.editor = monaco.editor.create(document.getElementById('editor'), {
          value: this.files[this.currentFile]?.content || '',
          language: this.getLanguage(this.currentFile),
          theme: this.themeSelect.value,
          automaticLayout: true,
          suggest: { suggestions: this.getSuggestions() },
          wordWrap: 'on',
          fontSize: 14,
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          minimap: { enabled: true },
          renderWhitespace: 'none'
        });

        this.editor.onDidChangeModelContent(() => {
          if (this.files[this.currentFile]) {
            this.files[this.currentFile].content = this.editor.getValue();
            this.saveFiles();
            if (this.currentFile.endsWith('.html')) this.updatePreview();
          }
        });
      } catch (e) {
        console.error('Editor initialization failed:', e);
      }
    }

    getLanguage(fileName) {
      try {
        const ext = fileName.split('.').pop().toLowerCase();
        const langMap = {
          html: 'html',
          css: 'css',
          js: 'javascript',
          ts: 'typescript',
          py: 'python',
          php: 'php'
        };
        return langMap[ext] || 'plaintext';
      } catch (e) {
        console.error('Failed to get language:', e);
        return 'plaintext';
      }
    }

    getSuggestions() {
      return [
        { label: 'console.log', kind: monaco.languages.CompletionItemKind.Function, insertText: 'console.log(${1});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Log to console', detail: 'JavaScript' },
        { label: 'div', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '<div>${1}</div>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'HTML div element', detail: 'HTML' },
        { label: 'color', kind: monaco.languages.CompletionItemKind.Property, insertText: 'color: ${1};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'CSS color property', detail: 'CSS' },
        { label: 'print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print(${1})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'Python print function', detail: 'Python' },
        { label: 'echo', kind: monaco.languages.CompletionItemKind.Function, insertText: 'echo ${1};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'PHP echo statement', detail: 'PHP' },
        { label: 'interface', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'interface ${1} {\n\t${2}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: 'TypeScript interface', detail: 'TypeScript' }
      ];
    }

    addEventListeners() {
      try {
        this.newFileBtn.addEventListener('click', () => this.createNewFile());
        this.newFolderBtn.addEventListener('click', () => this.createNewFolder());
        this.themeSelect.addEventListener('change', () => {
          try {
            monaco.editor.setTheme(this.themeSelect.value);
          } catch (e) {
            console.error('Theme change failed:', e);
          }
        });
        this.runBtn.addEventListener('click', () => this.updatePreview());
        this.fileExplorer.addEventListener('click', (e) => {
          const target = e.target.closest('.file-item, button');
          if (!target) return;
          const file = target.dataset.file;
          const action = target.dataset.action;
          if (file && !action) {
            this.currentFile = file;
            this.editor.setValue(this.files[file]?.content || '');
            this.editor.getModel().updateOptions({ language: this.getLanguage(file) });
            this.renderFileExplorer();
            if (file.endsWith('.html')) this.updatePreview();
          } else if (action && file) {
            if (action === 'rename') this.renameFile(file);
            else if (action === 'delete') this.deleteFile(file);
          }
        });
        this.fontSizeSelect.addEventListener('change', () => {
          this.editor.updateOptions({ fontSize: parseInt(this.fontSizeSelect.value) });
        });
        this.tabSizeSelect.addEventListener('change', () => {
          this.editor.getModel().updateOptions({ tabSize: parseInt(this.tabSizeSelect.value) });
        });
        this.wordWrapCheckbox.addEventListener('change', () => {
          this.editor.updateOptions({ wordWrap: this.wordWrapCheckbox.checked ? 'on' : 'off' });
        });
        this.lineNumbersCheckbox.addEventListener('change', () => {
          this.editor.updateOptions({ lineNumbers: this.lineNumbersCheckbox.checked ? 'on' : 'off' });
        });
        this.minimapCheckbox.addEventListener('change', () => {
          this.editor.updateOptions({ minimap: { enabled: this.minimapCheckbox.checked } });
        });
        this.renderWhitespaceCheckbox.addEventListener('change', () => {
          this.editor.updateOptions({ renderWhitespace: this.renderWhitespaceCheckbox.checked ? 'all' : 'none' });
        });
      } catch (e) {
        console.error('Failed to add event listeners:', e);
      }
    }

    createNewFile() {
      try {
        const name = prompt('Enter file name (e.g., file.html, style.css, script.js):');
        if (!name || this.files[name]) {
          alert('File name invalid or already exists');
          return;
        }
        const ext = name.split('.').pop().toLowerCase();
        if (!['html', 'css', 'js', 'ts', 'py', 'php'].includes(ext)) {
          alert('Supported extensions: .html, .css, .js, .ts, .py, .php');
          return;
        }
        this.files[name] = { content: '', type: this.getLanguage(name) };
        const folder = prompt('Enter folder name (or leave blank for root):') || 'src';
        if (!this.folders[folder]) this.folders[folder] = [];
        this.folders[folder].push(name);
        this.saveFiles();
        this.renderFileExplorer();
      } catch (e) {
        console.error('Failed to create new file:', e);
      }
    }

    createNewFolder() {
      try {
        const name = prompt('Enter folder name:');
        if (!name || this.folders[name]) {
          alert('Folder name invalid or already exists');
          return;
        }
        this.folders[name] = [];
        this.saveFiles();
        this.renderFileExplorer();
      } catch (e) {
        console.error('Failed to create new folder:', e);
      }
    }

    deleteFile(file) {
      try {
        if (!confirm(`Delete ${file}?`)) return;
        delete this.files[file];
        for (const folder in this.folders) {
          this.folders[folder] = this.folders[folder].filter(f => f !== file);
          if (this.folders[folder].length === 0) delete this.folders[folder];
        }
        if (this.currentFile === file) {
          this.currentFile = Object.keys(this.files)[0] || '';
          if (this.currentFile) {
            this.editor.setValue(this.files[this.currentFile].content);
            this.editor.getModel().updateOptions({ language: this.getLanguage(this.currentFile) });
          } else {
            this.editor.setValue('');
          }
        }
        this.saveFiles();
        this.renderFileExplorer();
        this.updatePreview();
      } catch (e) {
        console.error('Failed to delete file:', e);
      }
    }

    renameFile(file) {
      try {
        const newName = prompt('Enter new file name:', file);
        if (!newName || this.files[newName] || newName === file) {
          alert('New name invalid or already exists');
          return;
        }
        const ext = newName.split('.').pop().toLowerCase();
        if (!['html', 'css', 'js', 'ts', 'py', 'php'].includes(ext)) {
          alert('Supported extensions: .html, .css, .js, .ts, .py, .php');
          return;
        }
        this.files[newName] = { ...this.files[file], type: this.getLanguage(newName) };
        for (const folder in this.folders) {
          const index = this.folders[folder].indexOf(file);
          if (index !== -1) this.folders[folder][index] = newName;
        }
        delete this.files[file];
        if (this.currentFile === file) {
          this.currentFile = newName;
          this.editor.getModel().updateOptions({ language: this.getLanguage(newName) });
        }
        this.saveFiles();
        this.renderFileExplorer();
      } catch (e) {
        console.error('Failed to rename file:', e);
      }
    }

    renderFileExplorer() {
      try {
        this.fileExplorer.innerHTML = '';
        for (const folder in this.folders) {
          const folderElement = document.createElement('div');
          folderElement.className = 'folder-item';
          folderElement.innerHTML = `<i class="fas fa-folder"></i> ${folder}`;
          this.fileExplorer.appendChild(folderElement);
          this.folders[folder].forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = `file-item ${this.currentFile === file ? 'active' : ''}`;
            fileElement.dataset.file = file;
            let icon = '';
            if (file.endsWith('.html')) icon = '<i class="fab fa-html5"></i>';
            else if (file.endsWith('.css')) icon = '<i class="fab fa-css3-alt"></i>';
            else if (file.endsWith('.js')) icon = '<i class="fab fa-js"></i>';
            else if (file.endsWith('.ts')) icon = '<i class="fas fa-code"></i>';
            else if (file.endsWith('.py')) icon = '<i class="fab fa-python"></i>';
            else if (file.endsWith('.php')) icon = '<i class="fab fa-php"></i>';
            fileElement.innerHTML = `
              ${icon} ${file}
              <span>
                <button data-action="rename" data-file="${file}">Rename</button>
                <button data-action="delete" data-file="${file}">Delete</button>
              </span>
            `;
            this.fileExplorer.appendChild(fileElement);
          });
        }
      } catch (e) {
        console.error('Failed to render file explorer:', e);
      }
    }

    saveFiles() {
      try {
        localStorage.setItem('ideFiles', JSON.stringify(this.files));
        localStorage.setItem('ideFolders', JSON.stringify(this.folders));
      } catch (e) {
        console.error('Failed to save files:', e);
      }
    }

    updatePreview() {
      try {
        if (!this.currentFile.endsWith('.html')) return;
        let htmlContent = this.files[this.currentFile]?.content || '';
        for (const file in this.files) {
          if (file.endsWith('.css')) {
            htmlContent = htmlContent.replace('</head>', `<style>${this.files[file].content}</style></head>`);
          } else if (file.endsWith('.js')) {
            htmlContent = htmlContent.replace('</body>', `<script>${this.files[file].content}</script></body>`);
          }
        }
        const blob = new Blob([htmlContent], { type: 'text/html' });
        this.previewFrame.src = URL.createObjectURL(blob);
      } catch (e) {
        console.error('Preview update failed:', e);
      }
    }
  }

  try {
    window.ide = new WebIDE();
  } catch (e) {
    console.error('Failed to initialize Web IDE:', e);
  }
});
