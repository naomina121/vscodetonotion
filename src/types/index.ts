import { ParsedUrlQuery } from 'querystring';

// Page
export type PageType = {
  id: string;
  cover?: FileType;
  properties: PropertyType;
};

export type FileType = {
  file?: {
    url: string;
    expiry_time: string;
  };
  external?: {
    url: string;
  };
};

export type PropertyType = {
  title: {
    title: RichTextType[];
  };
  slug: {
    rich_text: RichTextType[];
  };
  description: {
    rich_text: RichTextType[];
  };
  tags: {
    multi_select: [
      {
        name: string;
      }
    ];
  };
  category: {
    select: {
      name: string;
    };
  };
  isPublished: {
    checkbox: boolean;
  };
  publishedAt?: {
    date: {
      start: string;
    };
  };
  lastUpdatedAt: {
    last_edited_time: string;
  };
};

export type RichTextType = {
  type: string;
  text?: {
    content: string;
    link: null | {
      url: string;
    };
  };
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: string;
  };
  plain_text: string;
  href: null | string;
};

export type BlockType = {
  type: string;
  heading_2?: {
    is_toggleable: boolean;
    color: string;
    rich_text: RichTextType[];
  };
  heading_3?: {
    is_toggleable: boolean;
    color: string;
    rich_text: RichTextType[];
  };
  image?: {
    caption: [];
    type: string;
    file?: {
      url: string;
      expiry_time: Date;
    };
    external?: {
      url: string;
    };
  };
  paragraph?: {
    rich_text: RichTextType[];
    color: string;
  };
  code?: {
    caption: [];
    rich_text: RichTextType[];
    language: string;
  };
  bulleted_list_item?: {
    rich_text: RichTextType[];
    color: string;
    children?: [
      { type: string },
      { bulleted_list_item: BlockType['bulleted_list_item'] }
    ];
  };
  numbered_list_item?: {
    rich_text: RichTextType[];
    color: string;
    children?: [
      { type: string },
      { numbred_list_item: BlockType['numbered_list_item'] }
    ];
  };
  quote?: {
    rich_text: RichTextType[];
    color: string;
    children?: [
      { type: string },
      {
        quote: BlockType['quote'];
      }
    ];
  };
};

// page

export type IndexProps = {
  pages: PageType[];
};

export type ListProps = {
  page: PageType;
  key: number;
};

export type CategoryProps = IndexProps & {
  category: string;
};

export type ArticleProps = IndexProps & {
  page: PageType;
  blocks: BlockType[];
};

export type Params = ParsedUrlQuery & {
  category: string;
  slug: string;
};

export type ContentsProps = {
  blocks: BlockType[];
};
