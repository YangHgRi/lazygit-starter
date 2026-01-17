import * as vscode from "vscode";
import * as path from "path";
import * as pty from "node-pty";

export class LazygitPanel {
  public static readonly viewType = "lazygit";
  private _panel: vscode.WebviewPanel;
  private _ptyProcess: pty.IPty;
  private _disposables: vscode.Disposable[] = [];
  private _isWebviewReady = false;
  private _dataBuffer: string[] = [];

  public static createOrShow(context: vscode.ExtensionContext, cwd: string) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    const panel = vscode.window.createWebviewPanel(
      LazygitPanel.viewType,
      `Lazygit: ${path.basename(cwd)}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );

    // Persist the state (CWD) so it can be recovered after VSCode restart
    panel.webview.postMessage({ command: "set-state", state: { cwd } });

    return new LazygitPanel(panel, context.extensionUri, cwd);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, cwd: string) {
    return new LazygitPanel(panel, extensionUri, cwd);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, cwd: string) {
    this._panel = panel;

    // Launch lazygit process directly to ensure proper mouse and terminal control
    const shell = process.platform === "win32" ? "lazygit.exe" : "lazygit";

    try {
      this._ptyProcess = pty.spawn(shell, [], {
        name: "xterm-256color", // Use 256color for better compatibility and mouse support
        cols: 80,
        rows: 24,
        cwd: cwd,
        env: process.env as any,
      });
    } catch (err) {
      // Fallback to shell if lazygit isn't in PATH directly
      const fallbackShell = process.platform === "win32" ? "cmd.exe" : "bash";
      this._ptyProcess = pty.spawn(fallbackShell, [], {
        name: "xterm-256color",
        cols: 80,
        rows: 24,
        cwd: cwd,
        env: process.env as any,
      });
      this._ptyProcess.write("lazygit\r");
    }

    // Set up webview HTML
    this._panel.webview.html = this._getHtmlForWebview();

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "ready":
            this._isWebviewReady = true;
            // Flush buffered data
            while (this._dataBuffer.length > 0) {
              const data = this._dataBuffer.shift();
              this._panel.webview.postMessage({ command: "data", data });
            }
            break;
          case "data":
            this._ptyProcess.write(message.data);
            break;
          case "resize":
            this._ptyProcess.resize(message.cols, message.rows);
            break;
        }
      },
      null,
      this._disposables,
    );

    // Send data from pty to webview
    this._ptyProcess.onData((data) => {
      if (this._isWebviewReady) {
        this._panel.webview.postMessage({ command: "data", data });
      } else {
        this._dataBuffer.push(data);
      }
    });

    // Clean up on close
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    this._ptyProcess.kill();
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _getHtmlForWebview() {
    return `<!DOCTYPE html>
  	<html lang="en">
  	<head>
  		<meta charset="UTF-8">
  		<meta name="viewport" content="width=device-width, initial-scale=1.0">
  		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css" />
  		<script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
  		<script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
  		<style>
  			body { margin: 0; padding: 0; background-color: var(--vscode-editor-background); overflow: hidden; }
  			#terminal { width: 100vw; height: 100vh; }
  		</style>
  	</head>
  	<body>
  		<div id="terminal"></div>
  		<script>
  			const vscode = acquireVsCodeApi();
  			
  			// Get VSCode theme colors
  			const style = getComputedStyle(document.documentElement);
  			const background = style.getPropertyValue('--vscode-editor-background').trim();
  			const foreground = style.getPropertyValue('--vscode-editor-foreground').trim();
  			const cursor = style.getPropertyValue('--vscode-terminal-cursor-foreground').trim();

  			const term = new Terminal({
  				cursorBlink: true,
  				allowProposedApi: true,
  				macOptionIsMeta: true,
  				fontFamily: style.getPropertyValue('--vscode-editor-font-family').trim() || 'Consolas, "Courier New", monospace',
  				fontSize: parseInt(style.getPropertyValue('--vscode-editor-font-size').trim()) || 14,
  				theme: {
  					background: background,
  					foreground: foreground,
  					cursor: cursor
  				}
  			});

  			const fitAddon = new FitAddon.FitAddon();
  			term.loadAddon(fitAddon);
  			term.open(document.getElementById('terminal'));
  			
  			// Debounced resize
  			let resizeTimeout;
  			function handleResize() {
  				fitAddon.fit();
  				vscode.postMessage({
  					command: 'resize',
  					cols: term.cols,
  					rows: term.rows
  				});
  			}

  			window.addEventListener('resize', () => {
  				clearTimeout(resizeTimeout);
  				resizeTimeout = setTimeout(handleResize, 100);
  			});

  			term.onData(data => {
  				vscode.postMessage({ command: 'data', data });
  			});

  			window.addEventListener('message', event => {
  				const message = event.data;
  				if (message.command === 'data') {
  					term.write(message.data);
  				} else if (message.command === 'set-state') {
  					vscode.setState(message.state);
  				}
  			});

  			// Initial fit and state sync
  			handleResize();

  			// Signal that webview is ready to receive data
  			vscode.postMessage({ command: 'ready' });
  		</script>
  	</body>
  	</html>`;
  }
}
