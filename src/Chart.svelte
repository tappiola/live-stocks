<script>
    import Line from "svelte-chartjs/src/Line.svelte"
    import 'chartjs-adapter-date-fns';
    import {format, formatInTimeZone, zonedTimeToUtc, utcToZonedTime} from 'date-fns-tz';
    import {addDays, addSeconds, addMinutes, differenceInDays, endOfDay, isAfter, isBefore} from 'date-fns';
    export let apiData = {};
    export let metadata = {};

    const LAST_REFRESHED = '3. Last Refreshed';
    const CLOSE = '4. close';
    const VOLUME = '5. volume';

    const TIME_SERIES_DATE_FORMAT = 'yyyy-MM-dd HH:mm:ss';

    const tickerTz = 'US/Eastern';

    const getFieldData = (data, field) => Object.entries(data).reduce(
        (prev, [time, stats]) => {
            const utcDate = zonedTimeToUtc(time, tickerTz);
            const localDate = format(utcDate, TIME_SERIES_DATE_FORMAT);

            return {[localDate]: +stats[field], ...prev}
        }, {});

    // Free version of the API doesn't allow viewing today data.
    // We're going to apply offset to data, returned for latest available day, so it looks like today and realtime.
    const filterData = (data) => {
        if(!data || !Object.keys(data).length){
            return {};
        }

        // TODO: Get from https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=EL&apikey=
        const minTime = '09:30:00';
        const maxTime = '16:00:00';

        const lastRefreshDate = zonedTimeToUtc(metadata[LAST_REFRESHED], tickerTz);

        const lastRefreshDay = formatInTimeZone(lastRefreshDate, tickerTz ,'yyyy-MM-dd');
        const tradingStartDate = zonedTimeToUtc(`${lastRefreshDay} ${minTime}`, tickerTz);
        const tradingEndDate = zonedTimeToUtc(`${lastRefreshDay} ${maxTime}`, tickerTz);

        const tradingDayData = [];
        for(const [date, metrics] of Object.entries(data)){
            let dateParsed = zonedTimeToUtc(date, tickerTz);

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

        // Replace old date to make data look like today
        const now = new Date();
        const todayDay = format(now, 'yyyy-MM-dd');
        const todayTradingStartDate = zonedTimeToUtc(`${todayDay} ${minTime}`, tickerTz);
        const todayTradingEndDate = zonedTimeToUtc(`${todayDay} ${maxTime}`, tickerTz);
        const isTradingInProgress = isAfter(now, todayTradingStartDate) && isBefore(now, todayTradingEndDate);

        const daysOffset = isTradingInProgress
            ? differenceInDays(endOfDay(now), lastRefreshDate)
            : differenceInDays(endOfDay(now), lastRefreshDate) - 1;

        let tradingDayDataWithOffset = tradingDayData.map(([date, metrics]) => (
            [addDays(date, daysOffset), metrics]
        ));

        if(isTradingInProgress){
            tradingDayDataWithOffset = tradingDayDataWithOffset.filter(([date, _]) => isBefore(date, now));
        }

        const finalData = tradingDayDataWithOffset.map(([date, metrics]) => {
            const zonedTime = utcToZonedTime(date, tickerTz);
            return [format(zonedTime, TIME_SERIES_DATE_FORMAT, {timeZone: tickerTz}), metrics]
        });

        return Object.fromEntries(finalData);
    }

    $: apiDataFiltered = filterData(apiData);

    $: priceData = getFieldData(apiDataFiltered, CLOSE);

    $: volumeData = getFieldData(apiDataFiltered, VOLUME);

    const average = list => list.reduce((prev, curr) => prev + curr, 0) / list.length;

    $: avgVolume = average(Object.values(volumeData));

    $: maxVolume = Math.max(...Object.values(volumeData));

    $: datasets = [
        {
        type: "line",
        label: 'Price',
        yAxisID: 'price',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: priceData,
    },
        {
            type: "bar",
            label: 'Volume',
            yAxisID: 'volume',
            backgroundColor: '#5a5a5a',
            borderColor: '#5a5a5a',
            data: volumeData,
        }
        ]

    $: options = {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'minute',
                    displayFormats: {
                        minute: 'HH:mm'
                    },
                    stepSize: 30,
                    parser: TIME_SERIES_DATE_FORMAT,
                },
                grid: {
                    color: '#3b3b3b',
                    drawBorder: false,
                },
            },
            volume: {
                position: 'right',
                grid: {
                    display: false,
                    drawBorder: false,
                },
                ticks: {
                    display: false
                },
                max: Math.max(avgVolume * 20, maxVolume * 2) || 300000,
            },
            price: {
                position: 'left',
                grid: {
                    borderColor: '#3b3b3b',
                    color: '#3b3b3b',
                },
            }
        },
        elements: {
            point: {
                radius: 0
            }
        }
    }

</script>

<Line data={ {datasets}} options={options}/>
