import { PrismaClient } from '@prisma/client'
import { addMonths, differenceInCalendarMonths, startOfMonth } from 'date-fns'

const prisma = new PrismaClient()

export async function generateContributionSchedules() {
  const activeMembers = await prisma.member.findMany({
    where: { status: 'Active' },
    include: {
      Contribution: {
        include: {
          contributionType: true
        }
      }
    }
  })

  const scheduleData = []

  for (const member of activeMembers) {
    for (const contribution of member.Contribution) {
      const { contributionType } = contribution

      if (!contributionType.is_active) continue
      if (!contribution.start_date || !contribution.end_date) continue

      const start = startOfMonth(contribution.start_date)
      const end = startOfMonth(contribution.end_date)

      const totalMonths = differenceInCalendarMonths(end, start) + 1
      if (totalMonths <= 0) continue

      for (let i = 0; i < totalMonths; i++) {
        const scheduleMonth = addMonths(start, i)

        const existing = await prisma.contributionSchedule.findFirst({
          where: {
            member_id: member.id,
            contribution_id: contribution.id,
            month: scheduleMonth,
          }
        })

        if (!existing) {
          scheduleData.push({
            contribution_id: contribution.id,
            member_id: member.id,
            month: scheduleMonth,
            paid_amount: 0,
            is_paid: false,
          })
        }
      }
    }
  }

  if (scheduleData.length > 0) {
    await prisma.contributionSchedule.createMany({ data: scheduleData })
    console.log(`✅ Created ${scheduleData.length} contribution schedules.`)
  } else {
    console.log('📭 No new contribution schedules to create.')
  }
}
