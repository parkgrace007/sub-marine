import React from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/Header'

/**
 * EventsPage - Events and Benefits
 * Future features:
 * - Ongoing events and promotions
 * - Airdrop information
 * - Staking rewards and bonuses
 * - Community contests
 */
function EventsPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-surface-100 text-surface-600">
      <Header />
      <div className="max-w-[1280px] mx-auto relative p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('events.title')}</h1>
        <p className="text-surface-500">{t('events.subtitle')}</p>
      </div>

      {/* Placeholder Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Current Events */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>{t('events.currentEvents')}</span>
          </h3>
          <p className="text-surface-500 text-sm">
            {t('events.currentEventsDesc')}
          </p>
        </div>

        {/* Card 2: Airdrops */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>{t('events.airdrops')}</span>
          </h3>
          <p className="text-surface-500 text-sm">
            {t('events.airdropsDesc')}
          </p>
        </div>

        {/* Card 3: Staking Rewards */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>{t('events.stakingRewards')}</span>
          </h3>
          <p className="text-surface-500 text-sm">
            {t('events.stakingRewardsDesc')}
          </p>
        </div>

        {/* Card 4: Community Contests */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>{t('events.communityContests')}</span>
          </h3>
          <p className="text-surface-500 text-sm">
            {t('events.communityContestsDesc')}
          </p>
        </div>

        {/* Card 5: Referral Program */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>{t('events.referralProgram')}</span>
          </h3>
          <p className="text-surface-500 text-sm">
            {t('events.referralProgramDesc')}
          </p>
        </div>

        {/* Card 6: Special Offers */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>{t('events.specialOffers')}</span>
          </h3>
          <p className="text-surface-500 text-sm">
            {t('events.specialOffersDesc')}
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="alert alert-info">
        <div>
          <h4 className="font-semibold mb-1">{t('events.comingSoon')}</h4>
          <p className="text-sm text-surface-500">
            {t('events.comingSoonDesc')}
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}

export default EventsPage
