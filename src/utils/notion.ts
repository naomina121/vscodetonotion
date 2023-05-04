import * as vscode from 'vscode';
import { Client } from '@notionhq/client';
import { ListBlockChildrenResponse } from '@notionhq/client/build/src/api-endpoints';

const config = vscode.workspace.getConfiguration('vscodetonotion');
const api = config.get('api');
const databaseId = config.get('databaseId');

export const notion = new Client({
  auth: String(api) as string,
});

export const fetchPages = async () => {
  const db = String(databaseId);
  return await notion.databases.query({
    database_id: db,
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
