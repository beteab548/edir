import { NextRequest } from "next/server";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json(); // use fetch API to get JSON body

    const { file, fileName } = body;

    if (!file || !fileName) {
      return new Response(
        JSON.stringify({ message: "Missing file or fileName" }),
        {
          status: 400,
        }
      );
    }

    const result = await imagekit.upload({
      file,
      fileName,
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
