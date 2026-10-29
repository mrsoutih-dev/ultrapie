import { NextRequest, NextResponse } from 'next/server';
import {
  getDatabases,
  getDatabaseById,
  provisionDatabase,
  executeDatabaseQuery,
  deleteDatabase,
} from '@/lib/hosting/managed-databases';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const db = getDatabaseById(id);
      if (!db) {
        return NextResponse.json({ error: 'Database not found' }, { status: 404 });
      }
      return NextResponse.json({ database: db });
    }

    const databases = getDatabases();
    return NextResponse.json({
      databases,
      total: databases.length,
      postgresCount: databases.filter((d) => d.type === 'postgresql').length,
      redisCount: databases.filter((d) => d.type === 'redis').length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to fetch databases' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type = 'postgresql', attachedAppId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Database name is required' }, { status: 400 });
    }

    const newDb = provisionDatabase({
      name,
      type,
      attachedAppId,
    });

    return NextResponse.json({
      success: true,
      database: newDb,
      message: `${newDb.version} provisioned successfully!`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to provision database' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, query } = body;

    if (!id) {
      return NextResponse.json({ error: 'Database ID is required' }, { status: 400 });
    }

    if (action === 'query') {
      if (!query) {
        return NextResponse.json({ error: 'Query string is required' }, { status: 400 });
      }
      const execution = executeDatabaseQuery(id, query, {
        allowDestructive: Boolean(body.allowDestructive),
      });
      return NextResponse.json({
        success: execution.success,
        result: execution.result,
        durationMs: execution.durationMs,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to execute database operation' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Database ID is required' }, { status: 400 });
    }

    const deleted = deleteDatabase(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Database not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Database deleted successfully' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to delete database' },
      { status: 500 }
    );
  }
}
