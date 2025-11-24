// Core trading types and interfaces

export const OrderTypes = {
    MARKET: 'MARKET',
    LIMIT: 'LIMIT',
    STOP_MARKET: 'STOP_MARKET',
    STOP_LIMIT: 'STOP_LIMIT',
    TAKE_PROFIT_MARKET: 'TAKE_PROFIT_MARKET',
    TAKE_PROFIT_LIMIT: 'TAKE_PROFIT_LIMIT',
    TRAILING_STOP: 'TRAILING_STOP'
};

export const OrderSides = {
    LONG: 'LONG',
    SHORT: 'SHORT'
};

export const TriggerTypes = {
    MARK_PRICE: 'MARK_PRICE',
    LAST_PRICE: 'LAST_PRICE'
};

export const TimeInForceTypes = {
    GTC: 'GTC',
    IOC: 'IOC',
    FOK: 'FOK'
};

export const OrderStatuses = {
    PENDING: 'PENDING',
    FILLED: 'FILLED',
    PARTIALLY_FILLED: 'PARTIALLY_FILLED',
    CANCELED: 'CANCELED',
    REJECTED: 'REJECTED'
};

export const MarginModes = {
    ISOLATED: 'ISOLATED',
    CROSS: 'CROSS'
};

export const PositionModes = {
    ONE_WAY: 'ONE_WAY',
    HEDGE: 'HEDGE'
};
