import * as vscode from 'vscode';

import {
  archivePage,
  createPage,
  fetchPages,
  getPropertiesTitle,
  n2m,
  openPreview,
  retrievePageProperties,
  updatePage,
} from './utils/notion';
import { convertPropertyToMarkdown } from './utils/data';
import { mdToBlocks } from './utils/mdToBlocks';
import { markdownToBlocks } from '@tryfabric/martian';

export function activate(context: vscode.ExtensionContext) {
  // Title のプロパティ名を取得するための変数
  let titleProperty: '';

  // Title以外のプロパティ名とタイプを取得するための変数
  let allProperty: any[] = [];

  // Notion一覧ページを表示する
  let showPage = vscode.commands.registerCommand(
    'vscodetonotion.notionToConection',
    async () => {
      const messege = await vscode.window.showInformationMessage(
        `Notionのページを表示します`,
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
      // 初期化
      allProperty = [];
      titleProperty = '';

      // ページ一覧を表示させる。
      let { results: pages } = await fetchPages({});

      // pagesが空の場合はエラーを返す
      if (pages.length === 0) {
        const messege = await vscode.window.showErrorMessage(
          `Notionのページが見つかりませんでした。`,
          {
            modal: true,
          }
        );
        return;
      }

      // ページIDから複数のタイトルプロパティを取得
      let titlesProperties = await Promise.all(
        pages.map((page: any) => getPropertiesTitle(page.id))
      );

      // ページのタイトルのプロパティ名を配列に格納
      let properties = titlesProperties.map((title: any) => title.key);

      // グローバル変数にタイトルのプロパティ名を格納
      titleProperty = properties[0];

      // 全プロパティを取得
      let allPropertyis: any = await retrievePageProperties(pages[0].id);

      let keys = Object.keys(allPropertyis);
      let values = Object.values(allPropertyis);

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value: any = values[i];
        allProperty.push({
          type: value.type,
          property: key,
        });
      }

      // ツリービューを表示させる。
      const element = 'package-openPages';
      let treeView = vscode.window.createTreeView(element, {
        canSelectMany: true,
        treeDataProvider: {
          getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
            return element;
          },

          async getChildren(
            element?: vscode.TreeItem
          ): Promise<vscode.TreeItem[]> {
            const children: vscode.TreeItem[] = [];

            for (let index = 0; index < titlesProperties.length; index++) {
              const treeItem = new vscode.TreeItem(
                titlesProperties[index].value,
                vscode.TreeItemCollapsibleState.None
              );

              treeItem.iconPath = new vscode.ThemeIcon('file');

              children.push(treeItem);
            }

            return children;
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
        const messege = await vscode.window.showInformationMessage(
          `エディタが立ち上がります。`,
          {
            modal: true,
          }
        );
        // ページのタイトルを取得
        const pageTitle = element.label;
        const { results: pages } = await fetchPages({
          title: String(pageTitle),
          property: titleProperty,
        });

        // ページIDを取得
        const pageId = pages[0].id;

        // ページのプロパティを取得
        const properties = await retrievePageProperties(pageId);

        // ページのプロパティをMarkdownのコメントアウトに変換
        const mdProperties = ['---'];

        // プロパティをMarkdownに変換
        for (const [key, value] of Object.entries(properties)) {
          const mdProperty = convertPropertyToMarkdown(key, value);
          if (mdProperty !== null) {
            mdProperties.push(mdProperty);
          }
        }

        // ページIDを含める
        mdProperties.push(`pageId: ${pageId}`);

        // 既存のファイルを更新するかどうか
        mdProperties.push('mdUpdate: true');
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
        // Notionのプレビュー画面を表示
        await openPreview();
      } else {
        vscode.window.showErrorMessage('エラーが発生しました。');
        return;
      }
    }
  );

  // Notionからマークダウンを更新する
  let updateMarkdown = vscode.commands.registerCommand(
    'vscodetonotion.updateMarkdown',
    async () => {
      const messege = await vscode.window.showInformationMessage(
        `Notionからマークダウンを更新します`,
        {
          modal: true,
        },
        { title: 'はい', isCloseAffordance: false },
        { title: 'いいえ', isCloseAffordance: false }
      );

      // 更新するかどうか確認
      if (messege === undefined || messege.title === 'いいえ') {
        return;
      }

      try {
        // マークダウンを開いているエディタを取得
        const editor = vscode.window.activeTextEditor;

        // マークダウンを開いているエディタがあるかどうか
        if (editor) {
          // マークダウンを開いているエディタのドキュメントを取得
          const document = editor.document;

          // マークダウンを開いているエディタのドキュメントのテキストを取得
          const oddMarkdown = document.getText();

          // マークダウンのテキストをデータとコンテンツに変換
          const dataWithContent = await mdToBlocks(String(oddMarkdown));

          // マークダウンからページIDを取得
          const pageId = dataWithContent.data.pageId;

          // ページのプロパティを取得
          const properties = await retrievePageProperties(pageId);

          // ページのプロパティをMarkdownのコメントアウトに変換
          const mdProperties = ['---'];

          // プロパティをMarkdownに変換
          for (const [key, value] of Object.entries(properties)) {
            const mdProperty = convertPropertyToMarkdown(key, value);
            if (mdProperty !== null) {
              mdProperties.push(mdProperty);
            }
          }

          // ページIDを含める
          mdProperties.push(`pageId: ${pageId}`);

          // 既存のファイルを更新するかどうか
          mdProperties.push('mdUpdate: true');
          mdProperties.push('---');

          // プロパティをMarkdownに変換
          const mdPropertiesString = mdProperties.join('\n');

          // ブロックを取得
          const mdblocks = await n2m.pageToMarkdown(pageId);

          // マークダウンに変換
          const markdown = n2m.toMarkdownString(mdblocks);

          // マークダウンにプロパティを追加
          const markdownWithProperties = `${mdPropertiesString}\n${markdown}`;

          // oddMarkdownからmarkdownWithPropertiesに上書き
          const edit = new vscode.WorkspaceEdit();
          edit.replace(
            document.uri,
            new vscode.Range(
              document.positionAt(0),
              document.positionAt(oddMarkdown.length)
            ),
            markdownWithProperties
          );
          vscode.workspace.applyEdit(edit);
        } else {
          vscode.window.showErrorMessage('エディタが取得できません');
          return;
        }
      } catch (error) {
        vscode.window.showErrorMessage('エラーが発生しました。');
        return;
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

      // ページのプロパティを作成
      const mdProperties = ['---'];

      // プロパティをMarkdownに変換
      for (let i = 0; i < allProperty.length; i++) {
        const properties = allProperty[i].property;
        const value = '';
        mdProperties.push(`${properties}: ${value}`);
      }

      mdProperties.push('mdUpdate: false');
      mdProperties.push('---');

      // ページのプロパティをMarkdownのコメントアウトに変換
      const properties = mdProperties.join('\n');

      // マークダウンをエディタに表示
      const document = await vscode.workspace.openTextDocument({
        language: 'markdown',
        content: properties,
      });
      await vscode.window.showTextDocument(document, { preview: false });
      // Notionのプレビュー画面を表示
      await openPreview();
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
          return;
        } else if (message.title === '削除する' || message === undefined) {
          // "削除する"をクリックした場合
          // ページのタイトルを取得
          const pageTitle = element.label;
          // ページタイトルからページIDを取得
          const { results: pages } = await fetchPages({
            title: String(pageTitle),
            property: titleProperty,
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

  // Notionで更新、作成したエディタの情報を送信する
  let notionSend = vscode.commands.registerCommand(
    'vscodetonotion.sendEntry',
    async () => {
      const message = await vscode.window.showInformationMessage(
        `Notionにエディタの情報を送信します`,
        {
          modal: true,
        },
        { title: '送信しない', isCloseAffordance: false },
        { title: '送信する', isCloseAffordance: true }
      );
      if (message === undefined || message.title === '送信しない') {
        return;
      } else if (message?.title === '送信する') {
        // マークダウンを取得
        const editor = await vscode.window.activeTextEditor;
        // マークダウンの中身を取得
        const markdown = await editor?.document.getText();

        // 取得できなければエラーを表示
        if (markdown === undefined) {
          vscode.window.showErrorMessage(
            'アクティブなエディタが取得できません'
          );
          return;
        }

        // マークダウンの中身をdata要素とcontent要素に分割
        const dataWithContent = await mdToBlocks(String(markdown));

        // ページのデータ要素を取得
        const data = dataWithContent.data;

        // ページのデータが取得できなかったら
        if (data === undefined || data['mdUpdate'] === undefined) {
          vscode.window.showErrorMessage('mdUpdateが取得できませんでした');
          return;
        }

        // ページのコンテンツ要素を取得
        const content = markdownToBlocks(dataWithContent.content);

        // mdUpdateの値によって更新するか新規作成するかどうか判定
        if (data['mdUpdate'] === true) {
          // 更新する場合
          // mdUpdateプロパティを削除
          delete data['mdUpdate'];

          // ページのIDを取得
          const pageId = data['pageId'];

          // pageIDプロパティを取得できなかったらエラーを表示
          if (pageId === undefined) {
            vscode.window.showErrorMessage('pageIDが取得できませんでした');
            return;
          }

          delete data['pageId'];

          try {
            // ページを更新
            const update = await updatePage({
              pageId: pageId,
              data: data,
              content: content,
              allProperty: allProperty,
            });
          } catch (e) {
            vscode.window.showErrorMessage(
              String(e),
              'ページを作成できませんでした'
            );
            return;
          }
        } else {
          // 新規作成する場合
          // mdUpdateプロパティを削除
          delete data['mdUpdate'];
          try {
            // ページを作成
            const create = await createPage({
              data: data,
              content: content,
              allProperty: allProperty,
            });

            // createが取得できなかったらエラーを表示
            if (create === undefined) {
              vscode.window.showErrorMessage('ページを作成できませんでした');
              return;
            }

            // ページのIDを取得
            const pageId = create;

            // マークダウンを取得
            const editor = vscode.window.activeTextEditor;

            if (editor === undefined) {
              vscode.window.showErrorMessage(
                'アクティブなエディタが取得できませんでした'
              );
              return;
            }

            // マークダウンを開いているエディタのドキュメントを取得
            const document = editor.document;

            // マークダウンを開いているエディタのドキュメントのテキストを取得
            const oddMarkdown = document.getText();

            // ページのプロパティを取得
            const properties = await retrievePageProperties(pageId);

            // ページのプロパティをMarkdownのコメントアウトに変換
            const mdProperties = ['---'];

            // プロパティをMarkdownに変換
            for (const [key, value] of Object.entries(properties)) {
              const mdProperty = convertPropertyToMarkdown(key, value);
              if (mdProperty !== null) {
                mdProperties.push(mdProperty);
              }
            }

            // ページIDを含める
            mdProperties.push(`pageId: ${pageId}`);

            // 既存のファイルを更新するかどうか
            mdProperties.push('mdUpdate: true');
            mdProperties.push('---');

            // プロパティをMarkdownに変換
            const mdPropertiesString = mdProperties.join('\n');

            // ブロックを取得
            const mdblocks = await n2m.pageToMarkdown(pageId);

            // マークダウンに変換
            const markdown = n2m.toMarkdownString(mdblocks);

            // マークダウンにプロパティを追加
            const markdownWithProperties = `${mdPropertiesString}\n${markdown}`;

            // oddMarkdownからmarkdownWithPropertiesに上書き
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
              document.uri,
              new vscode.Range(
                document.positionAt(0),
                document.positionAt(oddMarkdown.length)
              ),
              markdownWithProperties
            );
            vscode.workspace.applyEdit(edit);
          } catch (e) {
            vscode.window.showErrorMessage('ページを作成できませんでした');
            return;
          }
        }
        vscode.commands.executeCommand('vscodetonotion.refreshEntry');

        const publishedText = await vscode.window.showInformationMessage(
          `更新されました。`,
          {
            modal: true,
          }
        );
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

  // アクティブなエディタに特定のキーワードが含まれているか判定する関数
  function containsKeyword(keyword: string): boolean {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return false;
    }

    const text = editor.document.getText();
    return text.includes(keyword);
  }

  // アクティブなエディタに特定のキーワードが含まれているか判定するコマンド
  let containsKeywordCommand = vscode.commands.registerCommand(
    'vscodetonotion.containsKeyword',
    async (keyword: string) => {
      const result = containsKeyword(keyword);
      return result;
    }
  );

  // 設定が変更されたときに呼び出される関数
  async function onDidChangeConfiguration(event: any) {
    const updateMessage = '設定が更新されました。再読み込みしますか？';

    // API設定が変更された場合の処理
    if (event.affectsConfiguration('vscodetonotion.api')) {
      // 更新するかどうか
      const selection = await vscode.window.showInformationMessage(
        updateMessage,
        'はい',
        'いいえ'
      );
      if (selection === 'はい') {
        // 更新処理を実行する
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    }
    // データベースID設定が変更された場合の処理
    else if (event.affectsConfiguration('vscodetonotion.databaseId')) {
      // 更新するかどうか
      const selection = await vscode.window.showInformationMessage(
        updateMessage,
        'はい',
        'いいえ'
      );
      if (selection === 'はい') {
        // 更新処理を実行する
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }
    }
  }

  // 設定変更イベントを監視する
  let disposable = vscode.workspace.onDidChangeConfiguration(
    onDidChangeConfiguration
  );

  // documentにステータスボタンを表示
  const markdownToNotion = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  markdownToNotion.text = '$(cloud-upload) MarkdownからNotionへ更新';
  markdownToNotion.command = 'vscodetonotion.sendEntry';

  const notionTomarkdown = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  notionTomarkdown.text = '$(cloud-download) NotionからMarkdownへ更新';
  notionTomarkdown.command = 'vscodetonotion.updateMarkdown';

  markdownToNotion.show();
  notionTomarkdown.show();

  // ステータスボタンを追加
  context.subscriptions.push(markdownToNotion);
  context.subscriptions.push(notionTomarkdown);

  // ディスポーザブルを登録する
  context.subscriptions.push(disposable);
  context.subscriptions.push(showPage);
  context.subscriptions.push(notionEdit);
  context.subscriptions.push(settigns);
  context.subscriptions.push(notionAdd);
  context.subscriptions.push(notionSend);
  context.subscriptions.push(notionDelete);
  context.subscriptions.push(updateMarkdown);
  context.subscriptions.push(containsKeywordCommand);
}

export function deactivate() {}
