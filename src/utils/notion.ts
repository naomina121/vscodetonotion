import * as vscode from 'vscode';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { ListBlockChildrenResponse } from '@notionhq/client/build/src/api-endpoints';
import { getPropertiesRichText } from './data';
import { convertProperty } from './mdToBlocks';

// 設定を取得
const config = vscode.workspace.getConfiguration('vscodetonotion');
let api = config.get('api');
let databaseId = config.get('databaseId');

export const notion = new Client({
  auth: String(api) as string,
});

// NotionToMarkdownのインスタンスを作成
export const n2m = new NotionToMarkdown({ notionClient: notion });

// ページを取得
export const fetchPages = async ({
  title,
  property,
}: {
  title?: string;
  property?: string;
}) => {
  const db = String(databaseId);
  const and: any = [];
  const sort: any = [
    {
      direction: 'ascending',
      timestamp: 'created_time',
    },
  ];
  // メッセージを表示
  vscode.window.showInformationMessage('Notionからデータを取得中...');

  if (api === '' || databaseId === '') {
    // エラーメッセージを表示
    vscode.window.showErrorMessage(
      '設定ファイルが間違っている可能性があります'
    );
  }

  if (title && property) {
    and.push({
      property: property,
      title: {
        equals: title,
      },
    });
  }

  const data = [];
  let cursor: string | undefined = undefined;
  while (true) {
    const { results, next_cursor }: any = await notion.databases.query({
      database_id: db,
      filter: {
        and: and,
      },
      sorts: sort,
      start_cursor: cursor,
    });
    data.push(...results);
    if (!next_cursor) break;
    cursor = next_cursor;
  }
  return { results: data };
};

// ブロックを取得
export const fetchBlocksByPageId = async (pageId: string) => {
  const data = [];
  let cursor: string | undefined = undefined;
  while (true) {
    const { results, next_cursor }: ListBlockChildrenResponse =
      await notion.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
      });
    data.push(...results);
    if (!next_cursor) break;
    cursor = next_cursor;
  }
  return { results: data };
};

// 全プロパティを取得
export const retrievePageProperties = async (pageId: any) => {
  const { properties } = (await notion.pages.retrieve({
    page_id: pageId,
  })) as any;

  return properties;
};

// ページIDからタイトルプロパティを取得
export const getPropertiesTitle = async (pageId: any) => {
  const properties = await retrievePageProperties(pageId);

  // プロパティを配列に変換
  const keys = Object.keys(properties);
  // プロパティの値を配列に変換
  const values = Object.values(properties);

  const titles = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value: any = values[i];
    if (value.title) {
      titles.push({
        key: key,
        value: getPropertiesRichText(value.title),
        pageId: pageId,
      });
    }
  }

  return titles[0];
};

// ページの削除
export const archivePage = async (pageId: string) => {
  await notion.pages.update({
    page_id: pageId,
    archived: true,
  });
};

// ページを更新
export const updatePage = async ({
  pageId,
  data,
  content,
  allProperty,
}: {
  pageId: string;
  data: any;
  content: any;
  allProperty: any;
}) => {
  const failsPages = [];
  try {
    // ブロックを取得
    const { results: blocks } = await fetchBlocksByPageId(pageId);

    // ブロックIDを取得
    const blockID = blocks.map((block: any) => block.id);

    // ブロックを削除
    for (let i = 0; i < blockID.length; i++) {
      await notion.blocks.delete({
        block_id: blockID[i],
      });
    }

    // ブロックを一括追加
    await notion.blocks.children.append({
      block_id: pageId,
      children: content,
    });

    // ページのプロパティ
    const properties = await convertProperty(data, allProperty);

    // ページのプロパティを更新
    const update = await notion.pages.update({
      page_id: pageId,
      properties: properties,
    });
  } catch (e) {
    console.error(e);
    failsPages.push(data.title);
  }
  console.log(`ページ作成に失敗しました：${failsPages[0]}`);
};

// ページを新規で作成
export const createPage = async ({
  data,
  content,
  allProperty,
}: {
  data: any;
  content: any;
  allProperty: any;
}) => {
  const failsPages = [];
  const db = String(databaseId);
  try {
    // ページのプロパティを更新
    const properties = await convertProperty(data, allProperty);

    // ページを作成
    const create = await notion.pages.create({
      parent: { database_id: db },
      properties: properties,
      children: content,
    });
    return create.id;
  } catch (e) {
    console.error(e);
    failsPages.push(data.title);
  }
  console.log(`ページ作成に失敗しました：${failsPages[0]}`);
};

// Notionのプレビュー画面を表示させる。
export async function openPreview() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  // markdownのプレビュー画面を表示
  try {
    // プレビュー画面をVSCode内に表示
    await vscode.commands.executeCommand(
      'markdown.showPreviewToSide',
      // プレビュー画面に表示するテキスト
      editor.document.getText(
        new vscode.Range(
          new vscode.Position(0, 0),
          new vscode.Position(editor.document.lineCount - 1, 0)
        )
      )
    );
    // プレビューを更新
    await vscode.commands.executeCommand('markdown.preview.refresh');
  } catch (e) {
    console.error(e);
  }
}
