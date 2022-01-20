<script>
    import Chart from './Chart.svelte';
    import {onMount} from "svelte";
    import {activeKey, keyIndex, tickers} from "./stores";
    import {fly} from 'svelte/transition';
    import {flip} from 'svelte/animate';

    export let ticker;

    let apiData = {};
    let metadata = {};

    const TIME_SERIES_5MIN = 'Time Series (5min)';
    const META_DATA = 'Meta Data';

    onMount(async () => {
        fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${ticker}&interval=5min&outputsize=full&apikey=${$activeKey}`)
            .then(response => response.json())
            .then(data => {
                apiData = data[TIME_SERIES_5MIN];
                metadata = data[META_DATA];
            }).catch(error => {
            console.log(error);
        });
        keyIndex.increment();
    })

    const deleteChart = () => {
        $tickers = $tickers.filter(t => t !== ticker);
    }
</script>

<div class="stock-wrapper" transition:fly={{ y: 200, duration: 2000 }}>
    <div class="chart-header">
        <h1>{ticker}</h1>
        <div class="delete-button" on:click={deleteChart}>x</div>
    </div>
    <Chart apiData={apiData} metadata={metadata} />
</div>

<style>
    .stock-wrapper {
        background-color: var(--secondary-lightest);
        border-radius: 20px;
        padding: 30px;
        margin: 20px;
    }

    .chart-header {
        display: flex;
        justify-content: space-between;
    }

    .delete-button {
        color: var(--secondary-lightest);
        font-size: 32px;
        cursor: pointer;
    }

    .delete-button:hover {
        color: var(--primary-closer);
    }
</style>