import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/groq";
import { BODY_ANALYSIS_PROMPT, FIT_REPORT_PROMPT } from "@/lib/prompts";
import { saveAnalysis } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatAverageBodyForPrompt } from "@/lib/bodyData";
import { getSizeChart } from "@/lib/sizeChart";
import { v4 as uuidv4 } from "uuid";
import { readFile } from "fs/promises";
import path from "path";
import type { BodyAnalysis, GarmentInput, FitReport } from "@/types";

interface ProfileData {
  height?: string;
  weight?: string;
  gender?: string;
  age?: string;
}

// 로컬 경로(/uploads/...)인 경우 base64 data URL로 변환
async function resolveImageUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  // 로컬 파일 → base64
  const filePath = path.join(process.cwd(), "public", imageUrl);
  const buffer = await readFile(filePath);
  const ext = path.extname(imageUrl).toLowerCase().replace(".", "");
  const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, garmentData, garmentImageUrl, profileData } = body as {
      imageUrl: string;
      garmentData: GarmentInput;
      garmentImageUrl?: string;
      profileData?: ProfileData;
    };

    if (!imageUrl) {
      return NextResponse.json(
        { error: "전신 사진이 필요합니다" },
        { status: 400 }
      );
    }

    const resolvedImageUrl = await resolveImageUrl(imageUrl);
    const resolvedGarmentUrl = garmentImageUrl ? await resolveImageUrl(garmentImageUrl) : undefined;

    const bodyAnalysis = await analyzeBody(resolvedImageUrl, profileData);
    const fitReport = await generateFitReport(
      bodyAnalysis,
      garmentData,
      resolvedGarmentUrl,
      profileData
    );

    const currentUser = await getCurrentUser();
    const analysisId = uuidv4();
    const createdAt = new Date().toISOString();
    await saveAnalysis({
      id: analysisId,
      userId: currentUser?.userId || "anonymous",
      imageUrl,
      garmentData,
      bodyAnalysis,
      report: fitReport,
      createdAt,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: analysisId,
        bodyAnalysis,
        garmentData,
        report: fitReport,
        imageUrl,
        createdAt,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다. 다시 시도해주세요." },
      { status: 500 }
    );
  }
}

async function analyzeBody(
  imageUrl: string,
  profileData?: ProfileData
): Promise<BodyAnalysis> {
  let promptWithProfile = BODY_ANALYSIS_PROMPT;

  if (profileData) {
    const profileInfo = [];
    if (profileData.gender) profileInfo.push(`성별: ${profileData.gender === "male" ? "남성" : "여성"}`);
    if (profileData.height) profileInfo.push(`키: ${profileData.height}cm`);
    if (profileData.weight) profileInfo.push(`몸무게: ${profileData.weight}kg`);

    // BMI 계산
    if (profileData.height && profileData.weight) {
      const heightM = Number(profileData.height) / 100;
      const bmi = Number(profileData.weight) / (heightM * heightM);
      profileInfo.push(`BMI: ${bmi.toFixed(1)}`);
      if (bmi < 18.5) profileInfo.push(`BMI 분류: 저체중`);
      else if (bmi < 23) profileInfo.push(`BMI 분류: 정상`);
      else if (bmi < 25) profileInfo.push(`BMI 분류: 과체중`);
      else if (bmi < 30) profileInfo.push(`BMI 분류: 비만1단계`);
      else profileInfo.push(`BMI 분류: 비만2단계`);
    }

    if (profileInfo.length > 0) {
      promptWithProfile += `\n\n## 사용자 프로필 정보:\n${profileInfo.join("\n")}`;
    }

    // 성별/연령대별 평균 신체 데이터 삽입
    if (profileData.gender) {
      const genderCode = profileData.gender === "male" ? "M" : "F";
      const age = profileData.age ? Number(profileData.age) : undefined;
      promptWithProfile += `\n\n${formatAverageBodyForPrompt(genderCode as "M" | "F", age)}`;
    }
  }

  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: promptWithProfile },
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: 1024,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("체형 분석 응답이 없습니다");
  }

  return JSON.parse(content) as BodyAnalysis;
}

