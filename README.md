# VSCodeToNotionとは？

> 現在、開発途中のVScodeの拡張機能です。

このプラグインは、VSCodeからNotionAPIを通して、新規投稿、編集、削除をするプラグインです。

\!\[vscodetonotionのスクリーンショット画像\]\(resources/vscodetonotion.png\)

## 使い方

まず、準備として、新規作成のデータベースを用意し、NotionAPIキーの取得と、ページIDを取得しましょう。

サンプルの [データベース](https://naomina.notion.site/b468c12581124c8188821523a18f24ad?v=796a38918d3d47068091f1c540f4d5d5)をご用意しました。動作確認に複製してご自由にお使いください。

1. [Notion Developer Portal](https://www.notion.com/my-integrations)にアクセスし、新しいインテグレーションを作成します。
2. インテグレーションを作成したら、NotionAPIキーを取得します。（大切な情報なので厳重に保管してください）
3. 先ほど複製したNotionのページにアクセスし、右上の三点リーダーをクリックしインテグレーションをコネクトの追加から追加します。（インテグレーションが反映されるまでに時間がかかる場合もあります。）
4. ページIDを取得するには、ページの共有からリンクをコピーします。「https://notion.so/(NotionPageID)/?v=ランダム文字列」

次に、拡張機能を有効にしたら、サイドバーにNotionのアイコンが追加されるので「設定画面を開く」から先ほど設定した取得したNotionAPIキーとページIDをそれぞれ設定してください。

\!\[設定画面の説明\]\(resources/setting.png\)

その次に、「Notionのページ一覧を開く」を選択すると下記のような画面になります。

\!\[設定画面の説明\]\(resources/pages.png\)

左側がNotionのデータベースを読み込んだ状態になります。

\!\[項目にフォーカスした時の説明\]\(resources/edit.png\)

左側の項目にフォーカスすると、鉛筆マークが出ますが、これは、Notionにページを更新したい時に使用します。
ゴミ箱マークは削除です。

右上のノートのマークは、新規でNotionに投稿したいときに使います。

更新や新規でデータを投稿する時、エディタが立ち上がりますが、保存をしなくてもデータは送信ができます。

### データを送信したい時

エディタで編集を終えたら、エディタ画面で右クリックを押します。
すると下記のようになります。

\!\[データ送信\]\(resources/update.png\)

「エディター内容をNotionのデータベースに送信する」を選択するとデータベースにデータが送信されます。


## 注意事項

\!\[メタ情報\]\(resources/meta.png\)

エディタで編集する時に、上記のように、`---`で囲まれている箇所がありますが、こちらはメタ情報として使用しています。

`pageID`や`mdUpdate`の情報は更新するときに使用しています。

削除してしまうと更新ができなくなってしまうため削除なさらないようにお願いします。

**ページのタイトル属性に関しては、新規で作成する際は必ず名前をつけてください。**

タイトルがない場合は、新規投稿ができません。

新規投稿画面に関しては、データベースに設定したプロパティをメタ情報に設定していますが、空白でも大丈夫です。

メタ情報のプロパティの中には、Notionでご使用されている関数などに応じて反映させるためには空白である必要があります。

新規投稿する際にエディタからメタ情報が適切に取れてない場合は、更新ボタンを押して開き直してみたりすると直ります。

## Release Notes

### "0.0.1

   - カスタムプロパティにて新規投稿、更新できるように調整 (2023/5/6)
  
---

## 参考サイトやお借りした素材サイト

* [ICONS8](https://icons8.jp)
* [Markdownで書いたノートをNotionのデータベースに移行する](https://zenn.dev/cizneeh/articles/markdown-to-notion-db)
* [VSCode Extensions(拡張機能) 自作入門 〜VSCodeにおみくじ機能を追加する〜](https://qiita.com/HelloRusk/items/073b58c1605de224e67e)
* [gray-matter](https://www.npmjs.com/package/gray-matter#optionslanguage)
* [@tryfabric/martian]([@tryfabric/martian](https://www.npmjs.com/package/@tryfabric/martian))
* [notion-to-md](https://www.npmjs.com/package/notion-to-md)

**Thanks!**
