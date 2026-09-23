import { prisma } from "@/lib/prisma";
import { getProducts } from "@/lib/products";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const [users, productsResult, orders, coupons, banners] = await Promise.all([
    prisma.user.count(),
    getProducts(),
    prisma.order.count(),
    prisma.coupon.count(),
    prisma.banner.count(),
  ]);
  const products = productsResult.total;

  const revenue = await prisma.order.aggregate({
    _sum: { total: true },
    where: { paymentStatus: "paid" },
  });

  return json({
    stats: {
      users,
      products,
      orders,
      coupons,
      banners,
      revenue: revenue._sum.total || 0,
    },
  });
}
