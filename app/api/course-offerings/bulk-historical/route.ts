import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { courseOfferingRepository } from '@/lib/repositories/course-offerings'
import { userRepository } from '@/lib/repositories/users'
import { z } from 'zod'
import { CreateCourseOfferingInput } from '@/lib/types'
import { createLogger } from '@/lib/logger'

const logger = createLogger('bulk-historical-api')

const bulkHistoricalSchema = z.object({
  offerings: z.array(z.object({
    courseId: z.string().uuid(),
    professorId: z.string().uuid().nullable().optional(),
    year: z.number().min(2000).max(2100),
    season: z.enum(['Spring', 'Fall']),
    semester: z.string()
  }))
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  logger.info('Starting bulk historical offerings creation')
  
  try {
    logger.debug('Getting session')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      logger.warn('Unauthorized request - no session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.debug('Finding user by email', { email: session.user.email })
    const user = await userRepository.findByEmail(session.user.email)
    
    if (!user || user.role !== 'admin') {
      logger.warn('Forbidden - user not admin', { userId: user?.id, role: user?.role })
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    logger.debug('Parsing request body')
    const body = await request.json()
    logger.debug('Request body size', { offeringsCount: body.offerings?.length })
    
    const validation = bulkHistoricalSchema.safeParse(body)
    
    if (!validation.success) {
      logger.error('Validation failed', undefined, { errors: validation.error.flatten() })
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { offerings } = validation.data
    logger.info('Processing offerings', { count: offerings.length })

    // Prepare offerings for creation
    logger.debug('Preparing offerings for creation')
    const offeringsToCreate: CreateCourseOfferingInput[] = offerings.map(offering => ({
      courseId: offering.courseId,
      professorId: offering.professorId || undefined,
      year: offering.year,
      season: offering.season,
      semester: offering.semester,
      updatedBy: user.id
    }))

    // Create offerings with duplicate checking
    logger.info('Calling createHistoricalBatch', { 
      offeringsCount: offeringsToCreate.length,
      sample: offeringsToCreate[0] 
    })
    const createStartTime = Date.now()
    const result = await courseOfferingRepository.createHistoricalBatch(offeringsToCreate)
    const createDuration = Date.now() - createStartTime
    
    logger.info('createHistoricalBatch completed', { 
      duration: createDuration,
      created: result.created,
      skipped: result.skipped
    })

    const totalDuration = Date.now() - startTime
    logger.info('Request completed', { 
      totalDuration,
      created: result.created,
      skipped: result.skipped
    })

    return NextResponse.json({
      created: result.created,
      skipped: result.skipped,
      offerings: result.offerings
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Error creating bulk historical offerings', error as Error, { duration })
    console.error('Error creating bulk historical offerings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create offerings' },
      { status: 500 }
    )
  }
}