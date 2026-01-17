import * as vscode from "vscode";
import * as path from "path";
import * as pty from "node-pty";
import * as fs from "fs";

export class LazygitPanel {
  public static readonly viewType = "lazygit";
  private _panel: vscode.WebviewPanel;
  private _ptyProcess: pty.IPty;
  private _disposables: vscode.Disposable[] = [];
  private _isWebviewReady = false;
  private _dataBuffer: string[] = [];
  private _extensionUri: vscode.Uri;

  public static createOrShow(context: vscode.ExtensionContext, cwd: string) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    const panel = vscode.window.createWebviewPanel(
      LazygitPanel.viewType,
      `${path.basename(cwd)}`,
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, "node_modules", "xterm")),
          vscode.Uri.file(path.join(context.extensionPath, "node_modules", "xterm-addon-fit")),
        ],
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
    this._extensionUri = extensionUri;

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
    const webview = this._panel.webview;

    // Local path to assets
    const xtermCss = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "node_modules", "xterm", "css", "xterm.css"),
    );
    const xtermJs = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "node_modules", "xterm", "lib", "xterm.js"),
    );
    const xtermFitJs = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "node_modules", "xterm-addon-fit", "lib", "xterm-addon-fit.js"),
    );

    const htmlPath = vscode.Uri.joinPath(this._extensionUri, "src", "webview", "lazygit.html");
    let html = fs.readFileSync(htmlPath.fsPath, "utf8");

    html = html.replace("{{xtermCss}}", xtermCss.toString());
    html = html.replace("{{xtermJs}}", xtermJs.toString());
    html = html.replace("{{xtermFitJs}}", xtermFitJs.toString());

    return html;
  }
}
