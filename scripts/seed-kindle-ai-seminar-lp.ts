import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })
dotenv.config({ path: path.join(__dirname, '../.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL not set')
  process.exit(1)
}

const pool = new Pool({ connectionString: databaseUrl, max: 2 })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// LINE URL — セミナー申し込み先
const LINE_URL = 'https://lin.ee/placeholder'

async function main() {
  const tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    console.error('テナントが見つかりません。')
    process.exit(1)
  }
  console.log(`テナント: ${tenant.name} (${tenant.id})`)

  const funnel = await prisma.funnel.create({
    data: {
      tenantId: tenant.id,
      name: 'Kindle×AI 四次元AIポケットシステム セミナーLP',
      type: 'SALES',
      status: 'PUBLISHED',
      settings: {},
    },
  })
  console.log(`ファネル作成: ${funnel.id}`)

  const content = [
    // ===== ヘッダーセクション（常に表示） =====

    // 1. インタラクティブ動画（2分岐 → 両方LINE）
    {
      id: 'header-interactive-video',
      type: 'interactive-video',
      props: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: '',
        choicePosition: 'bottom',
        choiceStyle: 'button',
        choices: `セミナーに今すぐ申し込む|${LINE_URL}|0\n詳しく知りたい方はこちら|${LINE_URL}|0`,
        backgroundColor: '#0a0a1a',
        textColor: '#ffffff',
        buttonColor: '#22c55e',
        buttonTextColor: '#ffffff',
      },
    },

    // 2. 時限CTA（10秒後にLINE誘導ボタン表示）
    {
      id: 'header-timed-cta',
      type: 'timed-video-cta',
      props: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: '',
        ctaText: '▶ 今すぐ無料セミナーに申し込む',
        ctaUrl: LINE_URL,
        ctaSubText: '※ 参加費無料・定員制・満席次第受付終了',
        delaySeconds: '10',
        triggerType: 'elapsed',
        hideAtSeconds: '0',
        ctaColor: '#22c55e',
        ctaTextColor: '#ffffff',
        animation: 'slideUp',
        backgroundColor: '#0a0a1a',
        textColor: '#ffffff',
      },
    },

    // ===== ボディセクション（15秒後に表示） =====

    // 3. ヒーローセクション
    {
      id: 'body-hero',
      type: 'hero',
      props: {
        headline: 'なぜ私は、Kindle報酬をそのまま\nあなたに届ける仕組みを作ったのか?',
        subheadline: 'まだ多くの人が知らない\nスキルや知識ゼロ、自宅でもできる\nKindle出版の、全く新しい仕組みが完成',
        backgroundColor: '#0a0a1a',
        textColor: '#ffffff',
        alignment: 'center',
        revealAfterSeconds: 15,
      },
    },

    // 4. WIN-WIN の仕組み説明
    {
      id: 'body-winwin',
      type: 'bullet',
      props: {
        items: 'Kindle出版の50冊分の文章そのまま毎月提供\nKindle報酬は全額あなたへ（手数料0円）\n私は、本が読まれたら顧客リストをもらい「WIN-WIN」のパートナーとなる',
        icon: 'check',
        iconColor: '#22c55e',
        backgroundColor: '#111827',
        textColor: '#e5e7eb',
        revealAfterSeconds: 15,
      },
    },

    // 5. 四次元AIポケットシステム紹介
    {
      id: 'body-system-intro',
      type: 'text',
      props: {
        text: 'この仕組みが成り立つために<br/><span style="color:#fbbf24;font-size:1.5em;font-weight:bold">総額694万円</span>で開発し<br/><br/>70名の億を稼ぐマーケッターや経営者が先行で使用し絶賛した<br/>「伝える✖️ファイル貼り付け」のみであなたがやりたいことが実現する<br/><br/><span style="color:#fbbf24;font-size:1.8em;font-weight:bold">四次元AIポケットシステム</span>を初公開します',
        backgroundColor: '#111827',
        textColor: '#e5e7eb',
        revealAfterSeconds: 15,
      },
    },

    // 6. セミナー参加者限定
    {
      id: 'body-seminar-limited',
      type: 'text',
      props: {
        text: 'セミナー参加者限定で<br/><span style="color:#ef4444;font-weight:bold;font-size:1.3em">「動画買取制度」</span>まで包み隠さず暴露<br/><br/>詳しくは、セミナーにて発表！',
        backgroundColor: '#1a1a2e',
        textColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    // 7. CTA①
    {
      id: 'body-cta-1',
      type: 'cta-button',
      props: {
        buttonText: '▶ 今すぐ無料セミナーに申し込む',
        href: LINE_URL,
        buttonColor: '#22c55e',
        buttonTextColor: '#ffffff',
        backgroundColor: '#0a0a1a',
        revealAfterSeconds: 15,
      },
    },

    // 8. 問題提起
    {
      id: 'body-problem',
      type: 'headline',
      props: {
        text: '正直に聞かせてください。\n今のあなたは、こんな状態ではないですか？',
        level: 2,
        backgroundColor: '#ffffff',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    // 9. 悩みリスト
    {
      id: 'body-pain-points',
      type: 'bullet',
      props: {
        items: '毎月の収入が安定しない\n副業を試したけど、続かなかった\n高額スクールに入ったけど、結果が出なかった\n投資で騙されたことがある\nAIが来ると聞いて焦っているけど、何から始めればいいかわからない\n家族のこと、時間のこと、お金のこと——事情があって、ずっと諦めてきた',
        icon: 'circle',
        iconColor: '#ef4444',
        backgroundColor: '#fef2f2',
        textColor: '#7f1d1d',
        revealAfterSeconds: 15,
      },
    },

    // 10. 危機感
    {
      id: 'body-urgency',
      type: 'text',
      props: {
        text: 'そのまま1年が過ぎたら、あなたはどこにいますか？<br/><br/><strong>「難しそう」と感じて距離を置いた人が、後に一番後悔する。</strong><br/><br/>iPhoneが普及するまで2年かかりました。<br/>YouTubeが稼げると気づくまで数年かかりました。<br/>2016年、暗号通貨を「怪しい」と笑った人が1年後に後悔しました。<br/><br/><strong style="color:#ef4444;font-size:1.2em">今、全く同じことが起きています。</strong>',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    // 11. 孫正義引用
    {
      id: 'body-quote-son',
      type: 'text',
      props: {
        text: '孫正義さんが2025年7月に言い切りました。<br/><br/><em style="font-size:1.2em;color:#4f46e5">「自らの未来を否定する者は、自らに限界を作っている」</em><br/><em style="font-size:1.2em;color:#4f46e5">「このAIの進化を否定するのは、自分の可能性にも限界を作ってしまっている」</em><br/><br/><strong>2026年は「AIの格差時代」の幕開けです。</strong><br/>使いこなす側に立つか、使われる側になるか。<br/>今、この2択に直面しています。',
        backgroundColor: '#f5f3ff',
        textColor: '#1e1b4b',
        revealAfterSeconds: 15,
      },
    },

    // 12. やること2つだけ
    {
      id: 'body-simple-steps',
      type: 'text',
      props: {
        text: 'では「使いこなす側」になるために、何が必要か？<br/><br/>専門知識？　<strong>不要です。</strong><br/>プログラミング？　<strong>不要です。</strong><br/>SNSの経験？　<strong>不要です。</strong><br/>動画編集の経験？　<strong>不要です。</strong><br/><br/><span style="font-size:1.4em;font-weight:bold;color:#4f46e5">あなたがやることは、たったの2つ。</span><br/><br/><span style="font-size:1.3em">① やりたいことを日本語で書くだけ</span><br/><span style="font-size:1.3em">② 私が渡すファイルを1枚コピーするだけ</span><br/><br/>以上です。<br/>これだけで、あなたがやりたいことが実現できるシステムが、すでに完成しています。',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    // 13. Kindle報酬体系
    {
      id: 'body-kindle-reward',
      type: 'headline',
      props: {
        text: 'Kindleについて、知らない人がほとんどの事実をお伝えします。',
        level: 2,
        backgroundColor: '#0a0a1a',
        textColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-kindle-reward-detail',
      type: 'text',
      props: {
        text: 'Kindleの報酬体系が「2種類ある」ことをご存知でしたか？<br/><br/><strong style="color:#fbbf24;font-size:1.2em">① 本が「売れた」ときに発生する報酬</strong><br/>本が売れるたびに、報酬が積み上がっていきます。<br/><br/><strong style="color:#fbbf24;font-size:1.2em">② 本が「読まれた」ときに発生する報酬</strong><br/>本が「買われなくても」、読まれるだけでそのつど報酬が積み上がる——<br/>これがAmazon Kindle特有の報酬体系です。<br/><br/>この2つを、<strong>同時に受け取れます。</strong><br/><br/>さらに——<strong>Kindleへの出版費用は、0円です。</strong><br/>コストゼロで、2種類の報酬が積み上がり続ける。<br/><br/>そして今回は——<br/><strong style="color:#22c55e;font-size:1.1em">本の台本からタイトルまで、すべてを私があなたに毎日プレゼントします。</strong><br/>月間で50冊分。あなたはそれをKindleに貼り付けるだけです。<br/>本当に、何も考えずに貼り付けていくだけです。<br/><br/>このような仕組みを持つコミュニティやスクールは、現状どこにも存在しません。',
        backgroundColor: '#0a0a1a',
        textColor: '#e5e7eb',
        revealAfterSeconds: 15,
      },
    },

    // 14. カラクリ説明
    {
      id: 'body-mechanism',
      type: 'headline',
      props: {
        text: '「なぜ無料で提供できるのか」\n——カラクリを正直に話します。',
        level: 2,
        backgroundColor: '#ffffff',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-mechanism-detail',
      type: 'text',
      props: {
        text: '「なぜタダで教えるのか？」「何か裏があるのでは？」<br/>当然の疑問です。だから正直に話します。<br/><br/><strong>私が受け取るのは、あなたからではありません。</strong><br/><br/>本の中には、読んだ人が自然に登録したくなる仕組みが仕込まれています。<br/>読者がその仕組みを通じてリストに入ることで——<br/>AmazonとKindleの読者からのルートで、私はリストを受け取ります。<br/><br/><strong style="color:#22c55e">あなたから受け取るものは、一切ありません。</strong><br/><br/>Kindle報酬は2種類とも、全額あなたへ。<br/>出版コストは0円。私への手数料も0円。<br/><br/>そして——ここが重要です。<br/><strong style="color:#fbbf24;font-size:1.2em">あなた自身も、この「リスト獲得の仕掛け側」に回ることができます。</strong>',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    // 15. 2種類の資産
    {
      id: 'body-assets',
      type: 'text',
      props: {
        text: '<strong style="font-size:1.3em">資産には2種類あります。</strong><br/><br/><strong>1つ目は、お金という資産。</strong><br/><br/><strong>2つ目は、顧客リストという資産。</strong><br/>これは企業でも個人でも同じです。<br/>しかし、この資産の「使い方」を知っている人は、まだほとんどいません。<br/><br/>私はマーケティングを20年以上やってきました。<br/>その経験から断言できます——<strong style="color:#4f46e5">顧客リストは、正しく使えばお金よりも強い資産になります。</strong><br/><br/>このセミナーでは、顧客リストに対するマーケティングの考え方と使い方を丸ごとお伝えします。<br/>そして、あなた自身がリストを取得し、さらなる資産を増やしていける環境も、すでに整えています。<br/><br/><strong style="color:#ef4444">実際にこの募集をしたら、30分で100名の方が参加してくれました。</strong><br/>その場でこのカラクリを公開したとき、会場が衝撃に包まれました。<br/><br/>この仕組みの全詳細を、当日包み隠さず話します。',
        backgroundColor: '#f8fafc',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    // 16. CTA②
    {
      id: 'body-cta-2',
      type: 'cta-button',
      props: {
        buttonText: '▶ 無料セミナーで仕組みの全詳細を聞く',
        href: LINE_URL,
        buttonColor: '#22c55e',
        buttonTextColor: '#ffffff',
        backgroundColor: '#0a0a1a',
        revealAfterSeconds: 15,
      },
    },

    // 17. 24時間自動化
    {
      id: 'body-automation',
      type: 'headline',
      props: {
        text: '24時間、あなたの代わりに働き続ける「仕組み」の話をします。',
        level: 2,
        backgroundColor: '#111827',
        textColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-automation-detail',
      type: 'text',
      props: {
        text: '今、本業や仕事で忙しい方がいるかもしれません。<br/>家族や育児で、自分の時間がなかなか取れない方もいるかもしれません。<br/><br/><strong>それでも関係ありません。</strong><br/><br/>一度仕組みを構築してしまえば——<br/>あなたが寝ている間も、仕事をしている間も、家族と過ごしている間も、<br/><strong style="color:#fbbf24;font-size:1.3em">100名・200名規模のAIチームが全自動で働き続けます。</strong><br/><br/>魔法のような話に聞こえるかもしれません。<br/>ですが、これはすでに実際に行われていることです。<br/>しかも、日本ではまだほとんど知られていない手法です。<br/><br/>この手法も、このセミナーの中でお伝えします。',
        backgroundColor: '#111827',
        textColor: '#e5e7eb',
        revealAfterSeconds: 15,
      },
    },

    // 18. セミナー公開内容
    {
      id: 'body-seminar-contents',
      type: 'headline',
      props: {
        text: 'このセミナーで公開すること',
        level: 2,
        backgroundColor: '#ffffff',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-seminar-contents-list',
      type: 'bullet',
      props: {
        items: 'Kindleの2種類の報酬と、全額あなたへ届く仕組みの全詳細【当日公開】\n月50冊分の台本・タイトル提供——貼り付けるだけになる仕組みの実態【当日公開】\n本に仕込む「リスト獲得の仕掛け」と、あなたも仕掛け側に回れるカラクリ【当日公開】\n顧客リストという「第2の資産」——20年以上のマーケティング経験から教える使い方【当日公開】\n96人のAIチームが24時間働き続ける「四次元AIポケットシステム」の全貌と実演【当日公開】\nセミナー参加者限定「動画買取制度」——未経験者でもマニュアル通りで作れ、最大1,500円で買い取る【参加者限定】',
        icon: 'arrow',
        iconColor: '#4f46e5',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    // 19. 動画買取制度
    {
      id: 'body-video-buyback',
      type: 'text',
      props: {
        text: '<strong style="font-size:1.3em;color:#4f46e5">「動画買取制度」について、少しだけ先にお伝えします。</strong><br/><br/>動画を編集したことがない方でも大丈夫です。<br/>SNSを触ったことがない方でも大丈夫です。<br/>マニュアル通りに進めるだけで動画が作れるようになり、知識も自然に身についていきます。<br/><br/><strong style="color:#ef4444;font-size:1.2em">作成した動画は、最大1,500円で買い取ります。</strong><br/><br/>この仕組みの詳細と収益シミュレーションは、セミナーの中で全て公開します。',
        backgroundColor: '#fef3c7',
        textColor: '#78350f',
        revealAfterSeconds: 15,
      },
    },

    // 20. 実績・お客様の声
    {
      id: 'body-testimonials-header',
      type: 'headline',
      props: {
        text: '実際に先行体験した人たちの変化',
        level: 2,
        backgroundColor: '#f8fafc',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-testimonial-1',
      type: 'testimonial',
      props: {
        author: 'トミーさん ／ 物販リサーチ',
        content: '5時間かかっていた作業が、3クリック・1分以内で完了。受講生全員が月10万円を稼げるシステムを完成させた。',
        rating: 5,
        backgroundColor: '#f8fafc',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-testimonial-2',
      type: 'testimonial',
      props: {
        author: '高嶋さん ／ ツール開発・販売',
        content: '最初の1ヶ月で15個のツールを開発。5分で電子書籍を制作・出版し、そのツール自体も50名に販売。「作って売る」サイクルを最速で確立した。',
        rating: 5,
        backgroundColor: '#f8fafc',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-testimonial-3',
      type: 'testimonial',
      props: {
        author: '坂根さん ／ 企業経営者',
        content: '月最大1,000時間分の業務を削減するツールを1ヶ月で4つ構築。年間2,000万円のコスト削減を実現。現在特許取得に向けて動いている。',
        rating: 5,
        backgroundColor: '#f8fafc',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-testimonial-4',
      type: 'testimonial',
      props: {
        author: '増田さん ／ 会社員・副業',
        content: 'Kindleの企画書作成ツールを4時間で開発。「AI革命の分岐点で、最先端を動かせている実感がある。それが何より嬉しい」',
        rating: 5,
        backgroundColor: '#f8fafc',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-diversity',
      type: 'text',
      props: {
        text: '現在、このシステムを使っているのは経営者だけではありません。<br/>マーケター、副業で始めた会社員、これから起業したい方——<br/>そして、<strong style="color:#ef4444">パソコン操作が不安な75歳の方まで。</strong><br/>年齢も経験も関係なく、すでに多くの方が人生を変えています。',
        backgroundColor: '#f8fafc',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    // 21. 開催理由
    {
      id: 'body-reason',
      type: 'headline',
      props: {
        text: 'このセミナーを開催する理由を話します。',
        level: 2,
        backgroundColor: '#0a0a1a',
        textColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-reason-detail',
      type: 'text',
      props: {
        text: '私は今、48歳です。8年ぶりに表舞台に立ちます。<br/><br/>投資で騙された方がいます。<br/>高額スクールで結果が出なかった方がいます。<br/>副業や起業をしたかったけど、家族の問題でできなかった方がいます。<br/>チャレンジしたけれど、うまくいかなかった方がいます。<br/><br/>そういう方たちに、このシステムを届けたいと思っています。<br/><br/>なぜなら——<br/>投資で騙されたなら、<strong>自分で投資システムを作って自分でやればいい。</strong><br/>何かを学びたければ、<strong>自分で学ぶシステムを作れる。</strong><br/>ビジネスを作りたければ、<strong>このシステムでビジネスが作れる。</strong><br/><br/>これまで「できなかった」ことが、「できる」に変わる時代が来ています。',
        backgroundColor: '#0a0a1a',
        textColor: '#e5e7eb',
        revealAfterSeconds: 15,
      },
    },

    // 22. あなたへのメッセージ
    {
      id: 'body-message',
      type: 'text',
      props: {
        text: '<strong style="font-size:1.5em;color:#4f46e5">あなたへ。</strong><br/><br/>投資で騙された経験があっても、関係ありません。<br/>高額スクールで結果が出なかった経験があっても、関係ありません。<br/>何度挑戦してもうまくいかなかった経験があっても、関係ありません。<br/><br/>自分で投資システムを作って、自分で投資をすればいい。<br/>自分で学ぶシステムを作れば、学ぶことができる。<br/>自分でビジネスのシステムを作れば、ビジネスが始められる。<br/><br/><strong style="color:#ef4444;font-size:1.3em">「できなかった」のは、仕組みがなかっただけです。</strong><br/>その仕組みを、このセミナーで受け取ってください。',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    // 23. 75歳エピソード
    {
      id: 'body-75-story',
      type: 'text',
      props: {
        text: '最初は難しく感じるかもしれません。それは当然です。<br/><br/>でも——一つだけ、聞いてください。<br/><br/>このシステムを使い始めた方の中に、<strong style="color:#fbbf24;font-size:1.3em">75歳の方</strong>がいます。<br/><br/>Zoomの操作も、パソコンの使い方も、<br/>最初は何もわからない、完全な素人状態からのスタートでした。<br/><br/>それでも今、この方はシステムを自分で使いこなしています。<br/><br/><strong>「難しそう」という理由だけで、諦める必要はありません。</strong><br/><strong>「自分には無理」という思い込みは、ただの思い込みです。</strong><br/><br/><strong style="color:#4f46e5;font-size:1.2em">75歳の方にできたことが、あなたにできないはずがありません。</strong>',
        backgroundColor: '#fffbeb',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    // 24. 孫正義引用2
    {
      id: 'body-quote-son-2',
      type: 'text',
      props: {
        text: '<strong style="font-size:1.4em">自分の可能性を、否定しないでください。</strong><br/><br/>孫正義さんの言葉をお借りします。<br/><em style="font-size:1.2em;color:#4f46e5">「AIの進化を否定するのは、自分の可能性にも限界を作ってしまっている」</em><br/><br/>年齢は、関係ありません。<br/>経験は、関係ありません。<br/>過去の失敗も、関係ありません。<br/><br/>あなたに必要なのは、ただ一つ——<br/><strong style="color:#22c55e;font-size:1.3em">「知ろう」とする、その一歩だけです。</strong>',
        backgroundColor: '#f5f3ff',
        textColor: '#1e1b4b',
        revealAfterSeconds: 15,
      },
    },

    // 25. 対象者
    {
      id: 'body-target',
      type: 'headline',
      props: {
        text: 'このセミナーに向いている方',
        level: 2,
        backgroundColor: '#ffffff',
        textColor: '#111827',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-target-yes',
      type: 'bullet',
      props: {
        items: '副収入・不労所得の仕組みをゼロから作りたい方\nKindle出版に興味があるが、何から始めればいいかわからない方\n投資や高額スクールで結果が出なかった経験がある方\nAIをビジネスに活かす具体的な方法を探している方\n忙しくても「自動で動く仕組み」を作りたい方\n顧客リストという資産を手に入れたい方',
        icon: 'check',
        iconColor: '#22c55e',
        backgroundColor: '#f0fdf4',
        textColor: '#14532d',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-target-no',
      type: 'bullet',
      props: {
        items: '情報収集だけして行動しない方\nAIの可能性を最初から否定している方\n一切の手間をかけずに稼ぎたい方',
        icon: 'circle',
        iconColor: '#ef4444',
        backgroundColor: '#fef2f2',
        textColor: '#7f1d1d',
        revealAfterSeconds: 15,
      },
    },

    // 26. 受け取れること
    {
      id: 'body-benefits',
      type: 'headline',
      props: {
        text: 'このセミナーで受け取れること',
        level: 2,
        backgroundColor: '#0a0a1a',
        textColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-benefits-list',
      type: 'bullet',
      props: {
        items: 'Kindleの2種類の報酬が同時に全額入る仕組みの全詳細\n月50冊分の台本・タイトル提供——貼り付けるだけになる実態\n本に仕込む「リスト獲得の仕掛け」とあなたも仕掛け側に回れるカラクリ\n顧客リストという第2の資産——20年超のマーケティング経験から教える使い方\n96人のAIチームが24時間働く「四次元AIポケットシステム」の全貌と実演\n動画・SNS未経験でも作れ、最大1,500円で買い取る「動画買取制度」の全詳細\nAI格差時代に「使いこなす側」に立つための最短ルート',
        icon: 'check',
        iconColor: '#22c55e',
        backgroundColor: '#0a0a1a',
        textColor: '#e5e7eb',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-no-pressure',
      type: 'text',
      props: {
        text: '※ 強引な勧誘は一切ありません。判断は、すべてあなた自身にゆだねます。',
        backgroundColor: '#0a0a1a',
        textColor: '#9ca3af',
        revealAfterSeconds: 15,
      },
    },

    // 27. 最終CTA
    {
      id: 'body-final-cta-text',
      type: 'text',
      props: {
        text: '<strong style="font-size:1.4em;color:#ffffff">75歳の方が、ゼロから使いこなしています。</strong><br/><strong style="font-size:1.4em;color:#fbbf24">あなたにできないはずがありません。</strong><br/><br/><span style="font-size:1.2em;color:#e5e7eb">まず、知るところから始めましょう。</span>',
        backgroundColor: '#0a0a1a',
        textColor: '#ffffff',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-final-cta',
      type: 'cta-button',
      props: {
        buttonText: '▶ 今すぐ無料セミナーに申し込む',
        href: LINE_URL,
        buttonColor: '#22c55e',
        buttonTextColor: '#ffffff',
        backgroundColor: '#0a0a1a',
        revealAfterSeconds: 15,
      },
    },

    {
      id: 'body-final-note',
      type: 'text',
      props: {
        text: '<div style="text-align:center;padding:8px 0;"><span style="font-size:1.1em;color:#9ca3af">参加費：<strong style="color:#22c55e">完全無料</strong> ／ 定員制・満席次第受付終了</span></div>',
        backgroundColor: '#0a0a1a',
        textColor: '#9ca3af',
        revealAfterSeconds: 15,
      },
    },

    // 28. フッター
    {
      id: 'body-footer',
      type: 'footer',
      props: {
        text: '© 2026 四次元AIポケットシステム All rights reserved.',
        backgroundColor: '#000000',
        textColor: '#6b7280',
        revealAfterSeconds: 15,
      },
    },
  ]

  const pageId = `kindle-ai-lp-${Date.now()}`
  const slug = 'kindle-ai-seminar'
  await prisma.$executeRaw`
    INSERT INTO "FunnelPage" (id, "funnelId", name, slug, content, "seoTitle", "seoDescription", "order", "createdAt", "updatedAt")
    VALUES (
      ${pageId},
      ${funnel.id},
      'Kindle×AI 四次元AIポケットシステム セミナーLP',
      ${slug},
      ${JSON.stringify(content)}::jsonb,
      'Kindle報酬を全額あなたへ届ける仕組み｜四次元AIポケットシステム無料セミナー',
      'スキルや知識ゼロ、自宅でもできるKindle出版の全く新しい仕組み。Kindle報酬は全額あなたへ。96人のAIチームが24時間働く四次元AIポケットシステムを無料セミナーで初公開。',
      0,
      NOW(),
      NOW()
    )
  `
  console.log(`ページ作成: ${pageId} (slug: ${slug})`)

  console.log('\n========================================')
  console.log('Kindle×AI セミナーLP作成完了！')
  console.log(`URL: /p/${funnel.id}/${slug}`)
  console.log('========================================')
  console.log('\ndev サーバーを起動して上記URLにアクセスしてください:')
  console.log('  npm run dev')
  console.log(`  → http://localhost:3000/p/${funnel.id}/${slug}`)
  console.log('\n動作確認:')
  console.log('  - ヘッダー: インタラクティブ動画 + 10秒後にLINE誘導CTAボタン表示')
  console.log('  - ボディ: 15秒後にスライドインで全セクション表示')
  console.log('  - 3箇所のCTAボタン → LINE誘導')
}

main()
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
