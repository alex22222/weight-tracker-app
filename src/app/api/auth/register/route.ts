import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adapter } from '../../../../lib/db-adapter'
import { hashPassword, generateToken, validators } from '../../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    const usernameValidation = validators.username(username)
    if (!usernameValidation.valid) {
      return NextResponse.json({ error: usernameValidation.message }, { status: 400 })
    }

    const passwordValidation = validators.password(password)
    if (!passwordValidation.valid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 })
    }

    const existingUser = await adapter.findUserByUsername(username)
    if (existingUser) {
      return NextResponse.json({ error: '用户名已被注册' }, { status: 409 })
    }

    const hashedPassword = hashPassword(password)
    const user = await adapter.createUser({
      username,
      password: hashedPassword,
      gender: 'male',
    })

    if (!user.id) {
      return NextResponse.json({ error: '创建用户失败' }, { status: 500 })
    }

    await adapter.createUserSettings({
      userId: user.id,
      height: 170,
      targetWeight: 65,
    })

    const token = generateToken(String(user.id), user.username || username)

    return NextResponse.json({
      message: '注册成功',
      token,
      user: { id: user.id, username: user.username, createdAt: user.createdAt, isNewUser: true }
    }, { status: 201 })
  } catch (error) {
    console.error('[API /auth/register] Error:', error)
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 })
  }
}
