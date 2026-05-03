// 邮件发送服务
// 支持 nodemailer SMTP 发送，未配置时降级为日志输出

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
  from: string
}

function getEmailConfig(): EmailConfig | null {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM

  if (!host || !user || !pass) {
    return null
  }

  return {
    host,
    port: parseInt(port || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass },
    from: from || user,
  }
}

export async function sendVerificationCode(email: string, code: string, purpose: 'register' | 'reset'): Promise<{ success: boolean; message: string }> {
  const config = getEmailConfig()
  const purposeText = purpose === 'register' ? '注册' : '密码重置'
  const subject = `搭子 - ${purposeText}验证码`
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #fff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="font-size: 48px; margin-bottom: 8px;">⚖️</div>
        <h1 style="font-size: 24px; color: #1e293b; margin: 0;">搭子</h1>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="font-size: 16px; color: #334155; margin: 0 0 16px 0;">您的${purposeText}验证码是：</p>
        <div style="font-size: 36px; font-weight: 700; color: #f97316; text-align: center; letter-spacing: 8px; margin: 24px 0;">${code}</div>
        <p style="font-size: 14px; color: #94a3b8; margin: 0;">验证码 10 分钟内有效，请勿泄露给他人。</p>
      </div>
      <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">如非本人操作，请忽略此邮件。</p>
    </div>
  `

  // 如果有 SMTP 配置，尝试发送邮件
  if (config) {
    try {
      // 动态导入 nodemailer，避免未安装时构建失败
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
      })

      await transporter.sendMail({
        from: `"搭子" <${config.from}>`,
        to: email,
        subject,
        html,
      })

      return { success: true, message: '验证码已发送' }
    } catch (err) {
      console.error('[Email] SMTP send failed:', err)
      // 降级到日志输出
    }
  }

  // 未配置 SMTP 时，输出到日志（开发/测试环境）
  console.log(`\n========== 验证码邮件 (${purposeText}) ==========`)
  console.log(`收件人: ${email}`)
  console.log(`验证码: ${code}`)
  console.log(`===========================================\n`)

  return {
    success: true,
    message: config ? '邮件发送失败，请查看服务器日志获取验证码' : '邮件服务未配置，请查看服务器日志获取验证码',
  }
}
