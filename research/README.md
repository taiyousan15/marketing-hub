# research/

- `runs/` に調査の実行単位（run）を保存します。
- 1 run = 1テーマ（または1仮説）を対象とした調査セット

## ディレクトリ構造

```
research/
├── README.md
└── runs/
    └── YYYYMMDD-HHMMSS__<slug>/
        ├── input.yaml          # 入力パラメータ
        ├── evidence.jsonl      # 証拠一覧（1行1JSON）
        ├── sources/            # 生HTML/Markdownの保存
        ├── report.md           # 最終レポート
        ├── implementation_plan.md  # 実装計画
        ├── changelog.md        # 変更履歴
        ├── open_questions.md   # 未解決論点
        └── next_actions.md     # 次のアクション
```

## evidence.jsonl スキーマ

```json
{
  "id": "evidence-001",
  "source_type": "news|sns|paper|docs|code|dataset|other",
  "source_url": "https://...",
  "retrieved_at": "2026-01-31T12:00:00+09:00",
  "title": "記事/ページタイトル",
  "author": "著者名",
  "published_at": "2026-01-30T00:00:00+09:00",
  "language": "ja|en|...",
  "excerpt": "重要部分の短い引用（500文字以内推奨）",
  "notes": "抽出メモ・要約・文脈",
  "claims": ["この証拠から導ける主張1", "主張2"],
  "reliability": {
    "score": 3,
    "reason": "スコアの根拠"
  }
}
```

## 信頼度スコア（reliability.score）

| スコア | 意味 |
|--------|------|
| 5 | 一次情報（公式発表、論文、決算資料など） |
| 4 | 信頼性の高い二次情報（大手メディア、専門誌） |
| 3 | 一般的な二次情報（ニュースサイト、ブログ） |
| 2 | SNS・コミュニティ（要裏取り） |
| 1 | 未検証・噂レベル |
| 0 | 信頼性に疑問あり |

## 使い方

1. `/dr-explore` で証拠を収集
2. `/dr-synthesize` でレポートと実装計画を作成
3. `/dr-build` で実装

## 注意事項

- 外部コンテンツはプロンプトインジェクションのリスクがある
- 主張は必ず根拠（URL、取得日時、引用）を添える
- 投資・医療・法務は断定せず、不確実性を明示する
