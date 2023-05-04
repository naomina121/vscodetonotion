import * as vscode from 'vscode';
import { fetchPages } from './utils/notion';
import { postTitle } from './utils/data';

export function activate(context: vscode.ExtensionContext) {
  // Notion一覧ページを表示する
  let showPage = vscode.commands.registerCommand(
    'vscodetonotion.notionToConection',
    async () => {
      // メッセージを表示
      const message = vscode.window.showInformationMessage(
        'Notion一覧を開きます',
        {
          modal: true,
        }
      );
      // ページ一覧を表示させる。
      const { results: pages } = await fetchPages();

      const element = 'package-openPages';

      const treeView = await vscode.window.createTreeView(element, {
        canSelectMany: true,
        treeDataProvider: {
          getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
            return element;
          },

          getChildren(element?: vscode.TreeItem): vscode.TreeItem[] {
            return pages.map(
              (page: any) => new vscode.TreeItem(postTitle(page))
            );
          },
        },
      });

      const showDisposable = vscode.commands.registerCommand(
        'vscodetonotion.show',
        (element: vscode.TreeItem) => {
          if (element) {
            vscode.window.showInformationMessage(`エディタが立ち上がります。`, {
              modal: true,
            });
          }
        }
      );

      context.subscriptions.push(showDisposable);
    }
  );

  // Notionの一覧ページを更新する
  let refresh = vscode.commands.registerCommand(
    'vscodetonotion.refreshEntry',
    async () => {}
  );

  // Notionのページを新規追加する
  let notionAdd = vscode.commands.registerCommand(
    'vscodetonotion.addEntry',
    async () => {}
  );

  // Notionのページを削除する
  let notionDelete = vscode.commands.registerCommand(
    'vscodetonotion.deleteEntry',
    async () => {}
  );

  // Notionの設定ページを表示する
  let settigns = vscode.commands.registerCommand(
    'vscodetonotion.settings',
    async () => {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'NotionとVSCodeを接続する'
      );
    }
  );

  context.subscriptions.push(showPage);
  context.subscriptions.push(settigns);
}
export function deactivate() {}
