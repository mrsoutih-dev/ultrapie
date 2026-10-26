import { NextRequest, NextResponse } from 'next/server';
import { activateUserSubscription, findUserByEmail } from '@/lib/user-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, plan = 'PRO' } = body;

    if (!email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    const validPlans: Array<'STARTER' | 'PRO' | 'BUSINESS'> = ['STARTER', 'PRO', 'BUSINESS'];
    const chosenPlan = validPlans.includes(plan.toUpperCase()) ? plan.toUpperCase() : 'PRO';

    const user = activateUserSubscription(email, chosenPlan);

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSubscribed: user.isSubscribed,
      plan: user.plan,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    };

    return NextResponse.json({
      success: true,
      message: `Monthly subscription activated successfully! You now have full access on the ${chosenPlan} plan.`,
      user: safeUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Subscription activation failed' },
      { status: 400 }
    );
  }
}
