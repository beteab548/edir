export const dynamic = "force-dynamic"; 
export const revalidate = 0; 
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

function parseFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/); // split on any whitespace

  let first_name = parts[0] || "Unknown";
  let second_name = "";
  let last_name: string | null = null;

  if (parts.length === 1) {
    // Only first name available
    second_name = "Unknown";
  } else if (parts.length === 2) {
    // Two parts: first and second
    second_name = parts[1];
  } else if (parts.length >= 3) {
    // Three or more parts: first, middle(s), last
    last_name = parts[parts.length - 1];
    second_name = parts.slice(1, parts.length - 1).join(" ");
  }

  // Clean trailing spaces from second_name and last_name
  second_name = second_name.trim();
  last_name = last_name?.trim() || null;

  return { first_name, second_name, last_name };
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No valid file uploaded" },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets["Contribution-BF"];

    if (!sheet) {
      return NextResponse.json(
        { error: "Sheet named 'Contribution-BF' not found" },
        { status: 400 }
      );
    }

    // Read the sheet as a 2D array with raw data
    const data = XLSX.utils.sheet_to_json(sheet, {
      header: 1, // get raw rows as arrays
      defval: "", // fill empty cells with empty string instead of undefined
    }) as any[][];

    console.log("📄 Sheet raw data (first 10 rows):", data.slice(0, 10));

    // Extract header from row 4 (index 3)
    const headerRow = data[3];
    if (!headerRow) {
      return NextResponse.json(
        { error: "Header row (row 4) not found or empty" },
        { status: 400 }
      );
    }
    console.log("🧠 Headers:", headerRow);

    // Extract data rows starting from row 5 (index 4)
    const dataRows = data.slice(4);

    // Map rows to JSON objects using header row keys
    const rows = dataRows.map((row) =>
      Object.fromEntries(headerRow.map((key, i) => [key, row[i]]))
    );

    console.log("✅ Parsed rows (first 5):", rows.slice(0, 5));

    let count = 0;

    for (const row of rows) {
      const fullName = row["Members (Principal)"]?.toString().trim();
      const title = row["Title"]?.toString().trim();

      if (!fullName || !title) {
        console.warn("⚠️ Skipped row (missing fields):", row);
        continue;
      }

      const { first_name, second_name, last_name } = parseFullName(fullName);

      console.log("Creating member:", {
        title,
        first_name,
        second_name,
        last_name,
      });

      // await prisma.member.create({
      //   data: {
      //     title,
      //     first_name,
      //     second_name,
      //     last_name: last_name ?? "",
      //     birth_date: new Date(0),
      //     citizen: " ",
      //   },
      // });

      console.log(
        `✅ Imported: ${first_name} ${second_name} ${
          last_name || ""
        } (${title})`
      );
      count++;
    }

    return NextResponse.json({
      message: `✅ Imported ${count} members from 'Contribution-BF'`,
    });
  } catch (err: any) {
    console.error("Error processing file:", err);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
