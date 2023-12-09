import * as matter from 'gray-matter';

// マークダウンをブロックに変換する
export const mdToBlocks = async (md: string) => {
  const { data, content } = await matter(md, { excerpt: true });
  return { data: data, content: content };
};

// プロパティをAPIに渡す形式に変換
export const convertProperty = (data: any, allProperty: any) => {
  // データのキーを配列に格納
  const keys = Object.keys(data);

  // データの値を配列に格納
  const values = Object.values(data);

  // プロパティの値を作成
  const properties: any = {};

  // プロパティを作成
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let value: any = values[i];
    if (value === null) {
      continue;
    }
    if (allProperty[i].type === 'multi_select') {
      // 文字列を配列に変換
      const str = value.split(',');
      if (str.length === 0) {
        continue;
      } else if (str) {
        const multiSelectArray = [];
        for (let i = 0; i < str.length; i++) {
          multiSelectArray.push({
            name: str[i],
          });
        }

        properties[key] = { multi_select: multiSelectArray };
      } else if (value === null) {
        continue;
      } else if (str === undefined) {
        continue;
      }
    } else if (allProperty[i].type === 'title') {
      properties[key] = {
        title: [
          {
            text: {
              content: value,
            },
          },
        ],
      };
    } else if (allProperty[i].type === 'select') {
      properties[key] = {
        select: {
          name: value,
        },
      };
    } else if (allProperty[i].type === 'date') {
      properties[key] = {
        date: {
          start: value,
        },
      };
    } else if (allProperty[i].type === 'number') {
      properties[key] = {
        number: value,
      };
    } else if (allProperty[i].type === 'checkbox') {
      properties[key] = {
        checkbox: value,
      };
    } else if (allProperty[i].type === 'relation') {
      properties[key] = {
        relation: value,
      };
    } else if (allProperty[i].type === 'formula') {
      continue;
    } else if (allProperty[i].type === 'rollup') {
      properties[key] = {
        rollup: {
          number: value,
        },
      };
    } else if (allProperty[i].type === 'people') {
      properties[key] = {
        people: value,
      };
    } else if (allProperty[i].type === 'files') {
      properties[key] = {
        files: value,
      };
    } else if (allProperty[i].type === 'rich_text') {
      properties[key] = {
        rich_text: [
          {
            text: {
              content: value,
            },
          },
        ],
      };
    } else if (allProperty[i].type === 'created_time') {
      properties[key] = {
        created_time: value,
      };
    } else if (allProperty[i].type === 'created_by') {
      properties[key] = {
        created_by: value,
      };
    } else if (allProperty[i].type === 'last_edited_time') {
      properties[key] = {
        last_edited_time: value,
      };
    } else if (allProperty[i].type === 'last_edited_by') {
      properties[key] = {
        last_edited_by: value,
      };
    } else if (allProperty[i].type === 'email') {
      properties[key] = {
        email: value,
      };
    } else if (allProperty[i].type === 'phone_number') {
      properties[key] = {
        phone_number: value,
      };
    } else if (allProperty[i].type === 'url') {
      properties[key] = {
        url: value,
      };
    } else if (allProperty[i].type === 'formula') {
      properties[key] = {
        formula: {
          string: value,
        },
      };
    }
  }

  return properties;
};
