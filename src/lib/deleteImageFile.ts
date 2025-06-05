import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT!,
});

export const deleteImageFromImageKit = async (fileId: string) => {
  try {
    const response = await imagekit.deleteFile(fileId);
    return response;
  } catch (error) {
    console.error("Failed to delete image:", error);
    throw error;
  }
};