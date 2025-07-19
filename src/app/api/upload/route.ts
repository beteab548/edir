export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextRequest } from "next/server";
import ImageKit from "imagekit";
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { file, fileName, type } = body;

    if (!file || !fileName || !type) {
      return new Response(
        JSON.stringify({ message: "Missing file, fileName, or type" }),
        {
          status: 400,
        }
      );
    }
    const allowedTypes = ["profile", "receipt", "document"];
    const folder = allowedTypes.includes(type) ? `/${type}` : "/others";

    const result = await imagekit.upload({
      file,
      fileName,
      folder,
    });
    return new Response(
      JSON.stringify({ Url: result.url, fileId: result.fileId }),
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ message: "Upload failed", error: error.message }),
      {
        status: 500,
      }
    );
  }
}
