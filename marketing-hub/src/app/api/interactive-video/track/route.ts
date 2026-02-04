import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface TrackingEvent {
  type: string;
  timestamp: number;
  data: unknown;
}

interface TrackingPayload {
  type: 'view' | 'click' | 'branch' | 'completion' | 'hotspot' | 'cta';
  videoId?: string;
  segmentId?: string;
  data: {
    startTime?: number;
    watchTime?: number;
    clicks?: Array<{ type: string; timestamp: number; data: unknown }>;
    branches?: Array<{ from: string; to: string; timestamp: number }>;
    hotspotId?: string;
    ctaId?: string;
    branchId?: string;
    from?: string;
    action?: string;
    text?: string;
  };
  sessionId?: string;
  userAgent?: string;
}

// In-memory storage for demo (replace with database in production)
const trackingData: Map<string, TrackingPayload[]> = new Map();

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const payload: TrackingPayload = await request.json();

    // Validate payload
    if (!payload.type || !payload.data) {
      return NextResponse.json(
        { error: 'Invalid tracking payload' },
        { status: 400 }
      );
    }

    // Add metadata
    const enrichedPayload: TrackingPayload = {
      ...payload,
      sessionId: userId || 'anonymous',
      userAgent: request.headers.get('user-agent') || undefined,
    };

    // Store tracking data
    const sessionId = enrichedPayload.sessionId || 'anonymous';
    if (!trackingData.has(sessionId)) {
      trackingData.set(sessionId, []);
    }
    trackingData.get(sessionId)?.push(enrichedPayload);

    // Log for monitoring (replace with proper logging in production)
    console.log('Tracking event:', {
      type: payload.type,
      sessionId,
      timestamp: new Date().toISOString(),
    });

    // In production, save to database
    // Example with Prisma:
    // await prisma.videoTracking.create({
    //   data: {
    //     userId: userId || null,
    //     type: payload.type,
    //     videoId: payload.videoId,
    //     segmentId: payload.segmentId,
    //     data: payload.data as Prisma.JsonObject,
    //     sessionId: enrichedPayload.sessionId,
    //     userAgent: enrichedPayload.userAgent,
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: 'Tracking data recorded',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json(
      {
        error: 'Failed to record tracking data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId') || userId;
    const type = searchParams.get('type');

    // Retrieve tracking data
    let data = trackingData.get(sessionId) || [];

    // Filter by type if specified
    if (type) {
      data = data.filter((item) => item.type === type);
    }

    // Calculate analytics
    const analytics = calculateAnalytics(data);

    return NextResponse.json({
      success: true,
      sessionId,
      events: data,
      analytics,
    });
  } catch (error) {
    console.error('Failed to retrieve tracking data:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve tracking data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Analytics calculation helper
function calculateAnalytics(data: TrackingPayload[]) {
  const totalEvents = data.length;
  const eventsByType = data.reduce(
    (acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const completionData = data.find((e) => e.type === 'completion');
  const totalWatchTime = completionData?.data.watchTime || 0;

  const clicks = data.filter((e) => e.type === 'click' || e.type === 'hotspot' || e.type === 'cta');
  const branches = data.filter((e) => e.type === 'branch');

  const branchPaths = branches.map((b, index) => ({
    from: b.data.from,
    to: b.data.branchId,
    timestamp: Date.now() + index,
  }));

  return {
    totalEvents,
    eventsByType,
    totalWatchTime,
    clickCount: clicks.length,
    branchCount: branches.length,
    branchPaths,
    engagementRate: totalEvents > 0 ? (clicks.length / totalEvents) * 100 : 0,
  };
}

// Optional: Analytics endpoint
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId') || userId;

    // Clear tracking data for session
    trackingData.delete(sessionId);

    return NextResponse.json({
      success: true,
      message: 'Tracking data cleared',
      sessionId,
    });
  } catch (error) {
    console.error('Failed to delete tracking data:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete tracking data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
