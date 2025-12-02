import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { list, del } from '@vercel/blob'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear all data from database
  console.log('🗑️  Clearing database...')
  
  // Delete in order to respect foreign key constraints
  await prisma.gift.deleteMany({})
  await prisma.account.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.verificationToken.deleteMany({})
  await prisma.user.deleteMany({})
  
  console.log('✅ Database cleared!')

  // Clear blob storage
  console.log('🗑️  Clearing blob storage...')
  try {
    const { blobs } = await list()
    console.log(`📦 Found ${blobs.length} blobs to delete`)
    
    for (const blob of blobs) {
      await del(blob.url)
      console.log(`   Deleted: ${blob.url}`)
    }
    console.log('✅ Blob storage cleared!')
  } catch (error) {
    console.warn('⚠️  Could not clear blob storage (this is okay if BLOB_READ_WRITE_TOKEN is not set):', error)
  }

  // Create first admin user
  console.log('👤 Creating admin users...')
  
  const admin1Email = 'sdillon215@gmail.com'
  const admin1Password = 'happybirthday'
  const admin1Name = 'Sean Dillon'
  
  const hashedPassword1 = await bcrypt.hash(admin1Password, 12)
  
  const admin1 = await prisma.user.create({
    data: {
      name: admin1Name,
      email: admin1Email,
      password: hashedPassword1,
      emailVerified: new Date(),
    }
  })

  console.log('✅ Admin user 1 created!')
  console.log(`   📧 Email: ${admin1Email}`)
  console.log(`   👤 Name: ${admin1Name}`)
  console.log(`   🔑 Password: ${admin1Password}`)
  console.log(`   🆔 User ID: ${admin1.id}`)

  // Create second admin user
  const admin2Email = 'ashley.n22.johnson@gmail.com'
  const admin2Password = 'itsmybirthday'
  const admin2Name = 'Ashley Johnson'
  
  const hashedPassword2 = await bcrypt.hash(admin2Password, 12)
  
  const admin2 = await prisma.user.create({
    data: {
      name: admin2Name,
      email: admin2Email,
      password: hashedPassword2,
      emailVerified: new Date(),
    }
  })

  console.log('✅ Admin user 2 created!')
  console.log(`   📧 Email: ${admin2Email}`)
  console.log(`   👤 Name: ${admin2Name}`)
  console.log(`   🔑 Password: ${admin2Password}`)
  console.log(`   🆔 User ID: ${admin2.id}`)

  console.log('🎉 Seeding completed successfully!')
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
