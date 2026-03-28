import puppeteer from "puppeteer-core";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("id");

    if (!studentId) {
      return new Response("Missing ID", { status: 400 });
    }

    // ✅ Launch browser
    const browser = await puppeteer.launch({
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    // ✅ Fetch student data from your API
    const res = await fetch(
      `https://www.bnmiindia.org/api/get-student?id=${studentId}`
    );

    if (!res.ok) {
      throw new Error("API fetch failed");
    }

    const studentData = await res.json();

    // ✅ Inject into localStorage (NO CHANGE to your page)
    await page.evaluateOnNewDocument((data) => {
      localStorage.setItem("marksheetStudent", JSON.stringify(data));
    }, studentData);

    // ✅ IMPORTANT: use PUBLIC URL (NOT /login)
    const url = `https://www.bnmiindia.org/beauty-marksheet`;

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 0
    });

    // ✅ WAIT FOR FULL RENDER
    await page.waitForSelector("body");

    await page.waitForFunction(() => {
      return document.body.innerText.length > 100;
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // ✅ Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=marksheet-${studentId}.pdf`
      }
    });

  } catch (err) {
    console.log("PUPPETEER ERROR:", err);
    return new Response("Error generating PDF", { status: 500 });
  }
}