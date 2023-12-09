import { RichTextType } from '../types';

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

// セレクトの設定
export const select = (item: any) => {
  try {
    return item.select.name;
  } catch (err) {
    //console.error(err)
  }
  return '';
};

// マルチセレクトの設定
export const multiSelect = (items: any) => {
  try {
    return items.map((item: any) => item.name);
  } catch (err) {
    //console.error(err)
  }
  return [];
};

// データの設定
export const date = (item: any) => {
  try {
    return item.date.start;
  } catch (err) {
    //console.error(err)
  }
  return '';
};

// 渡されるプロパティによって変換する関数を変える
export const convertPropertyToMarkdown = (
  key: string,
  value: any
): string | null => {
  const converters = {
    title: () => `${key}: ${getPropertiesRichText(value.title)}`,
    rich_text: () => `${key}: ${getPropertiesRichText(value.rich_text)}`,
    select: () => `${key}: ${select(value)}`,
    multi_select: () => {
      const multiSelectValue = multiSelect(value.multi_select);
      return `${key}: ${multiSelectValue.join(', ')}`;
    },
    number: () => `${key}: ${value.number}`,
    date: () => `${key}: ${date(value)}`,
    formula: () => `${key}: ${value.formula.string}`,
    relation: () => `${key}: ${value.relation}`,
    rollup: () => `${key}: ${value.rollup.number}`,
    people: () => `${key}: ${value.people}`,
    files: () => `${key}: ${value.files}`,
    checkbox: () => `${key}: ${value.checkbox}`,
    url: () => `${key}: ${value.url}`,
    email: () => `${key}: ${value.email}`,
    phone_number: () => `${key}: ${value.phone_number}`,
    created_time: () => `${key}: ${value.created_time}`,
    created_by: () => `${key}: ${value.created_by}`,
    last_edited_time: () => `${key}: ${value.last_edited_time}`,
    last_edited_by: () => `${key}: ${value.last_edited_by}`,
    page: () => `${key}: ${value.page}`,
    parent: () => `${key}: ${value.parent}`,
    child: () => `${key}: ${value.child}`,
  } as any;

  const converter = converters[value.type];
  return converter ? converter() : null;
};
