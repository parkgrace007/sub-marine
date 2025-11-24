import React from 'react'
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
  return (
    <div className="min-h-screen bg-surface-100 text-surface-600">
      <Header />
      <div className="max-w-[1280px] mx-auto relative p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎁 이벤트 혜택</h1>
        <p className="text-surface-500">진행 중인 이벤트 및 특별 혜택 안내</p>
      </div>

      {/* Placeholder Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Current Events */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🎯</span>
            <span>진행 중 이벤트</span>
          </h3>
          <p className="text-surface-500 text-sm">
            현재 진행 중인 이벤트와 프로모션을 확인하세요.
          </p>
        </div>

        {/* Card 2: Airdrops */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🪂</span>
            <span>에어드랍</span>
          </h3>
          <p className="text-surface-500 text-sm">
            최신 에어드랍 정보와 참여 방법을 안내합니다.
          </p>
        </div>

        {/* Card 3: Staking Rewards */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>💰</span>
            <span>스테이킹 보상</span>
          </h3>
          <p className="text-surface-500 text-sm">
            스테이킹 이벤트 및 특별 보상 프로그램을 확인하세요.
          </p>
        </div>

        {/* Card 4: Community Contests */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>🏆</span>
            <span>커뮤니티 콘테스트</span>
          </h3>
          <p className="text-surface-500 text-sm">
            커뮤니티 이벤트와 경쟁 대회에 참여하세요.
          </p>
        </div>

        {/* Card 5: Referral Program */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>👥</span>
            <span>추천 프로그램</span>
          </h3>
          <p className="text-surface-500 text-sm">
            친구를 초대하고 보상을 받으세요.
          </p>
        </div>

        {/* Card 6: Special Offers */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>⭐</span>
            <span>특별 혜택</span>
          </h3>
          <p className="text-surface-500 text-sm">
            VIP 사용자를 위한 독점 혜택과 할인을 제공합니다.
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="alert alert-info">
        <span className="text-2xl">ℹ️</span>
        <div>
          <h4 className="font-semibold mb-1">이벤트 페이지 준비 중</h4>
          <p className="text-sm text-surface-500">
            다양한 이벤트와 혜택 정보를 제공할 예정입니다. 에어드랍, 스테이킹 보상, 커뮤니티 이벤트 등을 놓치지 마세요!
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}

export default EventsPage
