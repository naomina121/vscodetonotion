import * as vscode from 'vscode';
import { archivePage, fetchPages } from './utils/notion';
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
      vscode.commands.executeCommand('vscodetonotion.refreshEntry');
    }
  );

  // Notionの一覧ページを更新する
  let refresh = vscode.commands.registerCommand(
    'vscodetonotion.refreshEntry',
    async () => {
      // ページ一覧を表示させる。
      const { results: pages } = await fetchPages({});

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
    }
  );

  // Notionのページを編集する
  let notionEdit = vscode.commands.registerCommand(
    'vscodetonotion.editEntry',
    async (element: vscode.TreeItem) => {
      if (element) {
        vscode.window.showInformationMessage(`エディタが立ち上がります。`, {
          modal: true,
        });
        // ページのタイトルを取得
        const pageTitle = element.label;
        const { results: pages } = await fetchPages({});
      }
    }
  );

  // Notionのページを新規追加する
  let notionAdd = vscode.commands.registerCommand(
    'vscodetonotion.addEntry',
    async () => {}
  );

  // Notionのページを削除する
  let notionDelete = vscode.commands.registerCommand(
    'vscodetonotion.deleteEntry',
    async (element: vscode.TreeItem) => {
      if (element) {
        const message = await vscode.window.showInformationMessage(
          `${element.label}を削除しますが、本当に、よろしいですか？`,
          { modal: true },

          { title: '削除しない', isCloseAffordance: false },
          { title: '削除する', isCloseAffordance: true }
        );

        if (message?.title === '削除しない' || message === undefined) {
          // "削除しない"をクリックした場合
          const test = await vscode.window.showInformationMessage(
            '削除しませんでした',
            {
              modal: true,
            }
          );
        } else if (message.title === '削除する' || message === undefined) {
          // "削除する"をクリックした場合
          // ページのタイトルを取得
          const pageTitle = element.label;
          // ページタイトルからページIDを取得
          const { results: pages } = await fetchPages({
            title: String(pageTitle),
          });
          // ページIDを取得
          const pageId = pages[0].id;
          // ページを削除
          await archivePage(pageId);
          // ページを更新
          vscode.commands.executeCommand('vscodetonotion.refreshEntry');
          // メッセージを表示
          const test = await vscode.window.showInformationMessage(
            '該当のページを削除しました',
            {
              modal: true,
            }
          );
        }
      }
    }
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
  context.subscriptions.push(notionEdit);
  context.subscriptions.push(settigns);
}
export function deactivate() {}
