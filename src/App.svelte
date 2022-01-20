<script>
	import Stock from './Stock.svelte';
    import StockSelect from "./StockSelect.svelte";
    import {tickers} from "./stores";
    import {flip} from 'svelte/animate';

	export let name;
</script>

<StockSelect/>
<div class="grid">
        {#each $tickers as ticker (ticker)}
        <Stock {ticker}/>
        {/each}
</div>

<style>
 .grid {
     display: grid;
     grid-template-columns: repeat(2, 1fr);
 }
</style>