<script>
    import {clickOutside} from './clickOutside.js';
    import {activeKey, keyIndex, tickers} from "./stores";
    import CloseIcon from './CloseIcon.svelte';
    import {debounce} from "./helpers";
    import {MIN_TICKER_LENGTH, SEARCH_DEBOUNCE, SYMBOL, NAME} from "./constants";

    let value='';
    let selectOptions = [];

    const searchStocks = debounce((ticker) => {
        fetch(`https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${ticker}&apikey=${$activeKey}`)
            .then(response => response.json())
            .then(data => {
                selectOptions = data.bestMatches.filter(stock => !stock[SYMBOL].includes('.'));
            }).catch(error => {
            console.log(error);
        });
    }, SEARCH_DEBOUNCE);

    $: if (value.length >= MIN_TICKER_LENGTH){
        searchStocks(value);
        console.log($keyIndex, $activeKey);
        keyIndex.increment();
    }

    const addChart = (option) => {
        $tickers = [option[SYMBOL], ...$tickers];
        clearSearch();
    }

    const clearSearch = () => {
        value = '';
        selectOptions = [];
    }
</script>

<div class="select-wrapper" use:clickOutside on:click_outside={clearSearch}>
<input class="stock-input" bind:value={value} placeholder="Add stock" />
    {#if value}
        <CloseIcon onCloseClick={clearSearch} isInput="true"/>
    {/if}

    {#if selectOptions.length}
        <div class="select-options">
            {#each selectOptions as option}
                <div class="option">
                    <p class="stock-name">{`${option[NAME]} (${option[SYMBOL]})`}</p>
                    {#if (!$tickers.includes(option[SYMBOL]))}
                        <button on:click={() => addChart(option)}>Add chart</button>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .select-wrapper {
        padding-top: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 640px;
        margin: auto;
        position: relative;
    }

    .stock-input {
        background-color: #5a5a5a;
        color: #cccccc;
        margin-bottom: 0;
        border-radius: 20px;
        border: none;
        width: 100%;
        padding: 10px 20px;
        outline: none;
        position: relative;
    }

    .stock-input::placeholder {
        color: #a4a4a4;
    }

    .select-options {
        position: absolute;
        top: 52px;
        background-color: #3d3d3d;
        padding: 20px;
        border-radius: 20px;
        width: 600px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
    }

    .option {
        color: #cccccc;
        padding: 0 10px;
        display: flex;
        justify-content: space-between;
        cursor: pointer;
    }

    .option button {
        display: none;
    }

    .option:hover {
        color: white;
    }

    .option:hover button {
        display: block;
        cursor: pointer;
        white-space: nowrap;
        margin-left: 12px;
    }

    .stock-name {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }
</style>