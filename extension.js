const vscode = require('vscode');
const { buildPreviewHtml } = require('./preview');

const previewType = 'bbcode.preview.editor';

function openPreviewToSide() {
  const editor = vscode.window.activeTextEditor;

  if (!editor || editor.document.languageId !== 'bbcode') {
    vscode.window.showInformationMessage('Open a .bbcode file to show its preview.');
    return;
  }

  return vscode.commands.executeCommand(
    'vscode.openWith', editor.document.uri, previewType,
    { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true }
  );
}

function resolveCustomTextEditor(document, panel) {
  panel.webview.options = { enableScripts: false, localResourceRoots: [] };
  const update = () => {
    panel.webview.html = buildPreviewHtml(document.getText());
  };

  update();

  const changeSubscription = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document === document) {
      update();
    }
  });

  panel.onDidDispose(() => changeSubscription.dispose());
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(previewType, { resolveCustomTextEditor },
      { supportsMultipleEditorsPerDocument: true }),
    vscode.commands.registerCommand('bbcode.preview', openPreviewToSide),
    vscode.commands.registerCommand('bbcode.reopenAsPreview', () =>
      vscode.commands.executeCommand('reopenActiveEditorWith', previewType)),
    vscode.commands.registerCommand('bbcode.reopenAsSource', () =>
      vscode.commands.executeCommand('reopenActiveEditorWith', 'default')),
    vscode.commands.registerCommand('bbcode.togglePreview', () =>
      vscode.commands.executeCommand('reopenActiveEditorWith',
        vscode.window.activeTextEditor ? previewType : 'default'))
  );
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
