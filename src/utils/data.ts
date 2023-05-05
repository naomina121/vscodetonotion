import { PageType, RichTextType } from '../types';

// 記事タイトルの設定
export const postTitle = (page: PageType) => {
  return getPropertiesRichText(page.properties.title.title);
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
