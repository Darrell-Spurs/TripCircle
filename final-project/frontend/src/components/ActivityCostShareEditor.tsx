import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { TripMember } from '../types'

const COMMON_CURRENCIES = ['USD', 'EUR', 'GBP', 'TWD', 'JPY', 'CNY', 'KRW', 'SGD', 'HKD', 'AUD']

interface ActivityCostShareEditorProps {
  cost: number | undefined
  currency: string | undefined
  participants: TripMember[]
  costShares?: { userId: number; amount: number }[]
  onCostChange: (cost: number | undefined) => void
  onCurrencyChange: (currency: string | undefined) => void
  onCostSharesChange: (shares: { userId: number; amount: number }[] | null) => void // null means don't send (auto-calculate)
  onSplitModeChange?: (mode: 'equal' | 'custom') => void
}

type SplitMode = 'equal' | 'custom'

export default function ActivityCostShareEditor({
  cost,
  currency,
  participants,
  costShares,
  onCostChange,
  onCurrencyChange,
  onCostSharesChange,
  onSplitModeChange,
}: ActivityCostShareEditorProps) {
  const { t } = useLanguage()
  const [hasBudget, setHasBudget] = useState(!!cost)
  const [splitMode, setSplitMode] = useState<SplitMode>('equal')
  const [customAmounts, setCustomAmounts] = useState<Record<number, number>>({})

  useEffect(() => {
    if (costShares && costShares.length > 0) {
      const amounts: Record<number, number> = {}
      costShares.forEach((share) => {
        amounts[share.userId] = share.amount
      })
      setCustomAmounts(amounts)
      setSplitMode('custom')
    }
  }, [costShares])

  useEffect(() => {
    if (!hasBudget) {
      onCostChange(undefined)
      onCurrencyChange(undefined)
      onCostSharesChange(null)
      setCustomAmounts({})
    }
  }, [hasBudget, onCostChange, onCurrencyChange, onCostSharesChange])

  useEffect(() => {
    if (hasBudget && cost && participants.length > 0) {
      if (splitMode === 'equal') {
        // In equal mode, don't send cost shares - backend will auto-calculate
        onCostSharesChange(null)
      } else {
        // Custom mode - send custom amounts
        const shares = participants.map((p) => ({
          userId: p.userId,
          amount: customAmounts[p.userId] || 0,
        }))
        onCostSharesChange(shares)
      }
    } else if (!hasBudget || !cost) {
      onCostSharesChange(null)
    }
  }, [hasBudget, cost, participants, splitMode, customAmounts, onCostSharesChange])

  useEffect(() => {
    if (onSplitModeChange) {
      onSplitModeChange(splitMode)
    }
  }, [splitMode, onSplitModeChange])

  const handleCustomAmountChange = (userId: number, amount: number) => {
    setCustomAmounts((prev) => {
      const updated = {
        ...prev,
        [userId]: amount,
      }
      // Immediately update cost shares if in custom mode
      if (splitMode === 'custom' && cost && participants.length > 0) {
        const shares = participants.map((p) => ({
          userId: p.userId,
          amount: updated[p.userId] || 0,
        }))
        onCostSharesChange(shares)
      } else if (splitMode === 'equal') {
        onCostSharesChange(null)
      }
      return updated
    })
  }

  const totalCustomAmount = participants.reduce((sum, p) => sum + (customAmounts[p.userId] || 0), 0)
  const isValid = !hasBudget || (cost && (!cost || splitMode === 'equal' || Math.abs(totalCustomAmount - (cost || 0)) < 0.01))

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={hasBudget}
          onChange={(e) => setHasBudget(e.target.checked)}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <label className="text-sm font-medium text-gray-700">
          {t.activity.setBudget || 'Set budget'}
        </label>
      </div>

      {hasBudget && (
        <div className="space-y-3 pl-6 border-l-2 border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.activity.totalCost || 'Total Cost'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cost || ''}
                onChange={(e) => onCostChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.activity.currency || 'Currency'}
              </label>
              <select
                value={currency || 'USD'}
                onChange={(e) => onCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {COMMON_CURRENCIES.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {cost && participants.length > 0 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.activity.splitMode || 'Split Mode'}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="equal"
                      checked={splitMode === 'equal'}
                      onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                      className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">{t.activity.splitEqually || 'Split Equally'}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="custom"
                      checked={splitMode === 'custom'}
                      onChange={(e) => setSplitMode(e.target.value as SplitMode)}
                      className="border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm">{t.activity.customAmounts || 'Custom Amounts'}</span>
                  </label>
                </div>
              </div>

              {splitMode === 'custom' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t.activity.costPerPerson || 'Cost per Person'}
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {participants.map((participant) => (
                      <div key={participant.userId} className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1">
                          {participant.user.avatarUrl ? (
                            <img
                              src={participant.user.avatarUrl}
                              alt={participant.user.name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-xs">
                              {participant.user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-sm text-gray-700">{participant.user.name}</span>
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={customAmounts[participant.userId] || 0}
                          onChange={(e) =>
                            handleCustomAmountChange(participant.userId, parseFloat(e.target.value) || 0)
                          }
                          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <span className="text-xs text-gray-500">{currency || 'USD'}</span>
                      </div>
                    ))}
                  </div>
                  {!isValid && (
                    <p className="text-xs text-red-600">
                      {t.activity.costMismatch || 'Total custom amounts must equal total cost'}
                    </p>
                  )}
                </div>
              )}

              {splitMode === 'equal' && costShares && costShares.length > 0 && (
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">{t.activity.costBreakdown || 'Cost Breakdown'}:</p>
                  <div className="space-y-1">
                    {costShares.map((share) => {
                      const participant = participants.find((p) => p.userId === share.userId)
                      return (
                        participant && (
                          <div key={share.userId} className="flex justify-between">
                            <span>{participant.user.name}:</span>
                            <span>
                              {currency || 'USD'} {share.amount.toFixed(2)}
                            </span>
                          </div>
                        )
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

