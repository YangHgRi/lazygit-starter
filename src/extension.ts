import * as vscode from "vscode";
import { LazygitPanel } from "./lazygitPanel";

export function activate(context: vscode.ExtensionContext) {
  // 1. Register the command to open Lazygit in a Webview
  context.subscriptions.push(
    vscode.commands.registerCommand("lazygit-starter.openLazygit", (uri: vscode.Uri) => {
      if (!uri) {
        vscode.window.showErrorMessage("Please right-click a folder to open Lazygit.");
        return;
      }
      LazygitPanel.createOrShow(context, uri.fsPath);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("lazygit-starter.refresh", () => {
      LazygitPanel.currentPanel?.refresh();
    }),
  );

  // 2. Register the serializer for restoration after VSCode restart
  // This is the key to stable tab restoration
  if (vscode.window.registerWebviewPanelSerializer) {
    vscode.window.registerWebviewPanelSerializer(LazygitPanel.viewType, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: { cwd?: string }) {
        // VSCode restores the 'state' which we set via vscode.setState() in the webview
        const cwd = state?.cwd;
        if (cwd) {
          LazygitPanel.revive(webviewPanel, context.extensionUri, cwd);
        } else {
          // Fallback or cleanup if no state
          webviewPanel.dispose();
        }
      },
    });
  }
}

export function deactivate() {}
