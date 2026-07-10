import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["CUSTOMER", "ADMIN"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  otp: z.string().regex(/^\d{6}$/).optional(),
});

export const productSchema = z.object({
  slug: z.string().min(2),
  name: z.string().min(2),
  description: z.string().min(10),
  category: z.string().min(1),
  subCategory: z.string().min(1),
  collection: z.string().min(1),
  fabric: z.string().min(1),
  price: z.number().int().nonnegative(),
  mrp: z.number().int().nonnegative().optional(),
  stock: z.number().int().nonnegative().default(0),
  images: z.array(z.string().url().or(z.string().startsWith("/"))).min(1),
  sizes: z.array(z.string().min(1)).optional(),
  sizeCharges: z.record(z.string().min(1), z.number().int().nonnegative()).optional(),
  clothCare: z.string().optional(),
  termsAndConditions: z.string().optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const couponSchema = z.object({
  code: z.string().min(2).transform((v) => v.toUpperCase()),
  title: z.string().min(2),
  description: z.string().optional(),
  type: z.enum(["PERCENT", "FLAT"]),
  value: z.number().int().positive(),
  minOrderValue: z.number().int().nonnegative().optional(),
  maxDiscount: z.number().int().nonnegative().optional(),
  active: z.boolean().optional(),
});

export const bannerSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  mediaType: z.enum(["image", "video"]).optional(),
  link: z.string().optional(),
  active: z.boolean().optional(),
  position: z.number().int().nonnegative().optional(),
});

export const razorpayOrderSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().default("INR"),
  receipt: z.string().optional(),
  orderId: z.string().optional(),
});
