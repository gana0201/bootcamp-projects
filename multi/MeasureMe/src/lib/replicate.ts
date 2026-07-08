import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function virtualTryOn(
  humanImageUrl: string,
  garmentImageUrl: string
): Promise<string> {
  const output = await replicate.run(
    "cuuupid/idm-vton:0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985",
    {
      input: {
        human_img: humanImageUrl,
        garm_img: garmentImageUrl,
        garment_des: "clothing item",
      },
    }
  );

  // output은 보통 URL string 또는 URL 배열
  if (typeof output === "string") {
    return output;
  }
  if (Array.isArray(output) && output.length > 0) {
    return String(output[0]);
  }
  // FileOutput 등 다른 형태
  return String(output);
}
