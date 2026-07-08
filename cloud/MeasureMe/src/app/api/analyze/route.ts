import { NextRequest, NextResponse } from "next/server";
import { groq } from "@/lib/groq";
import { BODY_ANALYSIS_PROMPT, FIT_REPORT_PROMPT } from "@/lib/prompts";
import { saveAnalysis } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import type { BodyAnalysis, GarmentInput, FitReport } from "@/types";

interface ProfileData {
  height?: string;
  weight?: string;
  gender?: string;
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

    // Step 1: 체형 분석 (Groq Vision) + 프로필 정보 포함
    const bodyAnalysis = await analyzeBody(imageUrl, profileData);

    // Step 2: 핏 리포트 생성 (의류 사진 + 수치 + 체형)
    const fitReport = await generateFitReport(
      bodyAnalysis,
      garmentData,
      garmentImageUrl,
      profileData
    );

    // Step 3: 결과 저장
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

    if (profileInfo.length > 0) {
      promptWithProfile += `\n\n참고할 사용자 프로필 정보:\n${profileInfo.join("\n")}`;
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
  const hasMeasurements = Object.keys(garmentData.measurements).length > 0;

  let userContext = `
## 사용자 체형 분석 결과:
${JSON.stringify(bodyAnalysis, null, 2)}
`;

  if (profileData) {
    const profileInfo = [];
    if (profileData.gender) profileInfo.push(`성별: ${profileData.gender === "male" ? "남성" : "여성"}`);
    if (profileData.height) profileInfo.push(`키: ${profileData.height}cm`);
    if (profileData.weight) profileInfo.push(`몸무게: ${profileData.weight}kg`);
    if (profileInfo.length > 0) {
      userContext += `\n## 사용자 프로필:\n${profileInfo.join("\n")}\n`;
    }
  }

  userContext += `
## 의류 정보:
- 의류명: ${garmentData.name}
- 카테고리: ${garmentData.category}
`;

  if (hasMeasurements) {
    userContext += `- 실측 수치(cm): ${JSON.stringify(garmentData.measurements, null, 2)}\n`;
  } else {
    userContext += `- 실측 수치: 미제공 (의류 사진 기반으로 추정해주세요)\n`;
  }

  // 의류 사진이 있으면 멀티모달로 분석
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

  // 의류 사진 없이 텍스트만으로 분석
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
