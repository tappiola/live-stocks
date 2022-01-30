<script>
    import Chart from './Chart.svelte';
    import {onMount} from "svelte";
    import {activeKey, keyIndex, tickers} from "./stores";
    import {fly} from 'svelte/transition';
    import CloseIcon from "./CloseIcon.svelte";
    import {format, formatInTimeZone, utcToZonedTime, zonedTimeToUtc} from "date-fns-tz";
    import {addDays, addMinutes, addSeconds, differenceInDays, endOfDay, isAfter, isBefore} from "date-fns";
    import {
        LAST_REFRESHED, MAX_TIME,
        META_DATA,
        MIN_TIME,
        TIME_SERIES_5MIN,
        TIME_SERIES_DATE_FORMAT,
        TIMEZONE
    } from "./constants";

    export let ticker;

    let apiData = {};
    let metadata = {};

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

    // Free version of the API doesn't allow viewing today data.
    // We're going to apply offset to data, returned for latest available day, so it looks like today and realtime.
    const filterData = (data) => {
        if(!data || !Object.keys(data).length){
            return {};
        }

        const lastRefreshDate = zonedTimeToUtc(metadata[LAST_REFRESHED], TIMEZONE);

        const lastRefreshDay = formatInTimeZone(lastRefreshDate, TIMEZONE ,'yyyy-MM-dd');
        const tradingStartDate = zonedTimeToUtc(`${lastRefreshDay} ${MIN_TIME}`, TIMEZONE);
        const tradingEndDate = zonedTimeToUtc(`${lastRefreshDay} ${MAX_TIME}`, TIMEZONE);

        const tradingDayData = [];
        for(const [date, metrics] of Object.entries(data)){
            let dateParsed = zonedTimeToUtc(date, TIMEZONE);

            // API returns data with 5 minutes offset relative to trading start time, compensate this here
            dateParsed = addMinutes(dateParsed, -5);

            // Include only data between main trading hours (no pre-market)
            if(isAfter(dateParsed, addSeconds(tradingStartDate, -1))
                && isBefore(dateParsed, addSeconds(tradingEndDate, 1))
            )
            {
                tradingDayData.push([dateParsed, metrics]);
            }
        }

        const now = new Date();
        const todayDay = format(now, 'yyyy-MM-dd');
        const todayTradingStartDate = zonedTimeToUtc(`${todayDay} ${MIN_TIME}`, TIMEZONE);
        const todayTradingEndDate = zonedTimeToUtc(`${todayDay} ${MAX_TIME}`, TIMEZONE);
        const isTradingInProgress = isAfter(now, todayTradingStartDate) && isBefore(now, todayTradingEndDate);

        const daysOffset = isTradingInProgress
            ? differenceInDays(endOfDay(now), lastRefreshDate)
            : differenceInDays(endOfDay(now), lastRefreshDate) - 1;

        let tradingDayDataWithOffset = tradingDayData.map(([date, metrics]) => (
            [addDays(date, daysOffset), metrics]
        ));

        if(isTradingInProgress){
            tradingDayDataWithOffset = tradingDayDataWithOffset.filter(([date]) => isBefore(date, now));
        }

        const finalData = tradingDayDataWithOffset.map(([date, metrics]) => {
            const zonedTime = utcToZonedTime(date, TIMEZONE);
            return [format(zonedTime, TIME_SERIES_DATE_FORMAT, {timeZone: TIMEZONE}), metrics]
        });

        return Object.fromEntries(finalData);
    }

    $: apiDataFiltered = filterData(apiData) || {};

    $: console.log(apiDataFiltered);

    const getDayChange = (data) => {
        const records = Object.values(data);

        if (!records.length){
            return 0;
        }

        return ((records[0]['1. open'] / records[records.length - 1]['4. close'] - 1) * 100).toFixed(2);
    }

    const getCurrentPrice= (data) => {
        const records = Object.values(data);

        if (!records.length){
            return 0;
        }

        return Number(records[records.length - 1]['4. close']).toFixed(2);
    }

    $: dayChange = getDayChange(apiDataFiltered);
    $: currentPrice = getCurrentPrice(apiDataFiltered);
</script>

<div class="stock-wrapper" transition:fly={{ y: 200, duration: 2000 }}>
    <div class="chart-header">
        <div class="chart-titles">
            <h1>{ticker}</h1>
            {#if dayChange}
                <h3 class:growth={dayChange>0} class:decline={dayChange<0}>{currentPrice} ({dayChange > 0 ? '+' : '-'}{dayChange}%)</h3>
            {/if}
        </div>
        <CloseIcon onCloseClick={deleteChart} isChart="true"/>
    </div>
    <Chart apiData={apiDataFiltered} metadata={metadata} dayChange={dayChange} />
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

    .chart-titles {
        display: flex;
        align-items: end;
    }

    h1 {
        margin: 0;
        color: var(--primary-text);
    }

    h3 {
        margin: 5px 18px;
    }

    .growth {
        color: var(--growth);
    }

    .decline {
        color: var(--decline);
    }
</style>