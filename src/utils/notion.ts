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

export const archivePage = async (pageId: string) => {
  await notion.pages.update({
    page_id: pageId,
    archived: true,
  });
};
