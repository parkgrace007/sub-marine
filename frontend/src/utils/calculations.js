import Decimal from 'decimal.js';

// Configure Decimal for precision
Decimal.set({ precision: 20 });

export const calculatePnL = (
    entryPrice,
    currentPrice,
    size,
    side
) => {
    const entry = new Decimal(entryPrice);
    const current = new Decimal(currentPrice);
    const positionSize = new Decimal(size);

    let pnl;
    if (side === 'LONG') {
        pnl = current.minus(entry).times(positionSize);
    } else {
        pnl = entry.minus(current).times(positionSize);
    }

    return {
        pnl: pnl.toNumber(),
        roe: 0, // Calculated separately with leverage
    };
};

export const calculateROE = (pnl, initialMargin) => {
    if (initialMargin === 0) return 0;
    return (pnl / initialMargin) * 100;
};

export const calculateLiquidationPrice = (
    entryPrice,
    leverage,
    side,
    _walletBalance,
    maintenanceMarginRate = 0.005
) => {
    const entry = new Decimal(entryPrice);
    const lev = new Decimal(leverage);
    const mmr = new Decimal(maintenanceMarginRate);

    if (side === 'LONG') {
        const factor = new Decimal(1).minus(new Decimal(1).div(lev)).plus(mmr);
        return entry.times(factor).toNumber();
    } else {
        const factor = new Decimal(1).plus(new Decimal(1).div(lev)).minus(mmr);
        return entry.times(factor).toNumber();
    }
};

export const calculateInitialMargin = (
    price,
    size,
    leverage
) => {
    return (price * size) / leverage;
};

// === ADVANCED CALCULATIONS ===

/**
 * Calculate cross margin liquidation price across multiple positions
 */
export const calculateCrossMarginLiquidation = (
    positions,
    walletBalance,
    maintenanceMarginRate = 0.005
) => {
    if (positions.length === 0) return 0;

    // Simplified cross margin liquidation
    // In reality, this is complex with multiple positions
    // For now, return the closest liquidation price
    const liqPrices = positions.map(p => p.liquidationPrice);
    return Math.min(...liqPrices);
};

/**
 * Calculate margin ratio (risk level)
 */
export const calculateMarginRatio = (
    maintenanceMargin,
    marginBalance
) => {
    if (marginBalance === 0) return 100;
    return (maintenanceMargin / marginBalance) * 100;
};

/**
 * Calculate PnL for partial close
 */
export const calculatePartialClosePnL = (
    position,
    closeSize,
    currentPrice
) => {
    const { pnl: totalPnl } = calculatePnL(
        position.entryPrice,
        currentPrice,
        closeSize,
        position.side
    );

    const closedPercentage = closeSize / position.size;
    const returnedMargin = position.initialMargin * closedPercentage;
    const remainingSize = position.size - closeSize;

    return {
        pnl: totalPnl,
        remainingSize,
        returnedMargin: returnedMargin + totalPnl,
    };
};

/**
 * Calculate reverse position outcome
 */
export const calculateReversePosition = (
    currentPosition,
    currentPrice
) => {
    const { pnl } = calculatePnL(
        currentPosition.entryPrice,
        currentPrice,
        currentPosition.size,
        currentPosition.side
    );

    return {
        closePnl: pnl,
        newPositionSize: currentPosition.size,
        newSide: currentPosition.side === 'LONG' ? 'SHORT' : 'LONG',
    };
};

/**
 * Estimate TP/SL profit/loss
 */
export const estimateTPSLProfit = (
    position,
    tpPrice,
    slPrice,
    size
) => {
    let tpProfit = null;
    let slLoss = null;

    if (tpPrice !== null) {
        const { pnl } = calculatePnL(position.entryPrice, tpPrice, size, position.side);
        tpProfit = pnl;
    }

    if (slPrice !== null) {
        const { pnl } = calculatePnL(position.entryPrice, slPrice, size, position.side);
        slLoss = pnl;
    }

    return { tpProfit, slLoss };
};

/**
 * Calculate new liquidation price after margin adjustment
 */
export const calculateNewLiquidationAfterMarginAdjust = (
    position,
    additionalMargin,
    maintenanceMarginRate = 0.005
) => {
    const newTotalMargin = position.initialMargin + additionalMargin;
    const newLeverage = (position.entryPrice * position.size) / newTotalMargin;

    return calculateLiquidationPrice(
        position.entryPrice,
        newLeverage,
        position.side,
        0,
        maintenanceMarginRate
    );
};

/**
 * Calculate maintenance margin for a position
 */
export const calculateMaintenanceMargin = (
    positionValue,
    maintenanceMarginRate = 0.005
) => {
    return positionValue * maintenanceMarginRate;
};
