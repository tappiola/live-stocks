import {derived, readable, writable} from "svelte/store";

const stored = localStorage.tickers || '[]';

export const tickers = writable(JSON.parse(stored))

tickers.subscribe((value) => localStorage.tickers = JSON.stringify(value));

const keys = ['K4AB3MTOAMOWZFT5', 'SB1QU2HON7BH4IIA', 'D3ETRP801AA2L5I6', '26BCO6FY8VT7CCL4', 'BZXWBF278BTR53Q7'];

function createCount() {
    const { subscribe, update } = writable(0);

    return {
        subscribe,
        increment: () => update(i => (i + 1) % keys.length)
    };
}

export const keyIndex = createCount();

export const activeKey = derived(
    keyIndex,
    $keyIndex => keys[$keyIndex]
);