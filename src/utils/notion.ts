import * as vscode from 'vscode';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { ListBlockChildrenResponse } from '@notionhq/client/build/src/api-endpoints';

// 設定を取得
const config = vscode.workspace.getConfiguration('vscodetonotion');
let api = config.get('api');
let databaseId = config.get('databaseId');

// apiとdatabaseIdが設定されていない場合はエラーを返す
export let notion = new Client({
  auth: String(api) as string,
});

// NotionToMarkdownのインスタンスを作成
export const n2m = new NotionToMarkdown({ notionClient: notion });

// ページを取得
export const fetchPages = async ({ title }: { title?: string }) => {
  let db = String(databaseId);
  const and: any = [
    {
      property: 'slug',
      rich_text: {
        is_not_empty: true,
      },
    },
  ];

  if (title) {
    and.push({
      property: 'title',
      title: {
        equals: title,
      },
    });
  }

  return await notion.databases.query({
    database_id: db,
    filter: {
      and: and,
    },
  });
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
}: {
  pageId: string;
  data: any;
  content: any;
}) => {
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

    // ページのプロパティを更新
    await notion.pages.update({
      page_id: pageId,
      properties: {
        title: {
          title: data.title
            ? [{ text: { content: data.title } }]
            : [{ text: { content: 'タイトルなし' } }],
        },
        tags: {
          multi_select: data.tags
            ? data.tags.map((tag: string) => ({ name: tag }))
            : [],
        },
        category: {
          select: data.category ? { name: data.category } : { name: '未分類' },
        },
        description: {
          rich_text: data.description
            ? [{ text: { content: data.description } }]
            : [{ text: { content: '説明なし' } }],
        },
        isPublic: {
          checkbox: data.isPublic ? data.isPublic : false,
        },
        updateAt: {
          date: data.updateAt
            ? { start: data.updateAt }
            : { start: new Date() },
        },
      },
    });
  } catch (e) {
    console.error(e);
  }
};

// ページを新規で作成
export const createPage = async ({
  data,
  content,
}: {
  data: any;
  content: any;
}) => {
  const failsPages = [];
  let db = String(databaseId);
  try {
    const create = await notion.pages.create({
      parent: { database_id: db },
      properties: {
        title: {
          title: data.title
            ? [{ text: { content: data.title } }]
            : [{ text: { content: 'タイトルなし' } }],
        },
        tags: {
          multi_select: data.tags
            ? data.tags.map((tag: string) => ({ name: tag }))
            : [],
        },
        category: {
          select: data.category ? { name: data.category } : { name: '未分類' },
        },
        description: {
          rich_text: data.description
            ? [{ text: { content: data.description } }]
            : [{ text: { content: '説明なし' } }],
        },
        isPublic: {
          checkbox: data.isPublic ? data.isPublic : false,
        },
        updateAt: {
          date: data.updateAt
            ? { start: data.updateAt }
            : { start: new Date() },
        },
      },
      children: content,
    });
  } catch (e) {
    console.error(e);
    failsPages.push(data.title);
  }
  console.log('ページ作成に失敗しました：${failsPages[0]}');
};
