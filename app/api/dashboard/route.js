import { prisma } from "@/lib/prisma";
import { getProducts } from "@/lib/products";
import { json } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const productsResult = await getProducts();
  const products = productsResult.total || 0;

  try {
    const [users, orders, coupons, banners] = await Promise.all([
      prisma.user.count(),
      prisma.order.count(),
      prisma.coupon.count(),
      prisma.banner.count(),
    ]);

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
        revenue: revenue._sum?.total || 0,
      },
    });
  } catch (error) {
    console.warn("Database offline for dashboard stats, returning fallback:", error?.message || error);
    return json({
      stats: {
        users: 1,
        products,
        orders: 0,
        coupons: 0,
        banners: 0,
        revenue: 0,
      },
    });
  }
}

