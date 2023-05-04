import { PageType, RichTextType } from '../types';

// 記事タイトルの設定
export const postTitle = (page: PageType) => {
  return getPropertiesRichText(page.properties.title.title);
};

// ディスクリプションの設定
export const description = (page: PageType) => {
  return getPropertiesRichText(page.properties.description.rich_text);
};

// スラッグの設定
export const slug = (page: PageType) => {
  return getPropertiesRichText(page.properties.slug.rich_text);
};

// 公開するかのチェックの設定
export const isPublished = (page: PageType) => {
  return page.properties.isPublished.checkbox;
};

// カテゴリーの設定
export const postCategory = (page: PageType) => {
  return page.properties.category.select.name;
};

// タグの設定
export const tags = (page: PageType) => {
  const tags = page.properties.tags.multi_select;
  try {
    return tags.map((tag) => tag.name);
  } catch (err) {
    //console.error(err)
  }
  return [];
};

// 公開日の設定
export const publishedAt = (page: PageType) => {
  try {
    return page.properties.publishedAt?.date.start;
  } catch (err) {
    //console.error(err)
  }
  return '';
};

// 最終更新日の設定
export const lastUpdatedAt = (page: PageType) => {
  return page.properties.lastUpdatedAt.last_edited_time;
};

// リッチテキストの取得
export const getPropertiesRichText = (RichTextArr: RichTextType[]) => {
  try {
    const textArr = RichTextArr.map((text) => text.plain_text);
    return textArr.join('');
  } catch (err) {
    // console.error(err)
  }
  return '';
};
