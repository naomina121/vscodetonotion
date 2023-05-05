import * as matter from 'gray-matter';

export const mdToBlocks = async (md: string) => {
  const { data, content } = await matter(md, { excerpt: true });
  return { data: data, content: content };
};
