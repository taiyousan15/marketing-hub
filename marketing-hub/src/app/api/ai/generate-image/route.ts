import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { join } from "path";

/**
 * AI画像生成API
 * NanoBanana Pro（Playwright経由のGemini UI自動操作）を使用して画像を生成
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "プロンプトを入力してください" },
        { status: 400 }
      );
    }

    // NanoBanana Pro（Pythonスクリプト）で画像生成
    const result = await generateWithNanoBanana(prompt);

    if (result.success) {
      return NextResponse.json(result);
    }

    // NanoBanana Proが失敗した場合、認証が必要な場合はそのエラーを返す
    if (result.auth_required) {
      return NextResponse.json({
        success: false,
        error: result.error,
        auth_required: true,
        auth_instructions: "ターミナルで以下を実行してください: cd scripts/nanobanana-pro && python auth_manager.py setup"
      }, { status: 401 });
    }

    // その他のエラー
    return NextResponse.json({
      success: false,
      error: result.error || "画像生成に失敗しました"
    }, { status: 500 });

  } catch (error) {
    console.error("AI image generation error:", error);
    return NextResponse.json(
      { error: "画像生成に失敗しました" },
      { status: 500 }
    );
  }
}

/**
 * NanoBanana Proで画像生成
 */
async function generateWithNanoBanana(prompt: string): Promise<{
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
  auth_required?: boolean;
}> {
  return new Promise((resolve) => {
    const scriptPath = join(process.cwd(), "scripts", "nanobanana-pro", "generate.py");

    // Python実行
    const pythonProcess = spawn("python3", [
      scriptPath,
      "--prompt", prompt,
      "--timeout", "180"
    ], {
      cwd: join(process.cwd(), "scripts", "nanobanana-pro"),
      env: { ...process.env, PYTHONIOENCODING: "utf-8" }
    });

    let stdout = "";
    let stderr = "";

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
      console.log("NanoBanana Pro:", data.toString());
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        try {
          // 最後のJSONラインを探す
          const lines = stdout.trim().split("\n");
          const jsonLine = lines.reverse().find(line => line.startsWith("{"));
          if (jsonLine) {
            const result = JSON.parse(jsonLine);
            resolve(result);
            return;
          }
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
        }
      }

      // エラー時
      if (stderr.includes("Not authenticated") || stdout.includes("auth_required")) {
        resolve({
          success: false,
          error: "NanoBanana Proの認証が必要です",
          auth_required: true
        });
      } else {
        resolve({
          success: false,
          error: stderr || "画像生成に失敗しました"
        });
      }
    });

    pythonProcess.on("error", (error) => {
      console.error("Python process error:", error);
      resolve({
        success: false,
        error: `Python実行エラー: ${error.message}`
      });
    });

    // タイムアウト（5分）
    setTimeout(() => {
      pythonProcess.kill();
      resolve({
        success: false,
        error: "画像生成がタイムアウトしました（5分）"
      });
    }, 5 * 60 * 1000);
  });
}
