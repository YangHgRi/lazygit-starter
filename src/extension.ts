import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand("lazygit-starter.openLazygit", (uri: vscode.Uri) => {
    if (!uri) {
      vscode.window.showErrorMessage("Please right-click a folder to open Lazygit.");
      return;
    }

    const folderPath = uri.fsPath;

    // Create a new terminal in the editor area with lazygit as the shell process
    const terminal = vscode.window.createTerminal({
      name: "Lazygit",
      cwd: folderPath,
      location: vscode.TerminalLocation.Editor,
      shellPath: "lazygit",
    });

    terminal.show();
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
