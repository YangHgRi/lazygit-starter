import * as vscode from "vscode";
import * as path from "path";
import * as pty from "node-pty";
import * as fs from "fs";

interface LazygitState {
  cwd: string;
}

interface WebviewMessage {
  command: "ready" | "data" | "resize" | "set-state";
  data?: string;
  cols?: number;
  rows?: number;
  state?: LazygitState;
}

export class LazygitPanel {
  public static readonly viewType = "lazygit";
  public static currentPanel: LazygitPanel | undefined;
  private _panel: vscode.WebviewPanel;
  private _ptyProcess: pty.IPty | undefined;
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
          vscode.Uri.file(path.join(context.extensionPath, "node_modules", "xterm-addon-webgl")),
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
    this._panel.iconPath = new vscode.ThemeIcon("git-branch");

    LazygitPanel.currentPanel = this;

    // Launch lazygit process directly to ensure proper mouse and terminal control
    const shell = process.platform === "win32" ? "lazygit.exe" : "lazygit";
    const env = {
      ...process.env,
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
      LANG: "en_US.UTF-8",
      LC_ALL: "en_US.UTF-8",
    } as { [key: string]: string };

    try {
      this._ptyProcess = pty.spawn(shell, [], {
        name: "xterm-256color",
        cols: 80,
        rows: 24,
        cwd: cwd,
        useConpty: true,
        env,
      });
    } catch (err) {
      console.warn("Failed to spawn lazygit directly, falling back to shell", err);
      const fallbackShell = process.platform === "win32" ? "cmd.exe" : "bash";
      this._ptyProcess = pty.spawn(fallbackShell, [], {
        name: "xterm-256color",
        cols: 80,
        rows: 24,
        cwd: cwd,
        useConpty: true,
        env,
      });
      this._ptyProcess.write("lazygit\r");
    }

    // Set up webview HTML
    this._panel.webview.html = this._getHtmlForWebview();

    // Handle messages from webview
    this._panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => {
        switch (message.command) {
          case "ready":
            this._isWebviewReady = true;
            // Flush buffered data
            while (this._dataBuffer.length > 0) {
              const data = this._dataBuffer.shift();
              if (data) {
                this._panel.webview.postMessage({ command: "data", data });
              }
            }
            break;
          case "data":
            if (message.data) {
              this._ptyProcess?.write(message.data);
            }
            break;
          case "resize":
            if (message.cols && message.rows) {
              this._ptyProcess?.resize(message.cols, message.rows);
            }
            break;
        }
      },
      undefined,
      this._disposables,
    );

    // Send data from pty to webview
    const dataListener = this._ptyProcess.onData((data) => {
      if (this._isWebviewReady) {
        this._panel.webview.postMessage({ command: "data", data });
      } else {
        this._dataBuffer.push(data);
      }
    });
    this._disposables.push({ dispose: () => dataListener.dispose() });

    // Handle process exit
    const exitListener = this._ptyProcess.onExit(() => {
      this.dispose();
    });
    this._disposables.push({ dispose: () => exitListener.dispose() });

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update context when focus changes
    this._panel.onDidChangeViewState(
      (e) => {
        vscode.commands.executeCommand("setContext", "lazygitActive", e.webviewPanel.active);
      },
      null,
      this._disposables,
    );

    // Set initial context
    vscode.commands.executeCommand("setContext", "lazygitActive", true);
  }

  public refresh() {
    this._panel.webview.postMessage({ command: "refresh" });
  }

  public dispose() {
    if (LazygitPanel.currentPanel === this) {
      LazygitPanel.currentPanel = undefined;
    }
    vscode.commands.executeCommand("setContext", "lazygitActive", false);
    if (this._ptyProcess) {
      this._ptyProcess.kill();
      this._ptyProcess = undefined;
    }
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
    const xtermWebglJs = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "node_modules", "xterm-addon-webgl", "lib", "xterm-addon-webgl.js"),
    );

    const htmlPath = vscode.Uri.joinPath(this._extensionUri, "src", "webview", "lazygit.html");
    let html = fs.readFileSync(htmlPath.fsPath, "utf8");

    html = html.replace("{{xtermCss}}", xtermCss.toString());
    html = html.replace("{{xtermJs}}", xtermJs.toString());
    html = html.replace("{{xtermFitJs}}", xtermFitJs.toString());
    html = html.replace("{{xtermWebglJs}}", xtermWebglJs.toString());

    return html;
  }
}
