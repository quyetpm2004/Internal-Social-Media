import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();
export const sendResetPasswordEmail = async (
  email: string,
  resetLink: string,
) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("Không có api của resend!");
  }

  const resend = new Resend(resendApiKey);

  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: email,
    subject: "Đặt lại mật khẩu",
    html: `
      <h2>Đặt lại mật khẩu</h2>

      <p>
        Nhấn vào link bên dưới:
      </p>

      <a href="${resetLink}">
        Đặt lại mật khẩu
      </a>

      <p>
        Link có hiệu lực trong 15 phút.
      </p>
    `,
  });
};
