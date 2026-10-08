import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service.js';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let subscriptionsRepo: {
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let ordersRepo: {
    findOne: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let workspacesRepo: { save: ReturnType<typeof vi.fn> };
  let membersRepo: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  let usersRepo: { findOne: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    subscriptionsRepo = { findOne: vi.fn(), save: vi.fn() };
    ordersRepo = { findOne: vi.fn(), find: vi.fn(), save: vi.fn() };
    workspacesRepo = { save: vi.fn() };
    membersRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
      count: vi.fn(),
    };
    usersRepo = { findOne: vi.fn() };

    service = new SubscriptionsService(
      subscriptionsRepo as never,
      ordersRepo as never,
      workspacesRepo as never,
      membersRepo as never,
      usersRepo as never,
    );
  });

  it('createOrder برای پلن رایگان خطا می‌دهد', async () => {
    await expect(
      service.createOrder('user-1', {
        planKey: 'free',
        billingPeriodKey: '3m',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('createOrder سفارش pending می‌سازد', async () => {
    ordersRepo.save.mockImplementation(async (value: unknown) => ({
      ...(value as object),
      id: 'order-1',
      createdAt: new Date(),
      paidAt: null,
    }));

    const order = await service.createOrder('user-1', {
      planKey: 'plus',
      billingPeriodKey: '1y',
    });

    expect(order.status).toBe('pending_payment');
    expect(order.monthsGranted).toBe(14);
    expect(order.amountToman).toBe(149_000 * 12);
  });
});