async function generateFitReport(
  bodyAnalysis: BodyAnalysis,
  garmentData: GarmentInput,
  garmentImageUrl?: string,
  profileData?: ProfileData
): Promise<FitReport> {
  let userContext = `
## 사용자 체형 분석 결과:
${JSON.stringify(bodyAnalysis, null, 2)}
`;

  if (profileData) {
    const profileInfo = [];
    if (profileData.gender) profileInfo.push(`성별: ${profileData.gender === "male" ? "남성" : "여성"}`);
    if (profileData.height) profileInfo.push(`키: ${profileData.height}cm`);
    if (profileData.weight) profileInfo.push(`몸무게: ${profileData.weight}kg`);
    if (profileData.height && profileData.weight) {
      const heightM = Number(profileData.height) / 100;
      const bmi = Number(profileData.weight) / (heightM * heightM);
      profileInfo.push(`BMI: ${bmi.toFixed(1)}`);
      if (bmi < 18.5) profileInfo.push(`BMI 분류: 저체중`);
      else if (bmi < 23) profileInfo.push(`BMI 분류: 정상`);
      else if (bmi < 25) profileInfo.push(`BMI 분류: 과체중`);
      else if (bmi < 30) profileInfo.push(`BMI 분류: 비만1단계`);
      else profileInfo.push(`BMI 분류: 비만2단계`);
    }
    if (profileInfo.length > 0) {
      userContext += `\n## 사용자 프로필:\n${profileInfo.join("\n")}\n`;
    }

    // 성별/연령대별 평균 신체 데이터 삽입
    if (profileData.gender) {
      const genderCode = profileData.gender === "male" ? "M" : "F";
      const age = profileData.age ? Number(profileData.age) : undefined;
      userContext += `\n${formatAverageBodyForPrompt(genderCode as "M" | "F", age)}\n`;
    }
  }

  userContext += `
## 의류 정보:
- 의류명: ${garmentData.name}
- 카테고리: ${garmentData.category}
`;

  // 실측값 우선, 없으면 선택 사이즈 치수표로 보완
  let effectiveMeasurements = garmentData.measurements;
  if (garmentData.selectedSize && Object.keys(garmentData.measurements).length === 0) {
    const genderForChart = (garmentData.gender === "male" || garmentData.gender === "female")
      ? garmentData.gender
      : (profileData?.gender === "male" || profileData?.gender === "female" ? profileData.gender : "");
    effectiveMeasurements = getSizeChart(
      garmentData.category,
      genderForChart as "male" | "female" | "",
      garmentData.selectedSize as import("@/lib/sizeChart").SizeLabel
    );
  }

  const hasMeasurements = Object.keys(effectiveMeasurements).length > 0;

  if (hasMeasurements) {
    const sourceLabel = garmentData.selectedSize && Object.keys(garmentData.measurements).length === 0
      ? `선택 사이즈(${garmentData.selectedSize}) 기준 표준 치수`
      : "실측 수치";
    userContext += `- ${sourceLabel}(cm): ${JSON.stringify(effectiveMeasurements, null, 2)}\n`;
    if (garmentData.selectedSize) {
      userContext += `- 선택 사이즈: ${garmentData.selectedSize}\n`;
    }
  } else {
    userContext += `- 실측 수치: 미제공 (의류 사진 기반으로 추정해주세요)\n`;
  }

  if (garmentImageUrl) {
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: FIT_REPORT_PROMPT,
        },
        {
          role: "user",
          content: [
            { type: "text", text: userContext + "\n\n아래 의류 사진도 참고하여 핏을 분석해주세요:" },
            {
              type: "image_url",
              image_url: { url: garmentImageUrl },
            },
          ],
        },
      ],
      temperature: 0.4,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("핏 리포트 생성 응답이 없습니다");
    return JSON.parse(content) as FitReport;
  }

  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "system",
        content: FIT_REPORT_PROMPT,
      },
      {
        role: "user",
        content: userContext,
      },
    ],
    temperature: 0.4,
    max_tokens: 2048,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("핏 리포트 생성 응답이 없습니다");
  return JSON.parse(content) as FitReport;
}
