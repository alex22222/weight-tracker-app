import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter, MessageType } from '../../../../lib/db-adapter'
import { resolveFileUrl } from '../../../../lib/cloudbase'
import { generateToken, hashPassword } from '../../../../lib/auth'
import { pointsService } from '../../../../lib/points-service'

export const dynamic = 'force-dynamic'

// 微信登录配置 - 硬编码避免 CloudRun 环境变量注入问题
const WECHAT_APPID = 'wxa3591edcdc8d4551'
const WECHAT_SECRET = 'ba3a06ee13ac030da702d31cb3799280'

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
      // ===== 创建新用户 =====
      // 生成默认用户名（wx_ + openid后8位）
      const defaultUsername = `wx_${openid.slice(-8)}`
      // 默认密码 111111
      const defaultPassword = hashPassword('111111')
      
      const nickname = userInfo?.nickName || `微信用户${openid.slice(-6)}`
      const avatar = userInfo?.avatarUrl || null
      const gender = userInfo?.gender === 1 ? 'male' : userInfo?.gender === 2 ? 'female' : null

      // 使用 createUser 创建带用户名和密码的用户
      user = await adapter.createUser({
        username: defaultUsername,
        password: defaultPassword,
        gender: gender || 'male',
      })

      // 更新微信相关信息
      if (user.id) {
        await adapter.updateUser(user.id, {
          wechatOpenId: openid,
          wechatUnionId: unionid || null,
          nickname,
          avatar,
        })
        
        // 重新获取完整用户信息
        const updatedUser = await adapter.getUserById(user.id)
        if (updatedUser) {
          user = updatedUser
        }

        // 创建用户设置
        if (user.id) {
          await adapter.createUserSettings({
            userId: user.id,
            height: 170,
            targetWeight: 65,
          })
        }
      }

      isNewUser = true

      // 发送欢迎消息
      await adapter.createMessage({
        type: MessageType.SYSTEM_LOGIN,
        content: `欢迎使用体重管理器！您的微信账号已绑定成功。默认用户名：${defaultUsername}，密码：111111（可在设置中修改）`,
        senderId: 0,
        receiverId: user.id,
      })
    } else {
      // ===== 更新现有用户信息 =====
      const updateData: any = {}
      
      if (userInfo) {
        // 昵称：只有用户未设置昵称，或前端传了真实的微信昵称（非默认值）时才更新
        if (userInfo.nickName) {
          const isDefaultNickname = userInfo.nickName === '微信用户'
          if (!user.nickname && !isDefaultNickname) {
            // 用户从未设置过昵称，且前端传了真实昵称 → 使用微信昵称
            updateData.nickname = userInfo.nickName
          } else if (user.nickname && !isDefaultNickname && userInfo.nickName !== user.nickname) {
            // 用户已设置昵称，前端传了新的真实昵称（非默认值）→ 更新
            updateData.nickname = userInfo.nickName
          }
          // 如果前端传的是默认值'微信用户'，且用户已有自定义昵称 → 不覆盖，保留用户昵称
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
      }
      
      // 更新最后登录时间
      updateData.lastLoginAt = new Date()

      if (Object.keys(updateData).length > 0 && user.id) {
        await adapter.updateUser(user.id, updateData)
        user = { ...user, ...updateData }
      }

      // 发送登录提醒
      if (user?.id) {
        await adapter.createMessage({
          type: MessageType.SYSTEM_LOGIN,
          content: `您的账号于 ${new Date().toLocaleString('zh-CN')} 登录成功`,
          senderId: 0,
          receiverId: user.id,
        })
      }
    }

    // 发放登录积分（异步，不阻塞登录）
    if (user?.id) {
      pointsService.handleLoginPoints(user.id).then((pointsLog) => {
        if (pointsLog) {
          console.log(`[Points] User ${user.id} earned ${pointsLog.points} points for login`)
        }
      }).catch(err => {
        console.error('[Points] Error awarding login points:', err)
      })
    }

    // 生成 token
    if (!user?.id) {
      return NextResponse.json({ error: '用户数据异常' }, { status: 500 })
    }
    
    // 使用 username 生成 token（如果没有则使用生成的默认用户名）
    const tokenUsername = user.username || user.nickname || '微信用户'
    const token = generateToken(String(user.id), tokenUsername)

    // 将 fileID 转换为临时 URL
    const avatarUrl = user.avatar ? await resolveFileUrl(user.avatar) : null

    // 返回用户信息
    return NextResponse.json({
      message: isNewUser ? '注册成功' : '登录成功',
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        username: user.username,  // 确保返回 username
        avatar: avatarUrl,
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
