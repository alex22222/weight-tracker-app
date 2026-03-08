import { createHash } from 'crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

async function resetAllPasswords() {
  const newPassword = '111111'
  const hashedPassword = hashPassword(newPassword)
  
  try {
    // 更新所有用户密码
    const result = await prisma.user.updateMany({
      data: {
        password: hashedPassword,
      },
    })
    
    console.log(`✅ 成功重置 ${result.count} 个用户的密码为 "${newPassword}"`)
  } catch (error) {
    console.error('❌ 重置密码失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAllPasswords()
