import { describe, expect, it } from 'vitest';

import { isFeatureEnabled, getEnabledFeatures } from './is-feature-enabled.js';



describe('isFeatureEnabled', () => {

  it('فعال‌سازی فیچر plus برای tier plus', () => {

    expect(

      isFeatureEnabled('meeting.record', { tier: 'plus', isDev: false }),

    ).toBe(true);

  });



  it('غیرفعال بودن AI برای tier free', () => {

    expect(

      isFeatureEnabled('meeting.record', { tier: 'free', isDev: false }),

    ).toBe(false);

  });



  it('غیرفعال بودن share برای tier free', () => {

    expect(

      isFeatureEnabled('notes.share', { tier: 'free', isDev: false }),

    ).toBe(false);

  });



  it('فعال‌سازی share برای tier plus', () => {

    expect(

      isFeatureEnabled('notes.share', { tier: 'plus', isDev: false }),

    ).toBe(true);

  });



  it('اتصال extended فقط در pro', () => {

    expect(

      isFeatureEnabled('meeting.connect.extended', { tier: 'plus', isDev: false }),

    ).toBe(false);

    expect(

      isFeatureEnabled('meeting.connect.extended', { tier: 'pro', isDev: false }),

    ).toBe(true);

  });



  it('enabledInDev در محیط dev برای فیچر tier بالاتر', () => {

    expect(

      isFeatureEnabled('meeting.connect.extended', { tier: 'plus', isDev: true }),

    ).toBe(true);

  });

});



describe('getEnabledFeatures', () => {

  it('لیست فیچرهای pro', () => {

    const features = getEnabledFeatures({ tier: 'pro', isDev: false });

    expect(features).toContain('meeting.connect.extended');

    expect(features).not.toContain('enterprise.sso');

  });

});

