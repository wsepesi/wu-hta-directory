import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { predictCourseOfferings } from '@/lib/course-logic';
import { z } from 'zod';

const predictionSchema = z.object({
  year: z.number().int().min(new Date().getFullYear()).max(new Date().getFullYear() + 2),
  season: z.enum(['fall', 'spring', 'summer']),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const season = searchParams.get('season') || 'fall';

    const validationResult = predictionSchema.safeParse({ year, season });
    if (!validationResult.success) {
      return Response.json(
        { error: 'Invalid parameters', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const predictions = await predictCourseOfferings(
      validationResult.data.year,
      validationResult.data.season as 'fall' | 'spring' | 'summer'
    );

    return Response.json({
      predictions,
      parameters: {
        year: validationResult.data.year,
        season: validationResult.data.season,
      },
    });
  } catch (error) {
    console.error('Failed to get course predictions:', error);
    return Response.json(
      { error: 'Failed to get course predictions' },
      { status: 500 }
    );
  }
}