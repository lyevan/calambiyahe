import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Cloudinary will automatically use the CLOUDINARY_URL from process.env
cloudinary.config({
  secure: true,
});

export const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "calambiyahe/hazards",
    allowed_formats: ["jpg", "png", "jpeg"],
    public_id: (req: any, file: any) => `hazard-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
  } as any,
});

export default cloudinary;
