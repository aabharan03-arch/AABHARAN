// app/api/notify-plan-expired/route.ts

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "https://aabharan03.vercel.app",
  "https://www.aabharan.in",
  "https://aabharan.in",
];

// ---------------------------------------------------------
// CORS HEADERS
// ---------------------------------------------------------

function getCorsHeaders(origin: string | null) {
  const isAllowed = !!origin && allowedOrigins.includes(origin);

  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
}

// ---------------------------------------------------------
// OPTIONS
// ---------------------------------------------------------

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

// ---------------------------------------------------------
// HTML ESCAPE
// ---------------------------------------------------------

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------------------------------------------------------
// VERIFY ADMIN JWT TOKEN
// ---------------------------------------------------------

function verifyAdminToken(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      console.error("Authorization header missing.");
      return null;
    }

    if (!authHeader.startsWith("Bearer ")) {
      console.error("Invalid authorization header format.");
      return null;
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      console.error("Admin token missing.");
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured.");
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret);

    return decoded;
  } catch (error) {
    console.error("ADMIN TOKEN VERIFICATION ERROR:", error);

    return null;
  }
}

// ---------------------------------------------------------
// POST
// ---------------------------------------------------------

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  const corsHeaders = getCorsHeaders(origin);

  try {
    // -----------------------------------------------------
    // 1. CHECK ORIGIN
    // -----------------------------------------------------

    if (!origin || !allowedOrigins.includes(origin)) {
      return NextResponse.json(
        {
          success: false,
          error: "Origin not allowed.",
        },
        {
          status: 403,
          headers: corsHeaders,
        }
      );
    }

    // -----------------------------------------------------
    // 2. VERIFY ADMIN TOKEN
    // -----------------------------------------------------

    const admin = verifyAdminToken(request);

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized. Invalid or expired admin token.",
        },
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    console.log("AUTHORIZED ADMIN:", admin);

    // -----------------------------------------------------
    // 3. READ REQUEST BODY
    // -----------------------------------------------------

    const body = await request.json();

    const storeName = String(body?.storeName || "").trim();

    const email = String(body?.email || "")
      .trim()
      .toLowerCase();

    const planName = String(body?.planName || "").trim();

    const expiryDate = String(body?.expiryDate || "").trim();

    // -----------------------------------------------------
    // 4. VALIDATE REQUIRED DATA
    // -----------------------------------------------------

    if (!storeName || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Store name and store admin email are required.",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // -----------------------------------------------------
    // 5. VALIDATE EMAIL
    // -----------------------------------------------------

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide a valid store admin email address.",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // -----------------------------------------------------
    // 6. INPUT LENGTH VALIDATION
    // -----------------------------------------------------

    if (
      storeName.length > 200 ||
      planName.length > 200 ||
      expiryDate.length > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Input is too long.",
        },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // -----------------------------------------------------
    // 7. EMAIL ENVIRONMENT VARIABLES
    // -----------------------------------------------------

    const emailUser = process.env.EMAIL_USER?.trim();

    const emailAppPassword =
      process.env.EMAIL_APP_PASSWORD?.trim();

    const adminEmail =
      process.env.ADMIN_EMAIL?.trim() || emailUser;

    const supportPhone =
      process.env.SUPPORT_PHONE?.trim();

    if (!emailUser || !emailAppPassword || !adminEmail) {
      console.error("Missing email environment variables.");

      return NextResponse.json(
        {
          success: false,
          error: "Email service is not configured.",
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // -----------------------------------------------------
    // 8. CREATE EMAIL TRANSPORTER
    // -----------------------------------------------------

    const transporter = nodemailer.createTransport({
      service: "gmail",

      auth: {
        user: emailUser,
        pass: emailAppPassword,
      },
    });

    // -----------------------------------------------------
    // 9. PREPARE PLAN DATA
    // -----------------------------------------------------

    const planLabel =
      planName && planName !== "-"
        ? planName
        : "membership";

    const expiryText =
      expiryDate && expiryDate !== "-"
        ? ` on ${expiryDate}`
        : "";

    // -----------------------------------------------------
    // 10. TEXT EMAIL
    // -----------------------------------------------------

    const text = [
      `Hello ${storeName},`,
      "",
      `Your Aabharan ${planLabel} plan has expired${expiryText}.`,
      "",
      "To keep your store active on Aabharan, please contact us to renew your plan.",
      "",
      `Email: ${adminEmail}`,
      ...(supportPhone
        ? [`Phone: ${supportPhone}`]
        : []),
      "",
      "Thank you,",
      "Team Aabharan",
    ].join("\n");

    // -----------------------------------------------------
    // 11. HTML EMAIL
    // -----------------------------------------------------

    const html = `
      <div
        style="
          font-family: Arial, Helvetica, sans-serif;
          max-width: 640px;
          margin: 0 auto;
          color: #111827;
          background: #ffffff;
        "
      >
        <div
          style="
            background: #04091e;
            padding: 26px;
            border-radius: 16px 16px 0 0;
          "
        >
          <h2
            style="
              margin: 0;
              color: #ffffff;
              font-size: 24px;
            "
          >
            Your plan has expired
          </h2>

          <p
            style="
              margin: 7px 0 0;
              color: #d1d5db;
              font-size: 14px;
            "
          >
            Aabharan
          </p>
        </div>

        <div
          style="
            border: 1px solid #e5e7eb;
            border-top: none;
            padding: 26px;
            border-radius: 0 0 16px 16px;
          "
        >
          <p
            style="
              margin: 0 0 15px;
              line-height: 1.6;
            "
          >
            Hello
            <strong>
              ${escapeHtml(storeName)}
            </strong>,
          </p>

          <p
            style="
              margin: 0 0 15px;
              line-height: 1.7;
              color: #374151;
            "
          >
            Your Aabharan
            <strong>
              ${escapeHtml(planLabel)}
            </strong>
            plan has expired${escapeHtml(expiryText)}.
          </p>

          <p
            style="
              margin: 0;
              line-height: 1.7;
              color: #374151;
            "
          >
            To keep your store active on Aabharan,
            please contact us to renew your plan.
          </p>

          <div
            style="
              margin-top: 24px;
              padding: 18px;
              background: #f9f7ee;
              border-radius: 12px;
              line-height: 1.9;
            "
          >
            <div
              style="
                font-weight: 700;
                color: #111827;
                margin-bottom: 6px;
              "
            >
              Contact us to renew
            </div>

            <div>
              Email:
              <a
                href="mailto:${escapeHtml(adminEmail)}"
                style="
                  color: #1d4ed8;
                  text-decoration: none;
                "
              >
                ${escapeHtml(adminEmail)}
              </a>
            </div>

            ${
              supportPhone
                ? `
                  <div>
                    Phone:
                    ${escapeHtml(supportPhone)}
                  </div>
                `
                : ""
            }
          </div>

          <p
            style="
              margin: 24px 0 0;
              color: #6b7280;
              font-size: 13px;
              line-height: 1.6;
            "
          >
            Thank you,
            <br />
            Team Aabharan
          </p>
        </div>
      </div>
    `;

    // -----------------------------------------------------
    // 12. SEND EMAIL
    // -----------------------------------------------------

    await transporter.sendMail({
      from: `"Aabharan" <${emailUser}>`,

      to: email,

      replyTo: adminEmail,

      subject:
        "Your Aabharan plan has expired – please renew",

      text,

      html,
    });

    // -----------------------------------------------------
    // 13. SUCCESS RESPONSE
    // -----------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: `Plan expiry email sent successfully to ${email}.`,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error(
      "NOTIFY PLAN EXPIRED API ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to send the email right now. Please try again.",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}