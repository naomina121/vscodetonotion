import * as vscode from 'vscode';
import {
  archivePage,
  fetchPages,
  n2m,
  retrievePageProperties,
} from './utils/notion';
import { getPropertiesRichText, postTitle } from './utils/data';

export function activate(context: vscode.ExtensionContext) {
  // test
  let test = vscode.commands.registerCommand(
    'vscodetonotion.test',
    async () => {
      // ページ一覧を表示させる。
      const { results: pages } = await fetchPages({});

      // Pageを取得
      const page = pages[0];

      // ページのプロパティを取得
      const properties = await retrievePageProperties(page.id);

      // ページのキーを配列に格納
      const keys = Object.keys(properties);

      // titleプロパティを取得し、titleを抽出
      for (const [key, value] of Object.entries(properties)) {
        if (value.type === 'title') {
          await vscode.window.showInformationMessage(
            `title: ${value.title[0].plain_text}`,
            {
              modal: true,
            }
          );
        }

        // ページのキーを表示
        const key = await vscode.window.showQuickPick(keys);

        // メッセージを表示
        const message = await vscode.window.showInformationMessage(
          'Notion一覧を開きます',
          {
            modal: true,
          }
        );
      }
    }
  );

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

      // ツリービューを表示させる。
      const element = 'package-openPages';

      const treeView = vscode.window.createTreeView(element, {
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
        const { results: pages } = await fetchPages({
          title: String(pageTitle),
        });

        // ページIDを取得
        const pageId = pages[0].id;

        // ページのプロパティを取得
        const properties = await retrievePageProperties(pageId);

        // ページのキーを配列に格納
        const keys = Object.keys(properties);

        // ページの値を配列に格納
        const values = Object.values(properties);

        // ページのプロパティをMarkdownのコメントアウトに変換
        const mdProperties = ['---'];

        // プロパティを出力
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const value = values[i];
          const type = value.type;
          if (type === 'tags') {
            // タグを配列に格納
            const tags = [];
            for (const [tag, i] of value.tags.multi_select) {
              tags.push(tag.name);
            }
            mdProperties.push(`${key}: ${tags.join(', ')}`);
          } else if (type === 'title') {
            mdProperties.push(`${key}: ${getPropertiesRichText(value.title)}`);
          } else if (type === 'rich_text') {
            mdProperties.push(
              `${key}: ${getPropertiesRichText(value.rich_text)}`
            );
          }
        }
        mdProperties.push('---');

        // プロパティをMarkdownに変換
        const mdPropertiesString = mdProperties.join('\n');

        // ブロックを取得
        const mdblocks = await n2m.pageToMarkdown(pageId);

        // マークダウンに変換
        const markdown = n2m.toMarkdownString(mdblocks);

        // マークダウンにプロパティを追加
        const markdownWithProperties = `${mdPropertiesString}\n${markdown}`;

        // マークダウンをエディタに表示
        const document = await vscode.workspace.openTextDocument({
          language: 'markdown',
          content: markdownWithProperties,
        });
        await vscode.window.showTextDocument(document, { preview: false });
      }
    }
  );

  // Notionのページを新規追加する
  let notionAdd = vscode.commands.registerCommand(
    'vscodetonotion.addEntry',
    async () => {
      const messege = await vscode.window.showInformationMessage(
        `新規ページを追加します`,
        {
          modal: true,
        }
      );
    }
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
          const deleteMesseage = await vscode.window.showInformationMessage(
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
  context.subscriptions.push(test);
}
export function deactivate() {}
