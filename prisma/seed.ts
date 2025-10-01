import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create admin user
  const adminEmail = 'sdillon215@gmail.com'
  const adminPassword = 'admin123' // You can change this default password
  
  // Check if admin user already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log('👤 Admin user already exists')
    return
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 12)

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: adminEmail,
      password: hashedPassword,
      emailVerified: new Date(), // Mark as verified
    }
  })

  console.log('✅ Admin user created successfully!')
  console.log(`📧 Email: ${adminEmail}`)
  console.log(`🔑 Password: ${adminPassword}`)
  console.log(`🆔 User ID: ${adminUser.id}`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('🔌 Database connection closed')
  })
