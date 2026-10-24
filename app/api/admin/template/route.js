import { generateExcelTemplate } from "@/lib/excel-parser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const buffer = generateExcelTemplate();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          'attachment; filename="heer-ranjha-products-template.xlsx"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to generate template: " + error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
