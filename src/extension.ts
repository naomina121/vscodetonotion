import * as vscode from 'vscode';

import {
  archivePage,
  createPage,
  fetchPages,
  n2m,
  retrievePageProperties,
  updatePage,
} from './utils/notion';
import { getPropertiesRichText, postTitle } from './utils/data';
import { mdToBlocks } from './utils/mdToBlocks';
import { markdownToBlocks } from '@tryfabric/martian';

export function activate(context: vscode.ExtensionContext) {
  // test
  let test = vscode.commands.registerCommand(
    'vscodetonotion.test',
    async () => {
      //sampleMDを取得
      const markdown = `---
description: 私という存在をお疑いになるのですか？
title: 私ですが、何かありましたか？
mdUpdate: false,
---

## 私です。


それ以上もそれ以下でもありません。


### 私であることに対して、何も言うことはありません。


ですから、私です。`;

      const testtext = await vscode.window.showInformationMessage(`hello`, {
        modal: true,
      });

      // マークダウンの中身をdata要素とcontent要素に分割
      const dataWithContent = await mdToBlocks(String(markdown));
      // ページのデータ要素を取得
      const data = dataWithContent.data;

      // ページのコンテンツ要素を取得
      const content = dataWithContent.content;
      // ページのデータをkeys:valuesの形式に変換
      const properties = {};

      // ページのデータをkeys:valuesの形式に変換
      for (const [key, value] of Object.entries(data)) {
        properties[key] = value;
      }

      // propertiesの中身を出力
      const message = await vscode.window.showInformationMessage(
        `properties:${properties['title']}`,
        {
          modal: true,
        }
      );

      // mdUpdateの値によって更新するか新規作成するかどうか判定
      if (properties['mdUpdate'] === 'true') {
        // 更新する場合
        // メッセージを表示
        const text = await vscode.window.showInformationMessage(
          `トゥルーです🎵`,
          {
            modal: true,
          }
        );
        return;
      } else {
        // 新規作成する場合
        // メッセージを表示
        const text = await vscode.window.showInformationMessage(
          `ファルスですのう`,
          {
            modal: true,
          }
        );
        // メッセージを表示
        const message = await vscode.window.showInformationMessage(
          `properties:${properties['title']}`,
          {
            modal: true,
          }
        );
        return;
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
          if (key === 'title') {
            mdProperties.push(`${key}: ${getPropertiesRichText(value.title)}`);
          } else if (key === 'description') {
            mdProperties.push(
              `${key}: ${getPropertiesRichText(value.rich_text)}`
            );
          } else if (key === 'category') {
            mdProperties.push(`${key}: ${value.select.name}`);
          } else if (key === 'tags') {
            // タグを配列に格納
            const tags = [];
            for (const tag of value.multi_select) {
              tags.push(tag.name);
            }
            mdProperties.push(`${key}: ${tags.join(', ')}`);
          } else {
            continue;
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
      const properties = `---
tags:
category: 未分類
description:
title: 新規ページ
mdUpdate: false
---`;
      // マークダウンをエディタに表示
      const document = await vscode.workspace.openTextDocument({
        language: 'markdown',
        content: properties,
      });
      await vscode.window.showTextDocument(document, { preview: false });
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
      if (message === undefined && message?.title === '送信しない') {
        return;
      } else if (message?.title === '送信する') {
        // マークダウンを取得
        const editor = await vscode.window.activeTextEditor;
        const markdown = await editor?.document.getText();

        const message = await vscode.window.showInformationMessage(
          `properties:${markdown}`,
          {
            modal: true,
          }
        );

        // マークダウンの中身をdata要素とcontent要素に分割
        const dataWithContent = await mdToBlocks(String(markdown));

        // ページのデータ要素を取得
        const data = dataWithContent.data;

        // ページのコンテンツ要素を取得
        const content = markdownToBlocks(dataWithContent.content);

        // ページのデータをkeys:valuesの形式に変換
        const properties = {};

        // ページのデータをkeys:valuesの形式に変換
        for (const [key, value] of Object.entries(data)) {
          properties[key] = value;
        }

        // mdUpdateの値によって更新するか新規作成するかどうか判定
        if (properties['mdUpdate'] === true) {
          // 更新する場合
          const testtext = await vscode.window.showInformationMessage(
            `更新します`,
            {
              modal: true,
            }
          );
          // mdUpdateプロパティを削除
          delete properties['mdUpdate'];

          // ページのIDを取得
          const pageId = properties['pageId'];

          // ページを更新
          await updatePage({
            pageId: pageId,
            data: properties,
            content: content,
          });
        } else {
          // 新規作成する場合
          const testtext = await vscode.window.showInformationMessage(
            `新規投稿します`,
            {
              modal: true,
            }
          );
          // mdUpdateプロパティを削除
          delete properties['mdUpdate'];
          await createPage({ data: properties, content: content });
        }
        vscode.commands.executeCommand('vscodetonotion.refreshEntry');

        const testtext = await vscode.window.showInformationMessage(
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

  context.subscriptions.push(showPage);
  context.subscriptions.push(notionEdit);
  context.subscriptions.push(settigns);
  context.subscriptions.push(notionAdd);
  context.subscriptions.push(notionSend);
  context.subscriptions.push(test);
}
export function deactivate() {}
