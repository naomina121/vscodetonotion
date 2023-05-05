import * as vscode from 'vscode';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { ListBlockChildrenResponse } from '@notionhq/client/build/src/api-endpoints';

const config = vscode.workspace.getConfiguration('vscodetonotion');
const api = config.get('api');
const databaseId = config.get('databaseId');

export const notion = new Client({
  auth: String(api) as string,
});

export const n2m = new NotionToMarkdown({ notionClient: notion });

export const fetchPages = async ({ title }: { title?: string }) => {
  const db = String(databaseId);
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

export const retrievePageProperties = async (pageId: any) => {
  // プロパティを取得
  const { properties } = await notion.pages.retrieve({ page_id: pageId });

  // プロパティの値を取得
  return properties;
};

export const getPageProperties = async (pageId: any, property: string) => {
  const properties = await retrievePageProperties(pageId);
  const propertyValue = properties[property];
  return propertyValue;
};

export const archivePage = async (pageId: string) => {
  await notion.pages.update({
    page_id: pageId,
    archived: true,
  });
};

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

export const createPage = async ({
  data,
  content,
}: {
  data: any;
  content: any;
}) => {
  const failsPages = [];
  const db = String(databaseId);
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
