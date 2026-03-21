import { NextResponse } from 'next/dist/server/web/spec-extension/response'
import type { NextRequest } from 'next/dist/server/web/spec-extension/request'
import { adapter, MessageType } from '../../../../lib/db-adapter'
import { generateToken } from '../../../../lib/auth'

// 微信登录配置
const WECHAT_APPID = process.env.WECHAT_APPID || ''
const WECHAT_SECRET = process.env.WECHAT_SECRET || ''

// POST /api/auth/wechat-login - 微信小程序登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, userInfo } = body

    // 输入验证
    if (!code) {
      return NextResponse.json(
        { error: '缺少登录凭证 code' },
        { status: 400 }
      )
    }

    // 调用微信接口获取 OpenID 和 SessionKey
    const wechatRes = await fetch(
      `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`
    )

    const wechatData = await wechatRes.json()

    if (wechatData.errcode) {
      console.error('WeChat API error:', wechatData)
      return NextResponse.json(
        { error: '微信登录失败', detail: wechatData.errmsg },
        { status: 400 }
      )
    }

    const { openid, unionid, session_key } = wechatData

    if (!openid) {
      return NextResponse.json(
        { error: '获取微信用户信息失败' },
        { status: 400 }
      )
    }

    // 查找或创建用户
    let user = await adapter.findUserByWechatOpenId(openid)
    let isNewUser = false

    if (!user) {
      // 创建新用户
      const nickname = userInfo?.nickName || `微信用户${openid.slice(-6)}`
      const avatar = userInfo?.avatarUrl || null
      const gender = userInfo?.gender === 1 ? 'male' : userInfo?.gender === 2 ? 'female' : null

      user = await adapter.createWechatUser({
        wechatOpenId: openid,
        wechatUnionId: unionid || null,
        nickname,
        avatar,
        gender,
        role: 'user',
      })

      isNewUser = true

      // 发送欢迎消息
      await adapter.createMessage({
        type: MessageType.SYSTEM_LOGIN,
        content: `欢迎使用体重管理器！您的微信账号已绑定成功。`,
        senderId: 0, // 系统消息
        receiverId: user.id,
      })
    } else {
      // 更新用户信息（如果提供了新的用户信息）
      if (userInfo) {
        const updateData: any = {}
        if (userInfo.nickName && userInfo.nickName !== user.nickname) {
          updateData.nickname = userInfo.nickName
        }
        if (userInfo.avatarUrl && userInfo.avatarUrl !== user.avatar) {
          updateData.avatar = userInfo.avatarUrl
        }
        if (userInfo.gender) {
          const gender = userInfo.gender === 1 ? 'male' : userInfo.gender === 2 ? 'female' : null
          if (gender && gender !== user.gender) {
            updateData.gender = gender
          }
        }

        if (Object.keys(updateData).length > 0 && user.id) {
          await adapter.updateUser(user.id, updateData)
          user = { ...user, ...updateData }
        }
      }

      // 更新最后登录时间
      if (user?.id) {
        await adapter.updateUserLoginTime(user.id)
      }

      // 发送登录提醒
      if (user?.lastLoginAt && user?.id) {
        const lastLoginTime = new Date(user.lastLoginAt).toLocaleString('zh-CN')
        await adapter.createMessage({
          type: MessageType.SYSTEM_LOGIN,
          content: `您的账号于 ${new Date().toLocaleString('zh-CN')} 登录。上次登录时间：${lastLoginTime}`,
          senderId: 0, // 系统消息
          receiverId: user.id,
        })
      }
    }

    // 生成安全 token
    if (!user?.id) {
      return NextResponse.json({ error: '用户数据异常' }, { status: 500 })
    }
    const token = generateToken(typeof user.id === 'string' ? parseInt(user.id) || 0 : user.id, user.nickname || user.username || '微信用户')

    // 返回用户信息
    return NextResponse.json({
      message: isNewUser ? '注册成功' : '登录成功',
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        username: user.username,
        avatar: user.avatar,
        gender: user.gender,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: new Date(),
        isNewUser,
      },
    })
  } catch (error) {
    console.error('Error in wechat login:', error)
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    )
  }
}
